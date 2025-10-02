import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { StudentRequest } from "@/dto/student/student-request.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { UserEntity } from "@/entity/user.entity.js";
import {
    StudentCreatedEvent,
    StudentEventListener,
} from "@/event/student-event-listener.js";
import { IAwardService } from "@/service/award-service.interface.js";
import { ICertificationService } from "@/service/certification-service.interface.js";
import { IMajorService } from "@/service/major-service.interface.js";
import { IStudentService } from "@/service/student-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { handleExamValidation } from "@/type/enum/exam.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

@injectable()
export class StudentService implements IStudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
        @inject(TYPES.IAwardService)
        private readonly awardService: IAwardService,
        @inject(TYPES.ICertificationService)
        private readonly certificationService: ICertificationService,
        @inject(TYPES.StudentEventListener)
        private readonly studentEventListener: StudentEventListener,
        @inject(TYPES.IMajorService)
        private readonly majorService: IMajorService,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    /**
     * Creates a student profile for an anonymous user or linked to an authenticated user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentRequest - The DTO containing the student's information.
     * @param userId - Optional ID of the authenticated user. If omitted, creates an anonymous student.
     * @returns A promise that resolves to the newly created StudentEntity, including its relations.
     * @throws {ValidationException} If the min budget is greater than the max budget.
     * @throws {EntityNotFoundException} If userId is provided but the user is not found.
     */
    public async createStudentEntity(
        studentRequest: StudentRequest,
        userId?: string,
    ): Promise<StudentEntity> {
        let userEntity: null | UserEntity = null;

        if (userId) {
            userEntity = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!userEntity) {
                throw new EntityNotFoundException(
                    `User with ID ${userId} not found`,
                );
            }
        }

        return this._buildAndSaveStudent(studentRequest, userEntity);
    }

    /**
     * Retrieves a paginated list of student profiles for a specific user.
     * @param userId - The ID of the user whose profiles are to be retrieved.
     * @param pageable - Pagination and sorting options.
     * @returns A promise that resolves to a Page of StudentEntity objects.
     */
    public async getAllStudentEntitiesByUserId(
        userId: string,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>> {
        const queryBuilder = this.studentRepository
            .createQueryBuilder("student")
            .leftJoinAndSelect("student.awards", "awards")
            .leftJoinAndSelect("student.certifications", "certifications")
            .where("student.userId = :userId", { userId });

        // Apply sorting in a cleaner way
        const sortOrder = pageable.getSort().toTypeOrmOrder();
        const prefixedSortOrder: Record<string, "ASC" | "DESC"> = {};
        for (const [field, direction] of Object.entries(sortOrder)) {
            // Prefix field with alias to avoid ambiguity
            prefixedSortOrder[`student.${field}`] = direction;
        }

        // Apply sorting or default to createdAt DESC
        if (Object.keys(prefixedSortOrder).length > 0) {
            queryBuilder.orderBy(prefixedSortOrder);
        } else {
            queryBuilder.orderBy("student.createdAt", "DESC");
        }

        // Use getManyAndCount for efficiency
        const [entities, totalElements] = await queryBuilder
            .skip(pageable.getOffset())
            .take(pageable.getPageSize())
            .getManyAndCount();

        // Let PageImpl handle the pagination logic
        return PageImpl.of(entities, totalElements, pageable);
    }

    /**
     * Retrieves a single student profile by its ID, ensuring it belongs to the specified user or guest.
     * @param studentId - The ID of the student profile.
     * @param userId - The ID of the user who must own the profile.
     * @returns A promise that resolves to the found StudentEntity.
     * @throws {EntityNotFoundException} If no matching student profile is found.
     */
    public async getStudentEntityByIdAnUserId(
        id: string,
        userId?: string,
    ): Promise<StudentEntity> {
        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: {
                    id,
                    userId: userId ?? IsNull(),
                },
            });
        if (!studentEntity) {
            throw new EntityNotFoundException(
                `Student profile with id: ${id} not found`,
            );
        }
        return studentEntity;
    }

    /**
     * Retrieves a student profile by ID along with its associated active files.
     * If a userId is provided, it ensures the profile belongs to that user.
     * Otherwise, it retrieves the profile for a guest user.
     *
     * @param studentId - The ID of the student profile to retrieve.
     * @param userId - (Optional) The ID of the user who owns the profile.
     * @returns A promise that resolves to the StudentEntity with its files.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     */
    public async getStudentWithFiles(
        studentId: string,
        userId?: string,
    ): Promise<StudentEntity> {
        const queryBuilder = this.studentRepository
            .createQueryBuilder("student")
            .leftJoinAndSelect(
                "student.files",
                "files",
                "files.status = :status",
                { status: "active" },
            )
            .leftJoinAndSelect("student.awards", "awards")
            .leftJoinAndSelect("student.certifications", "certifications")
            .leftJoinAndSelect("student.user", "user")
            .where("student.id = :studentId", { studentId });

        // If a userId is provided, find a profile owned by that user.
        if (userId) {
            queryBuilder.andWhere("student.userId = :userId", { userId });
        } else {
            // Otherwise, find a guest (anonymous) profile.
            queryBuilder
                .andWhere("student.createdBy = :createdBy", {
                    createdBy: Role.ANONYMOUS,
                })
                .andWhere("student.userId IS NULL");
        }

        const student = await queryBuilder.getOne();

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with ID ${studentId} not found`,
            );
        }

        return student;
    }

    /**
     * Private helper to build, populate, and save a student entity.
     * Handles both anonymous and authenticated user cases.
     * @param studentRequest The student data.
     * @param userEntity The authenticated user, or null for an anonymous profile.
     */
    private async _buildAndSaveStudent(
        studentRequest: StudentRequest,
        userEntity: null | UserEntity,
    ): Promise<StudentEntity> {
        this.handleAptitudeTestScoreValidation(studentRequest);

        if (studentRequest.minBudget > studentRequest.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
            });
        }

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentRequest);

        studentEntity.createdBy = userEntity
            ? userEntity.email
            : Role.ANONYMOUS;
        studentEntity.userId = userEntity ? userEntity.id : undefined;

        if (studentRequest.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentRequest.majors,
                );
        }

        if (studentRequest.awards && studentRequest.awards.length > 0) {
            studentEntity.awards = this.awardService.createAwardEntities(
                studentRequest.awards,
            );
            if (userEntity) {
                studentEntity.awards.forEach(
                    (a) => (a.createdBy = userEntity.email),
                );
            }
        }

        if (
            studentRequest.certifications &&
            studentRequest.certifications.length > 0
        ) {
            studentEntity.certifications =
                this.certificationService.createCertificationEntities(
                    studentRequest.certifications,
                );
            if (userEntity) {
                studentEntity.certifications.forEach(
                    (c) => (c.createdBy = userEntity.email),
                );
            }
        }

        const savedStudent = await this.studentRepository.save(studentEntity);
        this.logger.info(`Saved student profile id: ${savedStudent.id}`);

        this._publishStudentCreatedEvent(savedStudent.id, userEntity?.id);

        return savedStudent;
    }

    private _publishStudentCreatedEvent(
        studentId: string,
        userId?: string,
    ): void {
        const studentCreatedEvent: StudentCreatedEvent = { studentId, userId };

        // Fire-and-forget: don't await, let it run in background
        this.studentEventListener
            .handleStudentCreatedEvent(studentCreatedEvent)
            .catch((error: unknown) => {
                this.logger.error(
                    "Failed to handle student created event in background",
                    {
                        error,
                        studentId,
                        userId,
                    },
                );
            });

        this.logger.info(
            `Triggered StudentCreatedEvent for studentId ${studentId}` +
                (userId ? ` and userId ${userId}` : ""),
        );
    }

    /**
     * Handles the validation of the aptitude test score for a student request.
     * Delegates to the shared `handleExamValidation` function for core logic.
     * @param studentRequest - The DTO containing the student's information, including aptitudeTestScore.
     * @throws ValidationException if the aptitude test score is invalid.
     */
    private handleAptitudeTestScoreValidation(
        studentRequest: StudentRequest,
    ): void {
        if (!studentRequest.aptitudeTestScore) return;

        // Use the common handleExamValidation function with a prefix for the error key
        handleExamValidation(
            studentRequest.aptitudeTestScore.examType,
            studentRequest.aptitudeTestScore.score.toString(),
            "aptitudeTestScore", // This prefix will result in error keys like 'aptitudeTestScore.level'
        );
    }
}
