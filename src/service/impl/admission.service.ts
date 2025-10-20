import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { Brackets, DataSource, IsNull, SelectQueryBuilder } from "typeorm";
import { Logger } from "winston";

import { AdmissionSearchQuery } from "@/dto/admission/admission-search-query.dto.js";
import {
    AdmissionEntity,
    AdmissionField,
    ALLOWED_ADMISSION_FIELDS,
    isAdmissionField,
    isAdmissionNumericField,
} from "@/entity/uni_guide/admission.entity.js";
import { StudentAdmissionEntity } from "@/entity/uni_guide/student-admission.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IAdmissionService } from "@/service/admission-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { PageRequest } from "@/type/pagination/page-request.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";
import { Order, Sort } from "@/type/pagination/sort.js";
import { CacheKeys } from "@/util/cache-key.js";
import { config } from "@/util/validate-env.js";

export interface AdmissionQueryOptions {
    searchQuery?: AdmissionSearchQuery;
    userId?: string;
}

export interface AdmissionSearchOptions {
    filters?: Record<AdmissionField, string[]>;
    tuitionFeeRange?: TuitionFeeRange;
}

export interface TuitionFeeRange {
    max?: number;
    min?: number;
}

@injectable()
export class AdmissionService implements IAdmissionService {
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
        options: AdmissionQueryOptions,
    ): Promise<Page<AdmissionEntity>> {
        const { searchQuery, userId } = options;

        await this.validateStudentExists(studentId, userId);

        const queryBuilder = this.buildBaseStudentAdmissionQuery(
            studentId,
            userId,
        );

        // Build and apply search filters from the search query
        if (searchQuery) {
            const searchOptions = this.buildSearchOptions(searchQuery);
            this.applySearchFilters(queryBuilder, searchOptions);
        }

        // Apply sorting and get the effective pageable (with default sort if needed)
        const effectivePageable = this.applySorting(queryBuilder, pageable);

        const [studentAdmissions, totalElements] = await queryBuilder
            .skip(effectivePageable.getOffset())
            .take(effectivePageable.getPageSize())
            .getManyAndCount();

        const entities = studentAdmissions.map((sa) => sa.admission);
        return PageImpl.of(entities, totalElements, effectivePageable);
    }

    public async getAllDistinctAdmissionFieldValues(
        studentId: string,
        userId?: string,
    ): Promise<Record<AdmissionField, (number | string)[]>> {
        const cacheKey = CacheKeys.admissionFields(studentId, userId);

        try {
            const cachedResult = await this.redisClient.get(cacheKey);
            if (cachedResult) {
                return JSON.parse(cachedResult) as Record<
                    AdmissionField,
                    (number | string)[]
                >;
            }
        } catch (error) {
            this.logger.error("Redis cache get error:", error);
        }

        await this.validateStudentExists(studentId, userId);

        const query = this.buildBaseStudentAdmissionQuery(studentId, userId);

        const studentAdmissions = await query.getMany();

        // Don't cache if there are no admissions
        if (studentAdmissions.length === 0) {
            this.logger.info("No admissions found, skipping cache", {
                studentId,
            });

            const emptyResult: Partial<
                Record<AdmissionField, (number | string)[]>
            > = {};
            ALLOWED_ADMISSION_FIELDS.forEach((field) => {
                emptyResult[field] = [];
            });
            return emptyResult as Record<AdmissionField, (number | string)[]>;
        }

        // Extract admission entities and then get distinct values
        const admissionEntities = studentAdmissions.map((sa) => sa.admission);

        // Extract distinct values for all fields
        const result: Partial<Record<AdmissionField, (number | string)[]>> = {};

        ALLOWED_ADMISSION_FIELDS.forEach((field) => {
            const distinctValues = Array.from(
                new Set(admissionEntities.map((admission) => admission[field])),
            );

            // Sort appropriately based on type
            if (isAdmissionNumericField(field)) {
                result[field] = (distinctValues as number[]).sort(
                    (a, b) => a - b,
                );
            } else {
                result[field] = (distinctValues as string[]).sort();
            }
        });

        const finalResult = result as Record<
            AdmissionField,
            (number | string)[]
        >;

        try {
            await this.redisClient.setEx(
                cacheKey,
                config.CACHE_TTL_ADMISSION_FIELDS,
                JSON.stringify(finalResult),
            );
        } catch (error: unknown) {
            this.logger.error("Redis cache set error:", error);
        }

        return finalResult;
    }

    private applySearchFilters(
        queryBuilder: SelectQueryBuilder<StudentAdmissionEntity>,
        searchOptions?: AdmissionSearchOptions,
    ): void {
        if (!searchOptions) {
            return;
        }

        const { filters, tuitionFeeRange } = searchOptions;

        // Apply regular field filters
        if (filters && Object.keys(filters).length > 0) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    Object.entries(filters).forEach(([field, values]) => {
                        if (isAdmissionField(field) && values.length > 0) {
                            const paramName = `param_${field}`;

                            if (isAdmissionNumericField(field)) {
                                // For numeric fields, use IN clause for exact matches
                                const numericValues = values.map((value) =>
                                    parseInt(value, 10),
                                );
                                qb.andWhere(
                                    `admission.${field} IN (:...${paramName})`,
                                    { [paramName]: numericValues },
                                );
                            } else {
                                // For text fields, use multiple ILIKE conditions with OR
                                qb.andWhere(
                                    new Brackets((subQb) => {
                                        values.forEach((value, index) => {
                                            const indexedParamName = `${paramName}_${index.toString()}`;
                                            if (index === 0) {
                                                subQb.where(
                                                    `admission.${field} ILIKE :${indexedParamName}`,
                                                    {
                                                        [indexedParamName]: `%${value}%`,
                                                    },
                                                );
                                            } else {
                                                subQb.orWhere(
                                                    `admission.${field} ILIKE :${indexedParamName}`,
                                                    {
                                                        [indexedParamName]: `%${value}%`,
                                                    },
                                                );
                                            }
                                        });
                                    }),
                                );
                            }
                        }
                    });
                }),
            );
        }

        // Apply tuition fee range filter
        if (
            tuitionFeeRange &&
            (tuitionFeeRange.min !== undefined ||
                tuitionFeeRange.max !== undefined)
        ) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    if (tuitionFeeRange.min !== undefined) {
                        qb.andWhere("admission.tuitionFee >= :minTuition", {
                            minTuition: tuitionFeeRange.min,
                        });
                    }
                    if (tuitionFeeRange.max !== undefined) {
                        qb.andWhere("admission.tuitionFee <= :maxTuition", {
                            maxTuition: tuitionFeeRange.max,
                        });
                    }
                }),
            );
        }
    }

    private applySorting(
        queryBuilder: SelectQueryBuilder<StudentAdmissionEntity>,
        pageable: Pageable,
    ): Pageable {
        const sortOrder = pageable.getSort().toTypeOrmOrder();
        const prefixedSortOrder: Record<string, "ASC" | "DESC"> = {};

        // Filter and prefix only valid admission fields
        for (const [field, direction] of Object.entries(sortOrder)) {
            if (isAdmissionField(field)) {
                prefixedSortOrder[`admission.${field}`] = direction;
            }
        }

        let effectivePageable = pageable;

        // If no valid sort fields were found, create a new pageable with default sort
        if (Object.keys(prefixedSortOrder).length === 0) {
            const defaultSort = Sort.by(
                new Order("uniName", "ASC"),
                new Order("majorName", "ASC"),
            );

            // Create a new PageRequest with the default sort
            effectivePageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                defaultSort,
            );

            // Apply the default sort to the query
            queryBuilder
                .orderBy("admission.uniName", "ASC")
                .addOrderBy("admission.majorName", "ASC");
        } else {
            queryBuilder.orderBy(prefixedSortOrder);
        }

        return effectivePageable;
    }

    private buildBaseStudentAdmissionQuery(
        studentId: string,
        userId?: string,
    ): SelectQueryBuilder<StudentAdmissionEntity> {
        let query = this.dataSource.manager
            .createQueryBuilder(StudentAdmissionEntity, "sa")
            .innerJoinAndSelect("sa.admission", "admission")
            .innerJoin("sa.student", "student")
            .where("student.id = :studentId", { studentId });

        if (userId) {
            query = query.andWhere("student.userId = :userId", { userId });
        } else {
            query = query.andWhere("student.userId IS NULL");
        }

        return query;
    }

    /**
     * Builds a search options object from admission search query parameters.
     * Processes arrays of values for each field to create comprehensive filter objects.
     * Special handling for tuition fee range filtering.
     *
     * @param queryParams - The admission search query parameters from the HTTP request
     * @returns AdmissionSearchOptions containing filters and tuition fee range, or undefined if no filters
     */
    private buildSearchOptions(
        queryParams: AdmissionSearchQuery,
    ): AdmissionSearchOptions | undefined {
        const searchFilters = {} as Record<AdmissionField, string[]>;

        // Process regular fields (excluding tuition fee)
        ALLOWED_ADMISSION_FIELDS.filter(
            (field) => field !== "tuitionFee",
        ).forEach((field) => {
            const values = queryParams[field];
            if (values && Array.isArray(values) && values.length > 0) {
                const filteredValues = values
                    .filter(
                        (value): value is string =>
                            typeof value === "string" &&
                            value.trim().length > 0,
                    )
                    .map((value) => value.trim());

                if (filteredValues.length > 0) {
                    searchFilters[field] = filteredValues;
                }
            }
        });

        // Handle tuition fee range
        let tuitionFeeRange: TuitionFeeRange | undefined;
        if (
            queryParams.tuitionFeeMin !== undefined ||
            queryParams.tuitionFeeMax !== undefined
        ) {
            tuitionFeeRange = {};
            if (queryParams.tuitionFeeMin !== undefined) {
                tuitionFeeRange.min = queryParams.tuitionFeeMin;
            }
            if (queryParams.tuitionFeeMax !== undefined) {
                tuitionFeeRange.max = queryParams.tuitionFeeMax;
            }
        }

        // Return undefined if no search criteria provided
        if (Object.keys(searchFilters).length === 0 && !tuitionFeeRange) {
            return undefined;
        }

        return { filters: searchFilters, tuitionFeeRange };
    }

    private async validateStudentExists(
        studentId: string,
        userId?: string,
    ): Promise<void> {
        const studentRepository = this.dataSource.getRepository(StudentEntity);

        const studentExists = await studentRepository.exists({
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!studentExists) {
            throw new EntityNotFoundException(
                `Student profiles id ${studentId} not found for admissions`,
            );
        }
    }
}
