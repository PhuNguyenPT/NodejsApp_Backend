import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { Brackets, DataSource, IsNull } from "typeorm";
import { Logger } from "winston";

import {
    AdmissionEntity,
    AdmissionSearchField,
    ALLOWED_ADMISSION_SEARCH_FIELDS,
    isAdmissionNumericSearchField,
    isAdmissionSearchField,
} from "@/entity/admission.entity.js";
import { StudentAdmissionEntity } from "@/entity/student-admission.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

export interface AdmissionQueryOptions {
    searchOptions?: AdmissionSearchOptions;
    userId?: string;
}

export interface AdmissionSearchOptions {
    filters?: Record<AdmissionSearchField, string>;
}

@injectable()
export class AdmissionService {
    constructor(
        @inject(TYPES.DataSource)
        private readonly dataSource: DataSource,
        @inject(TYPES.RedisPublisher)
        private readonly redisClient: RedisClientType,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    public async getAdmissionsPageByStudentIdAndUserId(
        studentId: string,
        pageable: Pageable,
        options: AdmissionQueryOptions = {},
    ): Promise<Page<AdmissionEntity>> {
        const { searchOptions, userId } = options;

        // Get student repository from data source
        const studentRepository = this.dataSource.getRepository(StudentEntity);

        // Check if student exists (lightweight query)
        const studentExists = await studentRepository.exists({
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!studentExists) {
            throw new EntityNotFoundException(
                `Student profiles id ${studentId} not found for admissions`,
            );
        }

        // Use StudentAdmissionEntity as the main entity and join to get admission data
        const queryBuilder = this.dataSource.manager
            .createQueryBuilder(StudentAdmissionEntity, "sa")
            .innerJoinAndSelect("sa.admission", "admission")
            .innerJoin("sa.student", "student")
            .where("student.id = :studentId", { studentId });

        if (userId) {
            queryBuilder.andWhere("student.userId = :userId", { userId });
        } else {
            queryBuilder.andWhere("student.userId IS NULL");
        }

        if (
            searchOptions?.filters &&
            Object.keys(searchOptions.filters).length > 0
        ) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    Object.entries(searchOptions.filters ?? {}).forEach(
                        ([field, value]) => {
                            if (isAdmissionSearchField(field)) {
                                const paramName = `param_${field}`; // Use unique param names
                                if (isAdmissionNumericSearchField(field)) {
                                    qb.andWhere(
                                        `admission.${field} = :${paramName}`,
                                        {
                                            [paramName]: parseInt(value, 10),
                                        },
                                    );
                                } else {
                                    qb.andWhere(
                                        `admission.${field} ILIKE :${paramName}`,
                                        {
                                            [paramName]: `%${value}%`,
                                        },
                                    );
                                }
                            }
                        },
                    );
                }),
            );
        }

        const sortOrder = pageable.getSort().toTypeOrmOrder();
        const prefixedSortOrder: Record<string, "ASC" | "DESC"> = {};
        for (const [field, direction] of Object.entries(sortOrder)) {
            prefixedSortOrder[`admission.${field}`] = direction;
        }

        if (Object.keys(prefixedSortOrder).length > 0) {
            queryBuilder.orderBy(prefixedSortOrder);
        } else {
            queryBuilder
                .orderBy("admission.uniName", "ASC")
                .addOrderBy("admission.majorName", "ASC");
        }

        const [studentAdmissions, totalElements] = await queryBuilder
            .skip(pageable.getOffset())
            .take(pageable.getPageSize())
            .getManyAndCount();

        // Extract admission entities from the student admission entities
        const entities = studentAdmissions.map((sa) => sa.admission);

        return PageImpl.of(entities, totalElements, pageable);
    }

    public async getAllDistinctAdmissionFieldValues(
        studentId: string,
        userId?: string,
    ): Promise<Record<AdmissionSearchField, (number | string)[]>> {
        const cacheKey = `admission_fields:${studentId}:${userId ?? "guest"}`;

        try {
            const cachedResult = await this.redisClient.get(cacheKey);
            if (cachedResult) {
                return JSON.parse(cachedResult) as Record<
                    AdmissionSearchField,
                    (number | string)[]
                >;
            }
        } catch (error) {
            this.logger.error("Redis cache get error:", error);
        }

        // Get student repository from data source
        const studentRepository = this.dataSource.getRepository(StudentEntity);

        // Check if student exists (lightweight query)
        const studentExists = await studentRepository.exists({
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!studentExists) {
            throw new EntityNotFoundException(
                `Student profiles id ${studentId} not found for admissions`,
            );
        }

        // Updated query to use StudentAdmissionEntity with full admission data
        const studentAdmissions = await this.dataSource.manager
            .createQueryBuilder(StudentAdmissionEntity, "sa")
            .innerJoinAndSelect("sa.admission", "admission")
            .innerJoin("sa.student", "student")
            .where("student.id = :studentId", { studentId })
            .andWhere(
                userId ? "student.userId = :userId" : "student.userId IS NULL",
                userId ? { userId } : {},
            )
            .getMany();

        // Extract admission entities and then get distinct values
        const admissionEntities = studentAdmissions.map((sa) => sa.admission);

        // Extract distinct values for all fields
        const result: Partial<
            Record<AdmissionSearchField, (number | string)[]>
        > = {};

        ALLOWED_ADMISSION_SEARCH_FIELDS.forEach((field) => {
            const distinctValues = Array.from(
                new Set(admissionEntities.map((admission) => admission[field])),
            );

            // Sort appropriately based on type
            if (isAdmissionNumericSearchField(field)) {
                result[field] = (distinctValues as number[]).sort(
                    (a, b) => a - b,
                );
            } else {
                result[field] = (distinctValues as string[]).sort();
            }
        });

        const finalResult = result as Record<
            AdmissionSearchField,
            (number | string)[]
        >;

        try {
            await this.redisClient.setEx(
                cacheKey,
                1800,
                JSON.stringify(finalResult),
            );
        } catch (error: unknown) {
            this.logger.error("Redis cache set error:", error);
        }

        return finalResult;
    }
}
