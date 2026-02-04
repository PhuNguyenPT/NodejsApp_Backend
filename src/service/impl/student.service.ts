import type { RedisClientType } from "redis";

import { instanceToPlain, plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { DataSource, IsNull } from "typeorm";
import { Logger } from "winston";

import type { Config } from "@/config/app.config.js";
import type { IStudentEventListener } from "@/event/student-event-listener.interface.js";
import type { StudentCreatedEvent } from "@/event/student.event.js";
import type { ICertificationService } from "@/service/certification-service.interface.js";
import type { IMajorService } from "@/service/major-service.interface.js";
import type { IStudentService } from "@/service/student-service.interface.js";
import type { UUID } from "@/type/common/uuid.type.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

import { StudentRequest } from "@/dto/student/student-request.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AcademicPerformanceEntity } from "@/entity/uni_guide/academic-performance.entity.js";
import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { CertificationEntity } from "@/entity/uni_guide/certification.entity.js";
import { ConductEntity } from "@/entity/uni_guide/conduct.entity.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { NationalExamEntity } from "@/entity/uni_guide/national-exam.enity.js";
import { StudentMajorGroupEntity } from "@/entity/uni_guide/student-major-group.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TalentExamEntity } from "@/entity/uni_guide/talent-exam.entity.js";
import { VnuhcmScoreComponentEntity } from "@/entity/uni_guide/vnuhcm-score-component.entity.js";
import { VsatExamEntity } from "@/entity/uni_guide/vsat-exam.entity.js";
import { TYPES } from "@/type/container/types.js";
import { DGNLType } from "@/type/enum/exam-type.enum.js";
import { Role } from "@/type/enum/user.enum.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { CacheKeys } from "@/util/cache-key.js";

@injectable()
export class StudentService implements IStudentService {
    constructor(
        @inject(TYPES.Config) private readonly config: Config,
        @inject(TYPES.RedisPublisher)
        private readonly redisClient: RedisClientType,
        @inject(TYPES.DataSource)
        private readonly dataSource: DataSource,
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
    public async create(
        studentRequest: StudentRequest,
        userId?: UUID,
    ): Promise<StudentEntity> {
        let userEntity: null | UserEntity = null;

        if (userId) {
            userEntity = await this.dataSource
                .getRepository(UserEntity)
                .findOne({
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
    public async getAllByUserId(
        userId: UUID,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>> {
        const queryBuilder = this.dataSource
            .getRepository(StudentEntity)
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
    public async getByIdAndUserId(
        id: UUID,
        userId?: UUID,
    ): Promise<StudentEntity> {
        const cacheKey = CacheKeys.studentProfile(id, userId);
        const cached = await this.redisClient.get(cacheKey);

        if (cached) {
            this.logger.debug(`Cache hit for student profile ${id}`);
            const data: unknown = JSON.parse(cached);
            return plainToInstance(StudentEntity, data);
        }

        this.logger.debug(`Cache miss for student profile ${id}`);

        const studentEntity = await this.dataSource
            .getRepository(StudentEntity)
            .findOne({
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

        const [
            academicPerformances,
            aptitudeExamsWithComponents,
            awards,
            certifications,
            conducts,
            nationalExams,
            talentExams,
            vsatExams,
        ] = await Promise.all([
            this.dataSource.getRepository(AcademicPerformanceEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(AptitudeExamEntity).find({
                relations: ["vnuhcmScoreComponents"],
                where: { studentId: id },
            }),
            this.dataSource.getRepository(AwardEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(CertificationEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(ConductEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(NationalExamEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(TalentExamEntity).find({
                where: { studentId: id },
            }),
            this.dataSource.getRepository(VsatExamEntity).find({
                where: { studentId: id },
            }),
        ]);

        studentEntity.academicPerformances = academicPerformances;
        studentEntity.aptitudeExams = aptitudeExamsWithComponents;
        studentEntity.awards = awards;
        studentEntity.certifications = certifications;
        studentEntity.conducts = conducts;
        studentEntity.nationalExams = nationalExams;
        studentEntity.talentExams = talentExams;
        studentEntity.vsatExams = vsatExams;

        await this.redisClient.setEx(
            cacheKey,
            this.config.CACHE_TTL_STUDENT_IN_SECONDS,
            JSON.stringify(instanceToPlain(studentEntity)),
        );

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
    public async getWithFiles(
        studentId: UUID,
        userId?: UUID,
    ): Promise<StudentEntity> {
        // 1. Fetch the Student and all its standard relations (using the existing method)
        const student = await this.getByIdAndUserId(studentId, userId);

        // 2. Fetch ONLY the active files using find
        const activeFilesMetadata = await this.dataSource
            .getRepository(FileEntity)
            .find({
                where: {
                    status: FileStatus.ACTIVE,
                    studentId: studentId,
                },
            });

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

        const studentRepository = this.dataSource.getRepository(StudentEntity);
        const studentEntity: StudentEntity =
            studentRepository.create(studentRequest);

        studentEntity.createdBy = userEntity
            ? userEntity.email
            : Role.ANONYMOUS;
        studentEntity.user = userEntity ?? undefined;

        if (studentRequest.academicPerformances.length > 0) {
            studentEntity.academicPerformances =
                studentRequest.academicPerformances.map(
                    (academicPerformanceRequest) => {
                        const academicPerformanceEntity: AcademicPerformanceEntity =
                            this.dataSource
                                .getRepository(AcademicPerformanceEntity)
                                .create(academicPerformanceRequest);
                        if (userEntity) {
                            academicPerformanceEntity.createdBy =
                                userEntity.email;
                        } else {
                            academicPerformanceEntity.createdBy ??=
                                Role.ANONYMOUS;
                        }
                        return academicPerformanceEntity;
                    },
                );
        }

        if (
            studentRequest.aptitudeExams &&
            studentRequest.aptitudeExams.length > 0
        ) {
            studentEntity.aptitudeExams = studentRequest.aptitudeExams.map(
                (aptitudeExamRequest) => {
                    const aptitudeExamEntity: AptitudeExamEntity =
                        this.dataSource
                            .getRepository(AptitudeExamEntity)
                            .create(aptitudeExamRequest);
                    if (userEntity) {
                        aptitudeExamEntity.createdBy = userEntity.email;
                    } else {
                        aptitudeExamEntity.createdBy ??= Role.ANONYMOUS;
                    }

                    if (
                        aptitudeExamRequest.examType === DGNLType.VNUHCM &&
                        aptitudeExamRequest.languageScore &&
                        aptitudeExamRequest.mathScore &&
                        aptitudeExamRequest.scienceLogic &&
                        aptitudeExamRequest.score ===
                            aptitudeExamRequest.languageScore +
                                aptitudeExamRequest.mathScore +
                                aptitudeExamRequest.scienceLogic
                    ) {
                        const vnuhcmComponents: VnuhcmScoreComponentEntity =
                            this.dataSource
                                .getRepository(VnuhcmScoreComponentEntity)
                                .create(aptitudeExamRequest);

                        if (userEntity) {
                            vnuhcmComponents.createdBy = userEntity.email;
                        } else {
                            vnuhcmComponents.createdBy ??= Role.ANONYMOUS;
                        }
                        aptitudeExamEntity.vnuhcmScoreComponents =
                            vnuhcmComponents;
                    }
                    return aptitudeExamEntity;
                },
            );
        }

        if (studentRequest.awards && studentRequest.awards.length > 0) {
            studentEntity.awards = studentRequest.awards.map((awardRequest) => {
                const awardEntity: AwardEntity = this.dataSource
                    .getRepository(AwardEntity)
                    .create(awardRequest);
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
                    const conductEntity: ConductEntity = this.dataSource
                        .getRepository(ConductEntity)
                        .create(conductRequest);
                    if (userEntity) {
                        conductEntity.createdBy = userEntity.email;
                    } else {
                        conductEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return conductEntity;
                },
            );
        }

        if (studentRequest.majors.length > 0) {
            const majorGroupEntities =
                await this.majorService.findMajorGroupEntitiesBy(
                    studentRequest.majors,
                );

            studentEntity.studentMajorGroups = majorGroupEntities.map(
                (majorGroup) => {
                    const studentMajorGroup: StudentMajorGroupEntity =
                        this.dataSource
                            .getRepository(StudentMajorGroupEntity)
                            .create({
                                majorGroup: majorGroup,
                            });
                    if (userEntity) {
                        studentMajorGroup.createdBy = userEntity.email;
                    } else {
                        studentMajorGroup.createdBy ??= Role.ANONYMOUS;
                    }
                    return studentMajorGroup;
                },
            );
        }

        if (studentRequest.nationalExams.length > 0) {
            studentEntity.nationalExams = studentRequest.nationalExams.map(
                (nationalExam) => {
                    const nationalExamEntity: NationalExamEntity =
                        this.dataSource
                            .getRepository(NationalExamEntity)
                            .create(nationalExam);
                    if (userEntity) {
                        nationalExamEntity.createdBy = userEntity.email;
                    } else {
                        nationalExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return nationalExamEntity;
                },
            );
        }

        if (
            studentRequest.talentExams &&
            studentRequest.talentExams.length > 0
        ) {
            studentEntity.talentExams = studentRequest.talentExams.map(
                (talentExam) => {
                    const talentExamEntity: TalentExamEntity = this.dataSource
                        .getRepository(TalentExamEntity)
                        .create(talentExam);
                    if (userEntity) {
                        talentExamEntity.createdBy = userEntity.email;
                    } else {
                        talentExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return talentExamEntity;
                },
            );
        }

        if (studentRequest.vsatExams && studentRequest.vsatExams.length > 0) {
            studentEntity.vsatExams = studentRequest.vsatExams.map(
                (vsatExam) => {
                    const vsatExamEntity: VsatExamEntity = this.dataSource
                        .getRepository(VsatExamEntity)
                        .create(vsatExam);
                    if (userEntity) {
                        vsatExamEntity.createdBy = userEntity.email;
                    } else {
                        vsatExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return vsatExamEntity;
                },
            );
        }

        const savedStudent = await studentRepository.save(studentEntity);
        this.logger.info(`Saved student profile id: ${savedStudent.id}`);

        this._publishStudentCreatedEvent(savedStudent.id, userEntity?.id);

        return savedStudent;
    }

    private _publishStudentCreatedEvent(studentId: UUID, userId?: UUID): void {
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
