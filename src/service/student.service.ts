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
     * @returns The newly created StudentEntity, including its relations.
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

        // Create the main student entity from the DTO.
        const studentEntity: StudentEntity =
            this.studentRepository.create(studentInfoDTO);
        studentEntity.createdBy = Role.ANONYMOUS;

        if (studentInfoDTO.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentInfoDTO.majors,
                );
        }
        // If awards exist, create entities and attach them directly to the student entity.
        // The cascade option on the relation will handle the save.
        if (studentInfoDTO.awards && studentInfoDTO.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentInfoDTO.awards,
            );
        }

        // Do the same for certifications.
        if (
            studentInfoDTO.certifications &&
            studentInfoDTO.certifications.length > 0
        ) {
            studentEntity.certifications = this.certificationService.create(
                studentInfoDTO.certifications,
            );
        }

        // A SINGLE save operation handles the student, awards, and certifications
        // thanks to the `{ cascade: true }` option in the StudentEntity definition.
        const savedStudent = await this.studentRepository.save(studentEntity);

        this.logger.info(
            `Create Anonymous Student Profile id: ${savedStudent.id} successfully`,
        );

        // The 'save' method returns the fully populated entity, so no extra 'findOne' is needed.
        return savedStudent;
    }

    /**
     * Creates a student profile linked to an authenticated user.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @param studentInfoDTO - The DTO containing the student's information.
     * @param userId - The ID of the authenticated user.
     * @returns The newly created StudentEntity, including its relations.
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

        // Create the main student entity from the DTO.
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
        // If awards exist, create entities, set audit fields, and attach them.
        if (studentInfoDTO.awards && studentInfoDTO.awards.length > 0) {
            studentEntity.awards = this.awardService.create(
                studentInfoDTO.awards,
            );
            studentEntity.awards.forEach(
                (awardEntity) => (awardEntity.createdBy = userEntity.email),
            );
        }

        // If certifications exist, create entities, set audit fields, and attach them.
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

        // A SINGLE save operation handles everything.
        const savedStudent = await this.studentRepository.save(studentEntity);

        this.logger.info(
            `Create Student Profile id: ${savedStudent.id} with User id: ${userId} successfully`,
        );

        // Return the saved entity directly. It already contains the new relations.
        return savedStudent;
    }

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

    public async getStudentEntityByUserId(
        profileId: string,
        userId: string,
    ): Promise<StudentEntity> {
        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: {
                    id: profileId,
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

        if (userId) {
            queryBuilder.andWhere("student.userId = :userId", { userId });
        }

        const student = await queryBuilder.getOne();

        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${studentId} not found`,
            );
        }

        return student;
    }
}
