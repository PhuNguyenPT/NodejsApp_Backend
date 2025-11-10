import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { StudentRequest } from "@/dto/student/student-request.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { StudentAptitudeExamEntity } from "@/entity/uni_guide/student-aptitude-exam.entity.js";
import { StudentConductEntity } from "@/entity/uni_guide/student-conduct.entity.js";
import { StudentNationalExamEntity } from "@/entity/uni_guide/student-national-exam.enity.js";
import { StudentTalentExamEntity } from "@/entity/uni_guide/student-talent-exam.entity.js";
import { StudentVsatExamEntity } from "@/entity/uni_guide/student-vsat-exam.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IStudentEventListener } from "@/event/student-event-listener.interface.js";
import { StudentCreatedEvent } from "@/event/student.event.js";
import { ICertificationService } from "@/service/certification-service.interface.js";
import { IMajorService } from "@/service/major-service.interface.js";
import { IStudentService } from "@/service/student-service.interface.js";
import { TYPES } from "@/type/container/types.js";
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
        @inject(TYPES.StudentAptitudeExamRepository)
        private readonly studentAptitudeExamRepository: Repository<StudentAptitudeExamEntity>,
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentConductRepository)
        private readonly studentConductRepository: Repository<StudentConductEntity>,
        @inject(TYPES.StudentNationalExamRepository)
        private readonly studentNationalExamRepository: Repository<StudentNationalExamEntity>,
        @inject(TYPES.StudentTalentExamRepository)
        private readonly studentTalentExamRepository: Repository<StudentTalentExamEntity>,
        @inject(TYPES.StudentVsatExamRepository)
        private readonly studentVsatExamRepository: Repository<StudentVsatExamEntity>,
        @inject(TYPES.ICertificationService)
        private readonly certificationService: ICertificationService,
        @inject(TYPES.IStudentEventListener)
        private readonly studentEventListener: IStudentEventListener,
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
            .createQueryBuilder("students")
            .where("students.userId = :userId", { userId });

        // Apply sorting in a cleaner way
        const sortOrder = pageable.getSort().toTypeOrmOrder();
        const prefixedSortOrder: Record<string, "ASC" | "DESC"> = {};
        for (const [field, direction] of Object.entries(sortOrder)) {
            // Prefix field with alias to avoid ambiguity
            prefixedSortOrder[`students.${field}`] = direction;
        }

        // Apply sorting or default to createdAt DESC
        if (Object.keys(prefixedSortOrder).length > 0) {
            queryBuilder.orderBy(prefixedSortOrder);
        } else {
            queryBuilder.orderBy("students.createdAt", "DESC");
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
                relations: [
                    "academicPerformances",
                    "aptitudeExams",
                    "awards",
                    "certifications",
                    "conducts",
                    "majorGroupsEntities",
                    "nationalExams",
                    "talentExams",
                    "vsatExams",
                ],
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
        // 1. Fetch the Student and all its standard relations (using the existing method)
        const student = await this.getStudentEntityByIdAnUserId(
            studentId,
            userId,
        );

        // 2. Fetch ONLY the active files using a dedicated, fast query
        const activeFilesMetadata = await this.fileRepository
            .createQueryBuilder("files")
            .where("files.studentId = :studentId", { studentId })
            .andWhere("files.status = :status", { status: FileStatus.ACTIVE })
            .getMany();

        // 3. Attach the result
        student.files = activeFilesMetadata;

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

        if (
            studentRequest.aptitudeExams &&
            studentRequest.aptitudeExams.length > 0
        ) {
            studentEntity.aptitudeExams = studentRequest.aptitudeExams.map(
                (aptitudeExamRequest) => {
                    const studentAptitudeTestEntity: StudentAptitudeExamEntity =
                        this.studentAptitudeExamRepository.create(
                            aptitudeExamRequest,
                        );
                    studentAptitudeTestEntity.student = studentEntity;
                    if (userEntity) {
                        studentAptitudeTestEntity.createdBy = userEntity.email;
                    } else {
                        studentAptitudeTestEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentAptitudeTestEntity;
                },
            );
        }

        if (studentRequest.awards && studentRequest.awards.length > 0) {
            studentEntity.awards = studentRequest.awards.map((awardRequest) => {
                const awardEntity: AwardEntity =
                    this.awardRepository.create(awardRequest);
                awardEntity.student = studentEntity;
                if (userEntity) {
                    awardEntity.createdBy = userEntity.email;
                } else {
                    awardEntity.createdBy ??= Role.ANONYMOUS;
                }
                return awardEntity;
            });
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

        if (studentRequest.conducts.length > 0) {
            studentEntity.conducts = studentRequest.conducts.map(
                (conductRequest) => {
                    const studentConductEntity: StudentConductEntity =
                        this.studentConductRepository.create(conductRequest);
                    if (userEntity) {
                        studentConductEntity.createdBy = userEntity.email;
                    } else {
                        studentConductEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentConductEntity;
                },
            );
        }

        if (studentRequest.majors.length > 0) {
            studentEntity.majorGroupsEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentRequest.majors,
                );
        }

        if (studentRequest.nationalExams.length > 0) {
            studentEntity.nationalExams = studentRequest.nationalExams.map(
                (nationalExam) => {
                    const studentNationalExamEntity: StudentNationalExamEntity =
                        this.studentNationalExamRepository.create(nationalExam);
                    if (userEntity) {
                        studentNationalExamEntity.createdBy = userEntity.email;
                    } else {
                        studentNationalExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentNationalExamEntity;
                },
            );
        }

        if (
            studentRequest.talentExams &&
            studentRequest.talentExams.length > 0
        ) {
            studentEntity.talentExams = studentRequest.talentExams.map(
                (talentExam) => {
                    const studentTalentExamEntity: StudentTalentExamEntity =
                        this.studentTalentExamRepository.create(talentExam);
                    if (userEntity) {
                        studentTalentExamEntity.createdBy = userEntity.email;
                    } else {
                        studentTalentExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentTalentExamEntity;
                },
            );
        }

        if (studentRequest.vsatExams && studentRequest.vsatExams.length > 0) {
            studentEntity.vsatExams = studentRequest.vsatExams.map(
                (vsatExam) => {
                    const studentVsatExamEntity: StudentVsatExamEntity =
                        this.studentVsatExamRepository.create(vsatExam);
                    if (userEntity) {
                        studentVsatExamEntity.createdBy = userEntity.email;
                    } else {
                        studentVsatExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentVsatExamEntity;
                },
            );
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
}
