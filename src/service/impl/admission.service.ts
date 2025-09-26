import { inject, injectable } from "inversify";
import { Brackets, IsNull, Repository } from "typeorm";

import {
    AdmissionEntity,
    AdmissionSearchField,
    isAdmissionNumericSearchField,
    isAdmissionSearchField,
} from "@/entity/admission.entity.js";
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
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
    ) {}

    public async getAdmissionsPageByStudentIdAndUserId(
        studentId: string,
        pageable: Pageable,
        options: AdmissionQueryOptions = {},
    ): Promise<Page<AdmissionEntity>> {
        const { searchOptions, userId } = options;

        const studentExists = await this.studentRepository.exists({
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!studentExists) {
            throw new EntityNotFoundException(
                `Student profiles id ${studentId} not found for admissions`,
            );
        }

        const queryBuilder = this.studentRepository.manager
            .createQueryBuilder(AdmissionEntity, "admission")
            .innerJoin(
                "student_admissions",
                "se",
                "se.admission_id = admission.id",
            )
            .innerJoin("students", "student", "student.id = se.student_id")
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

        const [entities, totalElements] = await queryBuilder
            .skip(pageable.getOffset())
            .take(pageable.getPageSize())
            .getManyAndCount();

        return PageImpl.of(entities, totalElements, pageable);
    }
}
