import type { RedisClientType } from "redis";

import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import type { IStudentEventListener } from "@/event/student-event-listener.interface.js";
import type { StudentCreatedEvent } from "@/event/student.event.js";
import type { ICertificationService } from "@/service/certification-service.interface.js";
import type { IMajorService } from "@/service/major-service.interface.js";
import type { IStudentService } from "@/service/student-service.interface.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

import { StudentRequest } from "@/dto/student/student-request.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AcademicPerformanceEntity } from "@/entity/uni_guide/academic-performance.entity.js";
import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { ConductEntity } from "@/entity/uni_guide/conduct.entity.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { NationalExamEntity } from "@/entity/uni_guide/national-exam.enity.js";
import { StudentMajorGroupEntity } from "@/entity/uni_guide/student-major-group.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TalentExamEntity } from "@/entity/uni_guide/talent-exam.entity.js";
import { VnuhcmScoreComponentEntity } from "@/entity/uni_guide/vnuhcm-score-component.entity.js";
import { VsatExamEntity } from "@/entity/uni_guide/vsat-exam.entity.js";
import { TYPES } from "@/type/container/types.js";
import { ExamType } from "@/type/enum/exam-type.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { CacheKeys } from "@/util/cache-key.js";
@injectable()
export class StudentService implements IStudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
        @inject(TYPES.AcademicPerformanceRepository)
        private readonly academicPerformanceRepository: Repository<AcademicPerformanceEntity>,
        @inject(TYPES.AptitudeExamRepository)
        private readonly aptitudeExamRepository: Repository<AptitudeExamEntity>,
        @inject(TYPES.StudentMajorGroupRepository)
        private readonly studentMajorGroupRepository: Repository<StudentMajorGroupEntity>,
        @inject(TYPES.VnuhcmScoreComponentRepository)
        private readonly vnuhcmScoreComponentRepository: Repository<VnuhcmScoreComponentEntity>,
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.ConductRepository)
        private readonly conductRepository: Repository<ConductEntity>,
        @inject(TYPES.NationalExamRepository)
        private readonly nationalExamRepository: Repository<NationalExamEntity>,
        @inject(TYPES.TalentExamRepository)
        private readonly talentExamRepository: Repository<TalentExamEntity>,
        @inject(TYPES.VsatExamRepository)
        private readonly vsatExamRepository: Repository<VsatExamEntity>,
        @inject(TYPES.ICertificationService)
        private readonly certificationService: ICertificationService,
        @inject(TYPES.IStudentEventListener)
        private readonly studentEventListener: IStudentEventListener,
        @inject(TYPES.IMajorService)
        private readonly majorService: IMajorService,
        @inject(TYPES.RedisPublisher)
        private readonly redis: RedisClientType,
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
                transaction: true,
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
        const cacheKey = CacheKeys.studentProfile(id, userId);

        // 1. Try to get from cache
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache HIT for ${cacheKey}`);
                const parsed: unknown = JSON.parse(cached);
                const entity = plainToInstance(StudentEntity, parsed);
                return entity;
            }
        } catch (error) {
            this.logger.warn(`Redis cache read error for ${cacheKey}:`, error);
        }

        // 2. Cache miss - query database
        this.logger.debug(`Cache MISS for ${cacheKey}`);

        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: [
                    "academicPerformances",
                    "aptitudeExams",
                    "aptitudeExams.vnuhcmScoreComponents",
                    "awards",
                    "certifications",
                    "conducts",
                    "nationalExams",
                    "talentExams",
                    "vsatExams",
                ],
                transaction: true,
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

        // 3. Store in cache
        try {
            await this.redis.setEx(
                cacheKey,
                3600,
                JSON.stringify(studentEntity),
            );
            this.logger.debug(`Cached student ${id}`);
        } catch (error) {
            this.logger.warn(`Redis cache write error for ${cacheKey}:`, error);
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

        // 2. Fetch ONLY the active files using find
        const activeFilesMetadata = await this.fileRepository.find({
            transaction: true,
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

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentRequest);

        studentEntity.createdBy = userEntity
            ? userEntity.email
            : Role.ANONYMOUS;
        studentEntity.user = userEntity ?? undefined;

        if (studentRequest.academicPerformances.length > 0) {
            studentEntity.academicPerformances =
                studentRequest.academicPerformances.map(
                    (academicPerformanceRequest) => {
                        const academicPerformanceEntity: AcademicPerformanceEntity =
                            this.academicPerformanceRepository.create(
                                academicPerformanceRequest,
                            );
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
                        this.aptitudeExamRepository.create(aptitudeExamRequest);
                    if (userEntity) {
                        aptitudeExamEntity.createdBy = userEntity.email;
                    } else {
                        aptitudeExamEntity.createdBy ??= Role.ANONYMOUS;
                    }

                    if (
                        aptitudeExamRequest.examType === ExamType.VNUHCM &&
                        aptitudeExamRequest.languageScore &&
                        aptitudeExamRequest.mathScore &&
                        aptitudeExamRequest.scienceLogic &&
                        aptitudeExamRequest.score ===
                            aptitudeExamRequest.languageScore +
                                aptitudeExamRequest.mathScore +
                                aptitudeExamRequest.scienceLogic
                    ) {
                        const vnuhcmComponents: VnuhcmScoreComponentEntity =
                            this.vnuhcmScoreComponentRepository.create(
                                aptitudeExamRequest,
                            );

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
                const awardEntity: AwardEntity =
                    this.awardRepository.create(awardRequest);
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
                    const conductEntity: ConductEntity =
                        this.conductRepository.create(conductRequest);
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
                        this.studentMajorGroupRepository.create({
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
                        this.nationalExamRepository.create(nationalExam);
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
                    const talentExamEntity: TalentExamEntity =
                        this.talentExamRepository.create(talentExam);
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
                    const vsatExamEntity: VsatExamEntity =
                        this.vsatExamRepository.create(vsatExam);
                    if (userEntity) {
                        vsatExamEntity.createdBy = userEntity.email;
                    } else {
                        vsatExamEntity.createdBy ??= Role.ANONYMOUS;
                    }
                    return vsatExamEntity;
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
