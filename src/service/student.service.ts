import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { defaultPaginationConfig } from "@/config/pagination.config.js";
import { StudentInfoDTO } from "@/dto/student/student.info.dto.js";
import { AwardEntity } from "@/entity/award.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import { AwardService } from "@/service/award.service.js";
import { CertificationService } from "@/service/certification.service.js";
import { MajorService } from "@/service/major.service.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ILogger } from "@/type/interface/logger.js";
import { Page } from "@/type/pagination/page.js";
import { Pageable } from "@/type/pagination/pageable.js";

@injectable()
export class StudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
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
    ) {}

    /**
     * Creates a student profile for an anonymous user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentInfoDTO - The DTO containing the student's information.
     * @returns A promise that resolves to the newly created StudentEntity, including its relations.
     * @throws {ValidationException} If the min budget is greater than the max budget.
     */
    public async createStudentEntity(
        studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentEntity> {
        if (studentInfoDTO.minBudget > studentInfoDTO.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
            });
        }

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentInfoDTO);
        studentEntity.createdBy = Role.ANONYMOUS;

        if (studentInfoDTO.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentInfoDTO.majors,
                );
        }

        if (studentInfoDTO.awards && studentInfoDTO.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentInfoDTO.awards,
            );
        }

        if (
            studentInfoDTO.certifications &&
            studentInfoDTO.certifications.length > 0
        ) {
            studentEntity.certifications = this.certificationService.create(
                studentInfoDTO.certifications,
            );
        }

        const savedStudent = await this.studentRepository.save(studentEntity);
        this.logger.info(
            `Create Anonymous Student Profile id: ${savedStudent.id} successfully`,
        );
        return savedStudent;
    }

    /**
     * Creates a student profile linked to an authenticated user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentInfoDTO - The DTO containing the student's information.
     * @param userId - The ID of the authenticated user.
     * @returns A promise that resolves to the newly created StudentEntity, including its relations.
     * @throws {ValidationException} If budget is invalid or userId is missing.
     * @throws {EntityNotFoundException} If the user with the given ID is not found.
     */
    public async createStudentEntityByUserId(
        studentInfoDTO: StudentInfoDTO,
        userId: string,
    ): Promise<StudentEntity> {
        if (studentInfoDTO.minBudget > studentInfoDTO.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
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
            this.studentRepository.create(studentInfoDTO);
        studentEntity.userId = userId;
        studentEntity.createdBy = userEntity.email;

        if (studentInfoDTO.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentInfoDTO.majors,
                );
        }

        if (studentInfoDTO.awards && studentInfoDTO.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentInfoDTO.awards,
            );
            studentEntity.awards.forEach(
                (awardEntity) => (awardEntity.createdBy = userEntity.email),
            );
        }

        if (
            studentInfoDTO.certifications &&
            studentInfoDTO.certifications.length > 0
        ) {
            studentEntity.certifications = this.certificationService.create(
                studentInfoDTO.certifications,
            );
            studentEntity.certifications.forEach(
                (cert) => (cert.createdBy = userEntity.email),
            );
        }

        const savedStudent = await this.studentRepository.save(studentEntity);
        this.logger.info(
            `Create Student Profile id: ${savedStudent.id} with User id: ${userId} successfully`,
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

        const totalElements = await queryBuilder.getCount();
        const page = pageable.page ?? defaultPaginationConfig.defaultPage;
        const size = pageable.getLimit();

        if (totalElements === 0) {
            return new Page<StudentEntity>([], page, size, 0);
        }

        const totalPages = Math.ceil(totalElements / size);
        if (page > totalPages) {
            return new Page<StudentEntity>([], page, size, totalElements);
        }

        const sortConfig = pageable.getParsedSort();
        if (sortConfig) {
            const fieldMapping: Record<string, string> = {
                createdAt: "student.createdAt",
                location: "student.location",
                major: "student.major",
                maxBudget: "student.maxBudget",
                minBudget: "student.minBudget",
                modifiedAt: "student.modifiedAt",
            };
            const sortField =
                fieldMapping[sortConfig.field] || `student.${sortConfig.field}`;
            queryBuilder.orderBy(sortField, sortConfig.direction);
        } else {
            queryBuilder.orderBy("student.createdAt", "DESC");
        }

        const entities = await queryBuilder
            .skip(pageable.getOffset())
            .take(size)
            .getMany();

        return new Page<StudentEntity>(entities, page, size, totalElements);
    }

    /**
     * Retrieves a single student profile by its ID, ensuring it belongs to the specified user.
     * @param studentId - The ID of the student profile.
     * @param userId - The ID of the user who must own the profile.
     * @returns A promise that resolves to the found StudentEntity.
     * @throws {EntityNotFoundException} If no matching student profile is found.
     */
    public async getStudentEntityByUserId(
        studentId: string,
        userId: string,
    ): Promise<StudentEntity> {
        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: {
                    id: studentId,
                    userId: userId,
                },
            });
        if (!studentEntity) {
            throw new EntityNotFoundException(
                `Student profile with user id: ${userId} not found`,
            );
        }
        return studentEntity;
    }

    /**
     * Retrieves a single student profile by its ID for a guest user (no ownership check).
     * @param studentId - The ID of the student profile.
     * @returns A promise that resolves to the found StudentEntity.
     * @throws {EntityNotFoundException} If no student profile with the given ID is found.
     */
    public async getStudentEntityGuest(
        studentId: string,
    ): Promise<StudentEntity> {
        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: {
                    id: studentId,
                },
            });
        if (!studentEntity) {
            throw new EntityNotFoundException(
                `Student profile with id: ${studentId} not found`,
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
            .where("student.id = :studentId", { studentId });

        const student = await queryBuilder.getOne();
        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${studentId} not found`,
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
                `Student with ID ${studentId} not found`,
            );
        }
        return student;
    }
}
