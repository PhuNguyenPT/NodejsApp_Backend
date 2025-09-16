import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { AdmissionEntity } from "@/entity/admission.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { Page } from "@/type/pagination/page.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

@injectable()
export class AdmissionService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
    ) {}

    public async getAdmissionsPageByStudentIdAndUserId(
        studentId: string,
        userId: string,
        pageable: Pageable,
    ): Promise<Page<AdmissionEntity>> {
        // Verify student exists and belongs to user
        const studentExists = await this.studentRepository.exists({
            where: { id: studentId, userId: userId },
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
            .where("student.id = :studentId", { studentId })
            .andWhere("student.userId = :userId", { userId });

        // Get total count
        const totalElements = await queryBuilder.getCount();
        const pageNumber = pageable.getPageNumber();
        const pageSize = pageable.getPageSize();

        // Handle empty result set
        if (totalElements === 0) {
            // Page.empty should use 0-indexed page number internally
            return Page.empty<AdmissionEntity>(pageNumber, pageSize);
        }

        // Calculate total pages and validate page number
        const totalPages = Math.ceil(totalElements / pageSize);

        // Check if requested page exists (compare with 0-indexed page)
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

        // Apply pagination using correct offset
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
