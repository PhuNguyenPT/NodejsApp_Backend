import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { IsNull, Repository } from "typeorm";

import { StudentRequest } from "@/dto/student/student.request.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import {
    PREDICTION_CHANNEL,
    StudentCreatedEvent,
} from "@/event/prediction.model.event.listener.service.js";
import { AwardService } from "@/service/award.service.js";
import { CertificationService } from "@/service/certification.service.js";
import { MajorService } from "@/service/major.service.js";
import { TYPES } from "@/type/container/types.js";
import { handleExamValidation } from "@/type/enum/exam.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ILogger } from "@/type/interface/logger.js";
import { Page } from "@/type/pagination/page.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";
// import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/util/jwt.options.js";

@injectable()
export class StudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
        @inject(TYPES.AwardService)
        private readonly awardService: AwardService,
        @inject(TYPES.CertificationService)
        private readonly certificationService: CertificationService,
        @inject(TYPES.MajorService)
        private readonly majorService: MajorService,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
        @inject(TYPES.RedisPublisher) private redisPublisher: RedisClientType,
    ) {}

    /**
     * Creates a student profile for an anonymous user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentRequest - The DTO containing the student's information.
     * @returns A promise that resolves to the newly created StudentEntity, including its relations.
     * @throws {ValidationException} If the min budget is greater than the max budget.
     */
    public async createStudentEntity(
        studentRequest: StudentRequest,
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
        studentEntity.createdBy = Role.ANONYMOUS;

        if (studentRequest.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentRequest.majors,
                );
        }

        if (studentRequest.awards && studentRequest.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentRequest.awards,
            );
        }

        if (
            studentRequest.certifications &&
            studentRequest.certifications.length > 0
        ) {
            studentEntity.certifications =
                this.certificationService.createCertificationEntities(
                    studentRequest.certifications,
                );
        }

        const savedStudent = await this.studentRepository.save(studentEntity);

        this.logger.info(
            `Create Anonymous Student Profile id: ${savedStudent.id} successfully`,
        );

        const payload: StudentCreatedEvent = {
            studentId: savedStudent.id,
            userId: undefined,
        };

        await this.redisPublisher.publish(
            PREDICTION_CHANNEL,
            JSON.stringify(payload),
        );

        this.logger.info(
            `Published single StudentCreatedEvent event to ${PREDICTION_CHANNEL} with studentId ${savedStudent.id}.`,
        );

        return savedStudent;
    }
    /**
     * Creates a student profile linked to an authenticated user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentRequest - The DTO containing the student's information.
     * @param userId - The ID of the authenticated user.
     * @returns A promise that resolves to the newly created StudentEntity, including its relations.
     * @throws {ValidationException} If budget is invalid or userId is missing.
     * @throws {EntityNotFoundException} If the user with the given ID is not found.
     */
    public async createStudentEntityByUserId(
        studentRequest: StudentRequest,
        userId: string,
    ): Promise<StudentEntity> {
        this.handleAptitudeTestScoreValidation(studentRequest);

        if (studentRequest.minBudget > studentRequest.maxBudget) {
            throw new ValidationException({
                minBudget: "Min budget cannot be greater than max budget",
            });
        }
        if (!userId) {
            throw new ValidationException({
                userId: "User ID is required to create a student profile",
            });
        }
        const userEntity = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!userEntity) {
            throw new EntityNotFoundException(
                `User with ID ${userId} not found`,
            );
        }

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentRequest);
        studentEntity.userId = userId;
        studentEntity.createdBy = userEntity.email;

        if (studentRequest.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentRequest.majors,
                );
        }

        if (studentRequest.awards && studentRequest.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentRequest.awards,
            );
            studentEntity.awards.forEach(
                (awardEntity) => (awardEntity.createdBy = userEntity.email),
            );
        }

        if (
            studentRequest.certifications &&
            studentRequest.certifications.length > 0
        ) {
            studentEntity.certifications =
                this.certificationService.createCertificationEntities(
                    studentRequest.certifications,
                );
            studentEntity.certifications.forEach(
                (cert) => (cert.createdBy = userEntity.email),
            );
        }

        const savedStudent = await this.studentRepository.save(studentEntity);
        this.logger.info(
            `Create Student Profile id: ${savedStudent.id} with User id: ${userId} successfully`,
        );

        const payload: StudentCreatedEvent = {
            studentId: savedStudent.id,
            userId: userId,
        };

        await this.redisPublisher.publish(
            PREDICTION_CHANNEL,
            JSON.stringify(payload),
        );

        this.logger.info(
            `Published single StudentCreatedEvent event to ${PREDICTION_CHANNEL} with studentId ${savedStudent.id} and userId ${userId}.`,
        );
        return savedStudent;
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

        // Get total count first
        const totalElements = await queryBuilder.getCount();
        const pageNumber = pageable.getPageNumber();
        const pageSize = pageable.getPageSize();

        // Handle empty result set
        if (totalElements === 0) {
            return Page.empty<StudentEntity>(pageNumber, pageSize);
        }

        // Calculate total pages and check if requested page exists
        const totalPages = Math.ceil(totalElements / pageSize);
        if (pageNumber >= totalPages) {
            return new Page<StudentEntity>(
                [],
                pageNumber,
                pageSize,
                totalElements,
            );
        }

        // Apply sorting using the toTypeOrmOrder method from Pageable
        const sortOrder = pageable.getSort().toTypeOrmOrder();

        if (Object.keys(sortOrder).length > 0) {
            // Define field mapping for student entity
            const fieldMapping: Record<string, string> = {
                createdAt: "student.createdAt",
                location: "student.location",
                major: "student.major",
                maxBudget: "student.maxBudget",
                minBudget: "student.minBudget",
                modifiedAt: "student.modifiedAt",
            };

            // Apply each sort field
            let isFirst = true;
            for (const [field, direction] of Object.entries(sortOrder)) {
                const mappedField = fieldMapping[field] || `student.${field}`;
                if (isFirst) {
                    queryBuilder.orderBy(mappedField, direction);
                    isFirst = false;
                } else {
                    queryBuilder.addOrderBy(mappedField, direction);
                }
            }
        } else {
            // Default sorting when no sort is specified
            queryBuilder.orderBy("student.createdAt", "DESC");
        }

        // Apply pagination using correct offset
        const entities = await queryBuilder
            .skip(pageable.getOffset())
            .take(pageSize)
            .getMany();

        // Return Page instance using the static factory method
        return Page.of<StudentEntity>(
            entities,
            pageNumber,
            pageSize,
            totalElements,
        );
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
                // cache: {
                //     id: `student_cache_${id}`,
                //     milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                // },
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
     * Retrieves a student profile by ID along with its associated active files for a guest user.
     * @param studentId - The ID of the student to retrieve.
     * @returns A promise that resolves to the StudentEntity with its files.
     * @throws {EntityNotFoundException} If the student is not found.
     */
    public async getStudentGuestWithFiles(
        studentId: string,
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
            .where("student.id = :studentId", { studentId })
            .andWhere("student.createdBy = :createdBy", {
                createdBy: Role.ANONYMOUS,
            })
            .andWhere("student.userId IS NULL");
        const student = await queryBuilder.getOne();
        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with ID ${studentId} not found`,
            );
        }
        return student;
    }

    /**
     * Retrieves a student profile by ID along with its associated active files, ensuring it belongs to the specified user.
     * @param studentId - The ID of the student profile to retrieve.
     * @param userId - The ID of the user who owns the profile.
     * @returns A promise that resolves to the StudentEntity with its files.
     * @throws {EntityNotFoundException} If the student is not found or does not belong to the user.
     */
    public async getStudentWithFiles(
        studentId: string,
        userId: string,
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
            .where("student.id = :studentId", { studentId })
            .andWhere("student.userId = :userId", { userId });

        const student = await queryBuilder.getOne();
        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with ID ${studentId} not found`,
            );
        }
        return student;
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
