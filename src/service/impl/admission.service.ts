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
import { Page } from "@/type/pagination/page.js";
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

        // Verify student exists and belongs to user
        const studentExists = await this.studentRepository.exists({
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!studentExists) {
            throw new EntityNotFoundException(
                `Student profiles id ${studentId} not found for admissions`,
            );
        }

        // Query admissions directly through the junction table
        const queryBuilder = this.studentRepository.manager
            .createQueryBuilder(AdmissionEntity, "admission")
            .innerJoin(
                "student_admissions",
                "se",
                "se.admission_id = admission.id",
            )
            .innerJoin("students", "student", "student.id = se.student_id")
            .where("student.id = :studentId", { studentId });

        // Handle userId condition properly for both authenticated and guest users
        if (userId) {
            queryBuilder.andWhere("student.userId = :userId", { userId });
        } else {
            queryBuilder.andWhere("student.userId IS NULL");
        }

        // Add search functionality
        if (
            searchOptions?.filters &&
            Object.keys(searchOptions.filters).length > 0
        ) {
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    Object.entries(searchOptions.filters ?? {}).forEach(
                        ([field, value]) => {
                            if (isAdmissionSearchField(field)) {
                                if (isAdmissionNumericSearchField(field)) {
                                    // Exact matching for numeric fields
                                    qb.andWhere(
                                        `admission.${field} = :${field}`,
                                        {
                                            [field]: parseInt(value, 10),
                                        },
                                    );
                                } else {
                                    // Pattern matching for text fields
                                    const searchTerm = `%${value}%`;
                                    qb.andWhere(
                                        `admission.${field} ILIKE :${field}`,
                                        {
                                            [field]: searchTerm,
                                        },
                                    );
                                }
                            }
                        },
                    );
                }),
            );
        }

        // Get total count with search applied
        const totalElements = await queryBuilder.getCount();
        const pageNumber = pageable.getPageNumber();
        const pageSize = pageable.getPageSize();

        // Handle empty result set
        if (totalElements === 0) {
            return Page.empty<AdmissionEntity>(pageNumber, pageSize);
        }

        // Calculate total pages and validate page number
        const totalPages = Math.ceil(totalElements / pageSize);

        // Check if requested page exists
        if (pageNumber >= totalPages) {
            return new Page<AdmissionEntity>(
                [],
                pageNumber,
                pageSize,
                totalElements,
            );
        }

        // Apply sorting
        const sortOrder = pageable.getSort().toTypeOrmOrder();
        if (Object.keys(sortOrder).length > 0) {
            let isFirst = true;
            for (const [field, direction] of Object.entries(sortOrder)) {
                const mappedField = `admission.${field}`;
                if (isFirst) {
                    queryBuilder.orderBy(mappedField, direction);
                    isFirst = false;
                } else {
                    queryBuilder.addOrderBy(mappedField, direction);
                }
            }
        } else {
            // Default sorting
            queryBuilder
                .orderBy("admission.uniName", "ASC")
                .addOrderBy("admission.majorName", "ASC");
        }

        // Apply pagination
        const entities = await queryBuilder
            .skip(pageable.getOffset())
            .take(pageSize)
            .getMany();

        return Page.of<AdmissionEntity>(
            entities,
            pageNumber,
            pageSize,
            totalElements,
        );
    }
}
