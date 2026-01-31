import type { RedisClientType } from "redis";

// test/integration/service/student-service.integration.spec.ts
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { type DataSource, Repository } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IStudentService } from "@/service/student-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { StudentRequest } from "@/dto/student/student-request.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { getApp } from "@/test/setup.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";
import { AcademicPerformance } from "@/type/enum/academic-performance.enum.js";
import { Conduct } from "@/type/enum/conduct.enum.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam-type.enum.js";
import { MajorGroup } from "@/type/enum/major.enum.js";
import { NationalExamSubjects } from "@/type/enum/national-exam-subject.enum.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.enum.js";
import { Rank } from "@/type/enum/rank.enum.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.enum.js";
import { VietnameseSubject } from "@/type/enum/subject.enum.js";
import { UniType } from "@/type/enum/uni-type.enum.js";
import { Role } from "@/type/enum/user.enum.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.enum.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageRequest } from "@/type/pagination/page-request.js";
import { Order, Sort } from "@/type/pagination/sort.js";
import { CacheKeys } from "@/util/cache-key.js";

describe("StudentService Integration Tests", () => {
    let dataSource: DataSource;
    let studentService: IStudentService;
    let studentRepository: Repository<StudentEntity>;
    let userRepository: Repository<UserEntity>;
    let fileRepository: Repository<FileEntity>;
    let redisClient: RedisClientType;

    const createdStudentIds: UUID[] = [];
    const createdUserIds: UUID[] = [];

    let testUser: UserEntity;

    beforeAll(async () => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        studentService = iocContainer.get<IStudentService>(
            TYPES.IStudentService,
        );
        redisClient = iocContainer.get<RedisClientType>(TYPES.RedisPublisher);
        studentRepository = dataSource.getRepository(StudentEntity);
        userRepository = dataSource.getRepository(UserEntity);
        fileRepository = dataSource.getRepository(FileEntity);

        // Create a test user
        testUser = userRepository.create({
            email: `test_student_service_${Date.now().toString()}@example.com`,
            password: "hashedPassword123",
            role: Role.USER,
        });
        testUser = await userRepository.save(testUser);
        createdUserIds.push(testUser.id);
    });

    afterAll(async () => {
        // Clean up students (cascading will handle related entities)
        for (const studentId of createdStudentIds) {
            await studentRepository.delete(studentId);
        }

        // Clean up users and their caches
        for (const userId of createdUserIds) {
            await userRepository.delete(userId);
            await redisClient.del(CacheKeys.user(userId));
        }

        const allStudentIds = [
            ...createdStudentIds,
            "00000000-0000-0000-0000-000000000000",
        ];

        for (const studentId of allStudentIds) {
            const pattern = `student_profile:${studentId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    });

    describe("create", () => {
        it("should create a basic student profile for authenticated user", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student).toBeDefined();
            expect(student.id).toBeDefined();
            expect(student.minBudget).toBe(10000000);
            expect(student.maxBudget).toBe(50000000);
            expect(student.createdBy).toBe(testUser.email);
            expect(student.user?.id).toBe(testUser.id);
            expect(student.province).toBe(VietnamSouthernProvinces.HO_CHI_MINH);
            expect(student.uniType).toBe(UniType.PUBLIC);
        });

        it("should create an anonymous student profile", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.BUSINESS_AND_MANAGEMENT],
                    maxBudget: 80000000,
                    minBudget: 20000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.LICH_SU, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );

            // Act
            const student = await studentService.create(studentRequest);
            createdStudentIds.push(student.id);

            // Assert
            expect(student).toBeDefined();
            expect(student.id).toBeDefined();
            expect(student.createdBy).toBe(Role.ANONYMOUS);
            expect(student.user).toBeUndefined();
        });

        it("should throw ValidationException when minBudget > maxBudget", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 100000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act & Assert
            await expect(
                studentService.create(studentRequest, testUser.id),
            ).rejects.toThrow(ValidationException);
        });

        it("should throw EntityNotFoundException for non-existent user", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const nonExistentUserId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act & Assert
            await expect(
                studentService.create(studentRequest, nonExistentUserId),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should create student with academic performances", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.academicPerformances).toBeDefined();
            expect(student.academicPerformances).toHaveLength(3);
            student.academicPerformances?.forEach((ap) => {
                expect(ap.academicPerformance).toStrictEqual(
                    AcademicPerformance.GOOD,
                );
                expect([10, 11, 12]).toContain(ap.grade);
                expect(ap.createdBy).toStrictEqual(testUser.email);
            });
        });

        it("should create student with aptitude exams including VNUHCM components", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    aptitudeExams: [
                        {
                            examType: DGNLType.VNUHCM,
                            languageScore: 350,
                            mathScore: 200,
                            scienceLogic: 150,
                            score: 700,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.aptitudeExams).toBeDefined();
            expect(student.aptitudeExams).toHaveLength(1);
            student.aptitudeExams?.forEach((ae) => {
                expect(ae.score).toBe(700);
                expect(ae.vnuhcmScoreComponents).toBeDefined();
                expect(ae.vnuhcmScoreComponents?.languageScore).toBe(350);
                expect(ae.vnuhcmScoreComponents?.mathScore).toBe(200);
                expect(ae.vnuhcmScoreComponents?.scienceLogic).toBe(150);
            });
        });

        it("should create student with awards", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    awards: [
                        {
                            category:
                                NationalExcellentStudentExamSubject.MATHEMATICS,
                            level: Rank.FIRST,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                        {
                            category:
                                NationalExcellentStudentExamSubject.PHYSICS,
                            level: Rank.SECOND,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                        {
                            category:
                                NationalExcellentStudentExamSubject.CHEMISTRY,
                            level: Rank.THIRD,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                    ],
                    certifications: [],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.MATHEMATICS_AND_STATISTICS],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.awards).toBeDefined();
            expect(student.awards).toHaveLength(3);
            const mathAward = student.awards?.find(
                (a) =>
                    a.category ===
                    NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(mathAward).toBeDefined();
            expect(mathAward?.level).toBe(Rank.FIRST);
            expect(mathAward?.name).toBe(NationalExcellentExamType.NATIONAL);
            expect(mathAward?.createdBy).toBe(testUser.email);

            const physicsAward = student.awards?.find(
                (a) =>
                    a.category === NationalExcellentStudentExamSubject.PHYSICS,
            );
            expect(physicsAward).toBeDefined();
            expect(physicsAward?.level).toBe(Rank.SECOND);
            expect(physicsAward?.name).toBe(NationalExcellentExamType.NATIONAL);
            expect(physicsAward?.createdBy).toBe(testUser.email);

            const chemistryAward = student.awards?.find(
                (a) =>
                    a.category ===
                    NationalExcellentStudentExamSubject.CHEMISTRY,
            );
            expect(chemistryAward).toBeDefined();
            expect(chemistryAward?.level).toBe(Rank.THIRD);
            expect(chemistryAward?.name).toBe(
                NationalExcellentExamType.NATIONAL,
            );
            expect(chemistryAward?.createdBy).toBe(testUser.email);
        });

        it("should create student with conducts", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.conducts).toBeDefined();
            expect(student.conducts).toHaveLength(3);
            student.conducts?.forEach((conduct) => {
                expect(conduct.conduct).toBe(Conduct.GOOD);
                expect([10, 11, 12]).toContain(conduct.grade);
                expect(conduct.createdBy).toBe(testUser.email);
            });
        });

        it("should create student with national exams", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.MATHEMATICS_AND_STATISTICS],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 9.5 },
                        { name: VietnameseSubject.NGU_VAN, score: 8.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                        { name: VietnameseSubject.VAT_LY, score: 8.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.nationalExams).toBeDefined();
            expect(student.nationalExams).toHaveLength(4);
            student.nationalExams?.forEach((nationalExam) => {
                expect(NationalExamSubjects).toContain(nationalExam.name);
                expect(nationalExam.score).toBeGreaterThanOrEqual(0);
            });
        });

        it("should create student with talent exams", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ARTS],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    talentExams: [
                        { name: VietnameseSubject.VE_MY_THUAT, score: 8.5 },
                    ],
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.talentExams).toBeDefined();
            expect(student.talentExams).toHaveLength(1);
            student.talentExams?.forEach((talentExam) => {
                expect(talentExam.name).toBe(VietnameseSubject.VE_MY_THUAT);
            });
        });

        it("should create student with VSAT exams", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.ENGINEERING],
                    maxBudget: 50000000,
                    minBudget: 10000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.VAT_LY, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                    vsatExams: [
                        { name: VietnameseSubject.TOAN, score: 120 },
                        { name: VietnameseSubject.NGU_VAN, score: 130 },
                        { name: VietnameseSubject.TIENG_ANH, score: 125 },
                    ],
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.vsatExams).toBeDefined();
            expect(student.vsatExams).toHaveLength(3);

            // Verify individual VSAT exam items
            const vsatToan = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.TOAN,
            );
            expect(vsatToan).toBeDefined();
            expect(vsatToan?.score).toBe(120);
            expect(vsatToan?.createdBy).toBe(testUser.email);

            const vsatNguVan = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.NGU_VAN,
            );
            expect(vsatNguVan).toBeDefined();
            expect(vsatNguVan?.score).toBe(130);
            expect(vsatNguVan?.createdBy).toBe(testUser.email);

            const vsatTiengAnh = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.TIENG_ANH,
            );
            expect(vsatTiengAnh).toBeDefined();
            expect(vsatTiengAnh?.score).toBe(125);
            expect(vsatTiengAnh?.createdBy).toBe(testUser.email);

            // Verify all VSAT exams have createdBy set
            student.vsatExams?.forEach((vsatExam) => {
                expect(vsatExam.createdBy).toBe(testUser.email);
                expect(vsatExam.score).toBeGreaterThan(0);
            });
        });

        it("should create comprehensive student with all relations", async () => {
            // Arrange
            const studentRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    aptitudeExams: [
                        {
                            examType: DGNLType.VNUHCM,
                            languageScore: 350,
                            mathScore: 200,
                            scienceLogic: 150,
                            score: 700,
                        },
                    ],
                    awards: [
                        {
                            category:
                                NationalExcellentStudentExamSubject.MATHEMATICS,
                            level: Rank.FIRST,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                    ],
                    certifications: [],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [
                        MajorGroup.ENGINEERING,
                        MajorGroup.NATURAL_SCIENCES,
                    ],
                    maxBudget: 100000000,
                    minBudget: 30000000,
                    nationalExams: [
                        { name: VietnameseSubject.VAT_LY, score: 9.0 },
                        { name: VietnameseSubject.TOAN, score: 9.5 },
                        { name: VietnameseSubject.HOA_HOC, score: 8.5 },
                        { name: VietnameseSubject.NGU_VAN, score: 8.0 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    uniType: UniType.PUBLIC,
                },
            );
            const validationErrors = await validate(studentRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                studentRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert
            expect(student.academicPerformances).toHaveLength(3);
            expect(student.aptitudeExams).toHaveLength(1);
            expect(student.awards).toHaveLength(1);
            expect(student.conducts).toHaveLength(3);
            expect(student.nationalExams).toHaveLength(4);
        });

        it("should validate and process ALL StudentRequest fields correctly", async () => {
            // Arrange - Create a student with EVERY possible field populated
            const comprehensiveRequest: StudentRequest = plainToInstance(
                StudentRequest,
                {
                    // Required: Academic Performances (3 items with different values for each grade)
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance:
                                AcademicPerformance.SATISFACTORY,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.PASSED,
                            grade: 12,
                        },
                    ],
                    // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                    aptitudeExams: [
                        {
                            examType: DGNLType.VNUHCM,
                            languageScore: 350,
                            mathScore: 200,
                            scienceLogic: 150,
                            score: 700,
                        },
                        {
                            examType: DGNLType.HSA,
                            score: 95,
                        },
                    ],
                    // Optional: Awards (multiple awards with different categories and levels)
                    awards: [
                        {
                            category:
                                NationalExcellentStudentExamSubject.MATHEMATICS,
                            level: Rank.FIRST,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                        {
                            category:
                                NationalExcellentStudentExamSubject.PHYSICS,
                            level: Rank.SECOND,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                        {
                            category:
                                NationalExcellentStudentExamSubject.ENGLISH,
                            level: Rank.THIRD,
                            name: NationalExcellentExamType.NATIONAL,
                        },
                    ],
                    // Optional: Certifications (language and other certifications)
                    certifications: [
                        {
                            examType: CCNNType.IELTS,
                            level: "7.5",
                        },
                        {
                            examType: CCNNType.TOEFL_iBT,
                            level: "105",
                        },
                        {
                            examType: CCQTType.SAT,
                            level: "1450",
                        },
                    ],
                    // Required: Conducts (3 items with different values for each grade)
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.SATISFACTORY, grade: 11 },
                        { conduct: Conduct.PASSED, grade: 12 },
                    ],
                    // Required: Majors (multiple major groups, 1-3 items)
                    majors: [
                        MajorGroup.ENGINEERING,
                        MajorGroup.NATURAL_SCIENCES,
                        MajorGroup.MATHEMATICS_AND_STATISTICS,
                    ],
                    // Required: Budget (with maxBudget > minBudget)
                    maxBudget: 150000000,
                    minBudget: 50000000,
                    // Required: National Exams (exactly 4 subjects with varied scores)
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 9.5 },
                        { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                        { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                        { name: VietnameseSubject.VAT_LY, score: 8.75 },
                    ],
                    // Required: Province
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    // Optional: Special Student Cases (multiple cases)
                    specialStudentCases: [
                        SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                        SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                    ],
                    // Optional: Talent Exams (multiple talent subjects)
                    talentExams: [
                        { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                        { name: VietnameseSubject.HAT, score: 8.5 },
                        { name: VietnameseSubject.DOC_DIEN_CAM, score: 8.75 },
                    ],
                    // Required: University Type
                    uniType: UniType.PUBLIC,
                    // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                    vsatExams: [
                        { name: VietnameseSubject.TOAN, score: 140 },
                        { name: VietnameseSubject.NGU_VAN, score: 135 },
                        { name: VietnameseSubject.TIENG_ANH, score: 145 },
                        { name: VietnameseSubject.VAT_LY, score: 130 },
                        { name: VietnameseSubject.HOA_HOC, score: 138 },
                    ],
                },
            );
            const validationErrors = await validate(comprehensiveRequest);
            expect(validationErrors).toHaveLength(0);

            // Act
            const student = await studentService.create(
                comprehensiveRequest,
                testUser.id,
            );
            createdStudentIds.push(student.id);

            // Assert - Verify ALL fields are correctly saved

            // 1. Academic Performances
            expect(student.academicPerformances).toBeDefined();
            expect(student.academicPerformances).toHaveLength(3);
            expect(student.academicPerformances?.[0].academicPerformance).toBe(
                AcademicPerformance.GOOD,
            );
            expect(student.academicPerformances?.[0].grade).toBe(10);
            expect(student.academicPerformances?.[1].academicPerformance).toBe(
                AcademicPerformance.SATISFACTORY,
            );
            expect(student.academicPerformances?.[1].grade).toBe(11);
            expect(student.academicPerformances?.[2].academicPerformance).toBe(
                AcademicPerformance.PASSED,
            );
            expect(student.academicPerformances?.[2].grade).toBe(12);
            student.academicPerformances?.forEach((ap) => {
                expect(ap.createdBy).toBe(testUser.email);
            });

            // 2. Aptitude Exams
            expect(student.aptitudeExams).toBeDefined();
            expect(student.aptitudeExams).toHaveLength(2);
            // VNUHCM exam with components
            const vnuhcmExam = student.aptitudeExams?.find(
                (e) => e.examType === DGNLType.VNUHCM,
            );
            expect(vnuhcmExam).toBeDefined();
            expect(vnuhcmExam?.score).toBe(700);
            expect(vnuhcmExam?.vnuhcmScoreComponents).toBeDefined();
            expect(vnuhcmExam?.vnuhcmScoreComponents?.languageScore).toBe(350);
            expect(vnuhcmExam?.vnuhcmScoreComponents?.mathScore).toBe(200);
            expect(vnuhcmExam?.vnuhcmScoreComponents?.scienceLogic).toBe(150);
            // HSA exam
            const hsaExam = student.aptitudeExams?.find(
                (e) => e.examType === DGNLType.HSA,
            );
            expect(hsaExam).toBeDefined();
            expect(hsaExam?.score).toBe(95);

            // 3. Awards
            expect(student.awards).toBeDefined();
            expect(student.awards).toHaveLength(3);
            const mathAward = student.awards?.find(
                (a) =>
                    a.category ===
                    NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(mathAward).toBeDefined();
            expect(mathAward?.level).toBe(Rank.FIRST);
            expect(mathAward?.name).toBe(NationalExcellentExamType.NATIONAL);
            const physicsAward = student.awards?.find(
                (a) =>
                    a.category === NationalExcellentStudentExamSubject.PHYSICS,
            );
            expect(physicsAward).toBeDefined();
            expect(physicsAward?.level).toBe(Rank.SECOND);
            const englishAward = student.awards?.find(
                (a) =>
                    a.category === NationalExcellentStudentExamSubject.ENGLISH,
            );
            expect(englishAward).toBeDefined();
            expect(englishAward?.level).toBe(Rank.THIRD);
            student.awards?.forEach((award) => {
                expect(award.createdBy).toBe(testUser.email);
            });

            // 4. Certifications
            expect(student.certifications).toBeDefined();
            expect(student.certifications).toHaveLength(3);
            const ielts = student.certifications?.find(
                (c) => c.examType === CCNNType.IELTS,
            );
            expect(ielts).toBeDefined();
            expect(ielts?.level).toBe("7.5");
            const toefl = student.certifications?.find(
                (c) => c.examType === CCNNType.TOEFL_iBT,
            );
            expect(toefl).toBeDefined();
            expect(toefl?.level).toBe("105");
            const sat = student.certifications?.find(
                (c) => c.examType === CCQTType.SAT,
            );
            expect(sat).toBeDefined();
            expect(sat?.level).toBe("1450");

            // 5. Conducts
            expect(student.conducts).toBeDefined();
            expect(student.conducts).toHaveLength(3);
            expect(student.conducts?.[0].conduct).toBe(Conduct.GOOD);
            expect(student.conducts?.[0].grade).toBe(10);
            expect(student.conducts?.[1].conduct).toBe(Conduct.SATISFACTORY);
            expect(student.conducts?.[1].grade).toBe(11);
            expect(student.conducts?.[2].conduct).toBe(Conduct.PASSED);
            expect(student.conducts?.[2].grade).toBe(12);
            student.conducts?.forEach((conduct) => {
                expect(conduct.createdBy).toBe(testUser.email);
            });

            // 6. Majors
            expect(student.majors).toBeDefined();
            expect(student.majors).toHaveLength(3);
            expect(student.majors).toContain(MajorGroup.ENGINEERING);
            expect(student.majors).toContain(MajorGroup.NATURAL_SCIENCES);
            expect(student.majors).toContain(
                MajorGroup.MATHEMATICS_AND_STATISTICS,
            );

            // 7. Budget
            expect(student.minBudget).toBeDefined();
            expect(student.maxBudget).toBeDefined();
            expect(student.minBudget).toBe(50000000);
            expect(student.maxBudget).toBe(150000000);

            const minBudget = student.minBudget ?? 0;
            const maxBudget = student.maxBudget ?? 0;
            expect(minBudget).toBeLessThan(maxBudget);

            // 8. National Exams
            expect(student.nationalExams).toBeDefined();
            expect(student.nationalExams).toHaveLength(4);
            const toanExam = student.nationalExams?.find(
                (e) => e.name === VietnameseSubject.TOAN,
            );
            expect(toanExam?.score).toBe(9.5);
            const nguVanExam = student.nationalExams?.find(
                (e) => e.name === VietnameseSubject.NGU_VAN,
            );
            expect(nguVanExam?.score).toBe(8.5);
            const tiengAnhExam = student.nationalExams?.find(
                (e) => e.name === VietnameseSubject.TIENG_ANH,
            );
            expect(tiengAnhExam?.score).toBe(9.0);
            const vatLyExam = student.nationalExams?.find(
                (e) => e.name === VietnameseSubject.VAT_LY,
            );
            expect(vatLyExam?.score).toBe(8.75);

            // 9. Province
            expect(student.province).toBe(VietnamSouthernProvinces.HO_CHI_MINH);

            // 10. Special Student Cases
            expect(student.specialStudentCases).toBeDefined();
            expect(student.specialStudentCases).toHaveLength(2);
            expect(student.specialStudentCases).toContain(
                SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
            );
            expect(student.specialStudentCases).toContain(
                SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
            );

            // 11. Talent Exams
            expect(student.talentExams).toBeDefined();
            expect(student.talentExams).toHaveLength(3);
            const veMyThuatExam = student.talentExams?.find(
                (e) => e.name === VietnameseSubject.VE_MY_THUAT,
            );
            expect(veMyThuatExam?.score).toBe(9.0);
            const hatExam = student.talentExams?.find(
                (e) => e.name === VietnameseSubject.HAT,
            );
            expect(hatExam?.score).toBe(8.5);
            const docDienCamExam = student.talentExams?.find(
                (e) => e.name === VietnameseSubject.DOC_DIEN_CAM,
            );
            expect(docDienCamExam?.score).toBe(8.75);

            // 12. University Type
            expect(student.uniType).toBe(UniType.PUBLIC);

            // 13. VSAT Exams
            expect(student.vsatExams).toBeDefined();
            expect(student.vsatExams).toHaveLength(5);
            const vsatToan = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.TOAN,
            );
            expect(vsatToan?.score).toBe(140);
            const vsatNguVan = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.NGU_VAN,
            );
            expect(vsatNguVan?.score).toBe(135);
            const vsatTiengAnh = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.TIENG_ANH,
            );
            expect(vsatTiengAnh?.score).toBe(145);
            const vsatVatLy = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.VAT_LY,
            );
            expect(vsatVatLy?.score).toBe(130);
            const vsatHoaHoc = student.vsatExams?.find(
                (e) => e.name === VietnameseSubject.HOA_HOC,
            );
            expect(vsatHoaHoc?.score).toBe(138);

            // 14. Metadata fields
            expect(student.id).toBeDefined();
            expect(student.createdBy).toBe(testUser.email);
            expect(student.user?.id).toBe(testUser.id);
            expect(student.createdAt).toBeDefined();
            expect(student.updatedAt).toBeDefined();
        });
    });

    describe("getAllByUserId", () => {
        describe("getAllByUserId", () => {
            it("should retrieve all student profiles for a user with pagination", async () => {
                // Arrange
                const request1: StudentRequest = plainToInstance(
                    StudentRequest,
                    {
                        // Required: Academic Performances (3 items with different values for each grade)
                        academicPerformances: [
                            {
                                academicPerformance: AcademicPerformance.GOOD,
                                grade: 10,
                            },
                            {
                                academicPerformance:
                                    AcademicPerformance.SATISFACTORY,
                                grade: 11,
                            },
                            {
                                academicPerformance: AcademicPerformance.PASSED,
                                grade: 12,
                            },
                        ],
                        // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                        aptitudeExams: [
                            {
                                examType: DGNLType.VNUHCM,
                                languageScore: 350,
                                mathScore: 200,
                                scienceLogic: 150,
                                score: 700,
                            },
                            {
                                examType: DGNLType.HSA,
                                score: 95,
                            },
                        ],
                        // Optional: Awards (multiple awards with different categories and levels)
                        awards: [
                            {
                                category:
                                    NationalExcellentStudentExamSubject.MATHEMATICS,
                                level: Rank.FIRST,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.PHYSICS,
                                level: Rank.SECOND,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.ENGLISH,
                                level: Rank.THIRD,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                        ],
                        // Optional: Certifications (language and other certifications)
                        certifications: [
                            {
                                examType: CCNNType.IELTS,
                                level: "7.5",
                            },
                            {
                                examType: CCNNType.TOEFL_iBT,
                                level: "105",
                            },
                            {
                                examType: CCQTType.SAT,
                                level: "1450",
                            },
                        ],
                        // Required: Conducts (3 items with different values for each grade)
                        conducts: [
                            { conduct: Conduct.GOOD, grade: 10 },
                            { conduct: Conduct.SATISFACTORY, grade: 11 },
                            { conduct: Conduct.PASSED, grade: 12 },
                        ],
                        // Required: Majors (multiple major groups, 1-3 items)
                        majors: [
                            MajorGroup.ENGINEERING,
                            MajorGroup.NATURAL_SCIENCES,
                            MajorGroup.MATHEMATICS_AND_STATISTICS,
                        ],
                        // Required: Budget (with maxBudget > minBudget)
                        maxBudget: 150000000,
                        minBudget: 50000000,
                        // Required: National Exams (exactly 4 subjects with varied scores)
                        nationalExams: [
                            { name: VietnameseSubject.TOAN, score: 9.5 },
                            { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                            { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                            { name: VietnameseSubject.VAT_LY, score: 8.75 },
                        ],
                        // Required: Province
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        // Optional: Special Student Cases (multiple cases)
                        specialStudentCases: [
                            SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                            SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                        ],
                        // Optional: Talent Exams (multiple talent subjects)
                        talentExams: [
                            { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                            { name: VietnameseSubject.HAT, score: 8.5 },
                            {
                                name: VietnameseSubject.DOC_DIEN_CAM,
                                score: 8.75,
                            },
                        ],
                        // Required: University Type
                        uniType: UniType.PUBLIC,
                        // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                        vsatExams: [
                            { name: VietnameseSubject.TOAN, score: 140 },
                            { name: VietnameseSubject.NGU_VAN, score: 135 },
                            { name: VietnameseSubject.TIENG_ANH, score: 145 },
                            { name: VietnameseSubject.VAT_LY, score: 130 },
                            { name: VietnameseSubject.HOA_HOC, score: 138 },
                        ],
                    },
                );
                const validationErrors1 = await validate(request1);
                expect(validationErrors1).toHaveLength(0);

                const student1 = await studentService.create(
                    request1,
                    testUser.id,
                );
                createdStudentIds.push(student1.id);

                const request2: StudentRequest = plainToInstance(
                    StudentRequest,
                    {
                        // Required: Academic Performances (3 items with different values for each grade)
                        academicPerformances: [
                            {
                                academicPerformance: AcademicPerformance.GOOD,
                                grade: 10,
                            },
                            {
                                academicPerformance:
                                    AcademicPerformance.SATISFACTORY,
                                grade: 11,
                            },
                            {
                                academicPerformance: AcademicPerformance.PASSED,
                                grade: 12,
                            },
                        ],
                        // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                        aptitudeExams: [
                            {
                                examType: DGNLType.VNUHCM,
                                languageScore: 350,
                                mathScore: 200,
                                scienceLogic: 150,
                                score: 700,
                            },
                            {
                                examType: DGNLType.HSA,
                                score: 95,
                            },
                        ],
                        // Optional: Awards (multiple awards with different categories and levels)
                        awards: [
                            {
                                category:
                                    NationalExcellentStudentExamSubject.MATHEMATICS,
                                level: Rank.FIRST,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.PHYSICS,
                                level: Rank.SECOND,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.ENGLISH,
                                level: Rank.THIRD,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                        ],
                        // Optional: Certifications (language and other certifications)
                        certifications: [
                            {
                                examType: CCNNType.IELTS,
                                level: "7.5",
                            },
                            {
                                examType: CCNNType.TOEFL_iBT,
                                level: "105",
                            },
                            {
                                examType: CCQTType.SAT,
                                level: "1450",
                            },
                        ],
                        // Required: Conducts (3 items with different values for each grade)
                        conducts: [
                            { conduct: Conduct.GOOD, grade: 10 },
                            { conduct: Conduct.SATISFACTORY, grade: 11 },
                            { conduct: Conduct.PASSED, grade: 12 },
                        ],
                        // Required: Majors (multiple major groups, 1-3 items)
                        majors: [
                            MajorGroup.ENGINEERING,
                            MajorGroup.NATURAL_SCIENCES,
                            MajorGroup.MATHEMATICS_AND_STATISTICS,
                        ],
                        // Required: Budget (with maxBudget > minBudget)
                        maxBudget: 150000000,
                        minBudget: 50000000,
                        // Required: National Exams (exactly 4 subjects with varied scores)
                        nationalExams: [
                            { name: VietnameseSubject.TOAN, score: 9.5 },
                            { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                            { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                            { name: VietnameseSubject.VAT_LY, score: 8.75 },
                        ],
                        // Required: Province
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        // Optional: Special Student Cases (multiple cases)
                        specialStudentCases: [
                            SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                            SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                        ],
                        // Optional: Talent Exams (multiple talent subjects)
                        talentExams: [
                            { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                            { name: VietnameseSubject.HAT, score: 8.5 },
                            {
                                name: VietnameseSubject.DOC_DIEN_CAM,
                                score: 8.75,
                            },
                        ],
                        // Required: University Type
                        uniType: UniType.PUBLIC,
                        // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                        vsatExams: [
                            { name: VietnameseSubject.TOAN, score: 140 },
                            { name: VietnameseSubject.NGU_VAN, score: 135 },
                            { name: VietnameseSubject.TIENG_ANH, score: 145 },
                            { name: VietnameseSubject.VAT_LY, score: 130 },
                            { name: VietnameseSubject.HOA_HOC, score: 138 },
                        ],
                    },
                );
                const validationErrors2 = await validate(request2);
                expect(validationErrors2).toHaveLength(0);

                const student2 = await studentService.create(
                    request2,
                    testUser.id,
                );
                createdStudentIds.push(student2.id);

                const pageable = PageRequest.of(0, 10);

                // Act
                const page = await studentService.getAllByUserId(
                    testUser.id,
                    pageable,
                );

                // Assert
                expect(page).toBeDefined();
                expect(page.content).toContainEqual(
                    expect.objectContaining({ id: student1.id }),
                );
                expect(page.content).toContainEqual(
                    expect.objectContaining({ id: student2.id }),
                );
                expect(page.totalElements).toBeGreaterThanOrEqual(2);
            });

            it("should sort students by createdAt DESC by default", async () => {
                // Arrange - Create students with controlled timing\
                const request1: StudentRequest = plainToInstance(
                    StudentRequest,
                    {
                        // Required: Academic Performances (3 items with different values for each grade)
                        academicPerformances: [
                            {
                                academicPerformance: AcademicPerformance.GOOD,
                                grade: 10,
                            },
                            {
                                academicPerformance:
                                    AcademicPerformance.SATISFACTORY,
                                grade: 11,
                            },
                            {
                                academicPerformance: AcademicPerformance.PASSED,
                                grade: 12,
                            },
                        ],
                        // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                        aptitudeExams: [
                            {
                                examType: DGNLType.VNUHCM,
                                languageScore: 350,
                                mathScore: 200,
                                scienceLogic: 150,
                                score: 700,
                            },
                            {
                                examType: DGNLType.HSA,
                                score: 95,
                            },
                        ],
                        // Optional: Awards (multiple awards with different categories and levels)
                        awards: [
                            {
                                category:
                                    NationalExcellentStudentExamSubject.MATHEMATICS,
                                level: Rank.FIRST,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.PHYSICS,
                                level: Rank.SECOND,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.ENGLISH,
                                level: Rank.THIRD,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                        ],
                        // Optional: Certifications (language and other certifications)
                        certifications: [
                            {
                                examType: CCNNType.IELTS,
                                level: "7.5",
                            },
                            {
                                examType: CCNNType.TOEFL_iBT,
                                level: "105",
                            },
                            {
                                examType: CCQTType.SAT,
                                level: "1450",
                            },
                        ],
                        // Required: Conducts (3 items with different values for each grade)
                        conducts: [
                            { conduct: Conduct.GOOD, grade: 10 },
                            { conduct: Conduct.SATISFACTORY, grade: 11 },
                            { conduct: Conduct.PASSED, grade: 12 },
                        ],
                        // Required: Majors (multiple major groups, 1-3 items)
                        majors: [
                            MajorGroup.ENGINEERING,
                            MajorGroup.NATURAL_SCIENCES,
                            MajorGroup.MATHEMATICS_AND_STATISTICS,
                        ],
                        // Required: Budget (with maxBudget > minBudget)
                        maxBudget: 150000000,
                        minBudget: 50000000,
                        // Required: National Exams (exactly 4 subjects with varied scores)
                        nationalExams: [
                            { name: VietnameseSubject.TOAN, score: 9.5 },
                            { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                            { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                            { name: VietnameseSubject.VAT_LY, score: 8.75 },
                        ],
                        // Required: Province
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        // Optional: Special Student Cases (multiple cases)
                        specialStudentCases: [
                            SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                            SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                        ],
                        // Optional: Talent Exams (multiple talent subjects)
                        talentExams: [
                            { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                            { name: VietnameseSubject.HAT, score: 8.5 },
                            {
                                name: VietnameseSubject.DOC_DIEN_CAM,
                                score: 8.75,
                            },
                        ],
                        // Required: University Type
                        uniType: UniType.PUBLIC,
                        // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                        vsatExams: [
                            { name: VietnameseSubject.TOAN, score: 140 },
                            { name: VietnameseSubject.NGU_VAN, score: 135 },
                            { name: VietnameseSubject.TIENG_ANH, score: 145 },
                            { name: VietnameseSubject.VAT_LY, score: 130 },
                            { name: VietnameseSubject.HOA_HOC, score: 138 },
                        ],
                    },
                );
                const validationErrors1 = await validate(request1);
                expect(validationErrors1).toHaveLength(0);

                const student1 = await studentService.create(
                    request1,
                    testUser.id,
                );
                createdStudentIds.push(student1.id);

                await new Promise((resolve) => setTimeout(resolve, 10));
                const request2: StudentRequest = plainToInstance(
                    StudentRequest,
                    {
                        // Required: Academic Performances (3 items with different values for each grade)
                        academicPerformances: [
                            {
                                academicPerformance: AcademicPerformance.GOOD,
                                grade: 10,
                            },
                            {
                                academicPerformance:
                                    AcademicPerformance.SATISFACTORY,
                                grade: 11,
                            },
                            {
                                academicPerformance: AcademicPerformance.PASSED,
                                grade: 12,
                            },
                        ],
                        // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                        aptitudeExams: [
                            {
                                examType: DGNLType.VNUHCM,
                                languageScore: 350,
                                mathScore: 200,
                                scienceLogic: 150,
                                score: 700,
                            },
                            {
                                examType: DGNLType.HSA,
                                score: 95,
                            },
                        ],
                        // Optional: Awards (multiple awards with different categories and levels)
                        awards: [
                            {
                                category:
                                    NationalExcellentStudentExamSubject.MATHEMATICS,
                                level: Rank.FIRST,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.PHYSICS,
                                level: Rank.SECOND,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                            {
                                category:
                                    NationalExcellentStudentExamSubject.ENGLISH,
                                level: Rank.THIRD,
                                name: NationalExcellentExamType.NATIONAL,
                            },
                        ],
                        // Optional: Certifications (language and other certifications)
                        certifications: [
                            {
                                examType: CCNNType.IELTS,
                                level: "7.5",
                            },
                            {
                                examType: CCNNType.TOEFL_iBT,
                                level: "105",
                            },
                            {
                                examType: CCQTType.SAT,
                                level: "1450",
                            },
                        ],
                        // Required: Conducts (3 items with different values for each grade)
                        conducts: [
                            { conduct: Conduct.GOOD, grade: 10 },
                            { conduct: Conduct.SATISFACTORY, grade: 11 },
                            { conduct: Conduct.PASSED, grade: 12 },
                        ],
                        // Required: Majors (multiple major groups, 1-3 items)
                        majors: [
                            MajorGroup.ENGINEERING,
                            MajorGroup.NATURAL_SCIENCES,
                            MajorGroup.MATHEMATICS_AND_STATISTICS,
                        ],
                        // Required: Budget (with maxBudget > minBudget)
                        maxBudget: 150000000,
                        minBudget: 50000000,
                        // Required: National Exams (exactly 4 subjects with varied scores)
                        nationalExams: [
                            { name: VietnameseSubject.TOAN, score: 9.5 },
                            { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                            { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                            { name: VietnameseSubject.VAT_LY, score: 8.75 },
                        ],
                        // Required: Province
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        // Optional: Special Student Cases (multiple cases)
                        specialStudentCases: [
                            SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                            SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                        ],
                        // Optional: Talent Exams (multiple talent subjects)
                        talentExams: [
                            { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                            { name: VietnameseSubject.HAT, score: 8.5 },
                            {
                                name: VietnameseSubject.DOC_DIEN_CAM,
                                score: 8.75,
                            },
                        ],
                        // Required: University Type
                        uniType: UniType.PUBLIC,
                        // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                        vsatExams: [
                            { name: VietnameseSubject.TOAN, score: 140 },
                            { name: VietnameseSubject.NGU_VAN, score: 135 },
                            { name: VietnameseSubject.TIENG_ANH, score: 145 },
                            { name: VietnameseSubject.VAT_LY, score: 130 },
                            { name: VietnameseSubject.HOA_HOC, score: 138 },
                        ],
                    },
                );
                const validationErrors2 = await validate(request2);
                expect(validationErrors2).toHaveLength(0);
                const student2 = await studentService.create(
                    request2,
                    testUser.id,
                );
                createdStudentIds.push(student2.id);

                // Act
                const page = await studentService.getAllByUserId(
                    testUser.id,
                    PageRequest.of(0, 10),
                );

                // Assert
                const student2Index = page.content.findIndex(
                    (s) => s.id === student2.id,
                );
                const student1Index = page.content.findIndex(
                    (s) => s.id === student1.id,
                );

                expect(student2Index).toBeLessThan(student1Index); // Newer first
            });
        });

        it("should apply custom sorting", async () => {
            // Arrange
            const sort = Sort.by(new Order("minBudget", "ASC"));
            const pageable = PageRequest.of(0, 10, sort);

            // Act
            const page = await studentService.getAllByUserId(
                testUser.id,
                pageable,
            );

            expect(page).toBeDefined();
            const content = page.content;
            expect(content.length).toBeGreaterThanOrEqual(2);

            expect(content[0].minBudget).toBeDefined();
            expect(content[1].minBudget).toBeDefined();

            const firstBudget = content[0].minBudget ?? 0;
            const secondBudget = content[1].minBudget ?? 0;
            expect(firstBudget).toBeLessThanOrEqual(secondBudget);
        });

        it("should handle pagination correctly", async () => {
            // Arrange
            const pageSize = 1;
            const pageable = PageRequest.of(0, pageSize);

            // Act
            const page = await studentService.getAllByUserId(
                testUser.id,
                pageable,
            );

            // Assert
            expect(page.content).toHaveLength(
                Math.min(pageSize, page.totalElements),
            );
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
        });
    });

    describe("getByIdAndUserId", () => {
        it("should retrieve a student profile by id for authenticated user", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);
            const created = await studentService.create(request, testUser.id);
            createdStudentIds.push(created.id);

            // Act
            const retrieved = await studentService.getByIdAndUserId(
                created.id,
                testUser.id,
            );

            // Assert
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(created.id);
        });

        it("should retrieve anonymous student profile", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);
            const created = await studentService.create(request);
            createdStudentIds.push(created.id);

            // Act
            const retrieved = await studentService.getByIdAndUserId(created.id);

            // Assert
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should throw EntityNotFoundException for non-existent student", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act & Assert
            await expect(
                studentService.getByIdAndUserId(nonExistentId, testUser.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should throw EntityNotFoundException when student belongs to different user", async () => {
            // Arrange
            const otherUser = userRepository.create({
                email: `other_user_${Date.now().toString()}@example.com`,
                password: "hashedPassword123",
                role: Role.USER,
            });
            await userRepository.save(otherUser);
            createdUserIds.push(otherUser.id);

            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const student = await studentService.create(request, otherUser.id);
            createdStudentIds.push(student.id);

            // Act & Assert
            await expect(
                studentService.getByIdAndUserId(student.id, testUser.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should load all relations when retrieving student", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const created = await studentService.create(request, testUser.id);
            createdStudentIds.push(created.id);

            // Act
            const retrieved = await studentService.getByIdAndUserId(
                created.id,
                testUser.id,
            );

            // Assert
            expect(retrieved.academicPerformances).toBeDefined();
            expect(retrieved.academicPerformances).toHaveLength(3);
            expect(retrieved.aptitudeExams).toBeDefined();
            expect(retrieved.aptitudeExams).toHaveLength(2);
            expect(retrieved.awards).toBeDefined();
            expect(retrieved.awards).toHaveLength(3);
            expect(retrieved.conducts).toBeDefined();
            expect(retrieved.conducts).toHaveLength(3);
            expect(retrieved.nationalExams).toBeDefined();
            expect(retrieved.nationalExams).toHaveLength(4);
        });
    });

    describe("getWithFiles", () => {
        it("should retrieve student with active files only", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const student = await studentService.create(request, testUser.id);
            createdStudentIds.push(student.id);

            // Create files
            const activeFile = fileRepository.create({
                fileContent: Buffer.from("mock PDF content"),
                fileName: "active-file.pdf",
                filePath: "/path/to/active-file.pdf",
                fileSize: 1024,
                mimeType: "application/pdf",
                originalFileName: "active-file.pdf",
                status: FileStatus.ACTIVE,
                studentId: student.id,
            });
            await fileRepository.save(activeFile);

            const deletedFile = fileRepository.create({
                fileContent: Buffer.from("mock PDF content"),
                fileName: "deleted-file.pdf",
                filePath: "/path/to/deleted-file.pdf",
                fileSize: 2048,
                mimeType: "application/pdf",
                originalFileName: "deleted-file.pdf",
                status: FileStatus.DELETED,
                studentId: student.id,
            });
            await fileRepository.save(deletedFile);

            // Act
            const retrieved = await studentService.getWithFiles(
                student.id,
                testUser.id,
            );

            // Assert
            expect(retrieved.files).toBeDefined();
            expect(retrieved.files).toHaveLength(1);
            retrieved.files?.forEach((file) => {
                expect(file.status).toBe(FileStatus.ACTIVE);
                expect(file.fileName).toBe("active-file.pdf");
            });
        });

        it("should retrieve anonymous student with files", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const student = await studentService.create(request);
            createdStudentIds.push(student.id);

            const file = fileRepository.create({
                fileContent: Buffer.from("mock PDF content"),
                fileName: "anonymous-file.pdf",
                filePath: "/path/to/file.pdf",
                fileSize: 1024,
                mimeType: "application/pdf",
                originalFileName: "anonymous-file.pdf",
                status: FileStatus.ACTIVE,
                studentId: student.id,
            });
            await fileRepository.save(file);

            // Act
            const retrieved = await studentService.getWithFiles(student.id);

            // Assert
            expect(retrieved.files).toBeDefined();
            expect(retrieved.files).toHaveLength(1);
            expect(retrieved.files?.[0].fileName).toBe("anonymous-file.pdf");
            expect(retrieved.files?.[0].status).toBe(FileStatus.ACTIVE);
            expect(Number(retrieved.files?.[0].fileSize)).toBe(1024);
            expect(retrieved.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should return empty files array when no active files exist", async () => {
            // Arrange
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const student = await studentService.create(request, testUser.id);
            createdStudentIds.push(student.id);

            // Act
            const retrieved = await studentService.getWithFiles(
                student.id,
                testUser.id,
            );

            // Assert
            expect(retrieved.files).toBeDefined();
            expect(retrieved.files).toHaveLength(0);
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle complete student lifecycle: create -> retrieve -> get with files", async () => {
            // Step 1: Create
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            const created = await studentService.create(request, testUser.id);
            createdStudentIds.push(created.id);
            expect(created.id).toBeDefined();

            // Step 2: Retrieve
            const retrieved = await studentService.getByIdAndUserId(
                created.id,
                testUser.id,
            );
            expect(retrieved.id).toBe(created.id);

            // Step 3: Get with files
            const file = fileRepository.create({
                fileContent: Buffer.from("mock PDF content"),
                fileName: "transcript.pdf",
                filePath: "/path/to/transcript.pdf",
                fileSize: 2048,
                mimeType: "application/pdf",
                originalFileName: "transcript.pdf",
                status: FileStatus.ACTIVE,
                studentId: created.id,
            });
            await fileRepository.save(file);

            const withFiles = await studentService.getWithFiles(
                created.id,
                testUser.id,
            );
            expect(withFiles.files).toHaveLength(1);
        });

        it("should maintain data integrity across multiple operations", async () => {
            // Create student with comprehensive data
            const request1: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors1 = await validate(request1);
            expect(validationErrors1).toHaveLength(0);

            const student1 = await studentService.create(request1, testUser.id);
            createdStudentIds.push(student1.id);

            // Create another student
            const request2: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors2 = await validate(request2);
            expect(validationErrors2).toHaveLength(0);

            const student2 = await studentService.create(request2, testUser.id);
            createdStudentIds.push(student2.id);

            // Verify both students exist independently
            const retrieved1 = await studentService.getByIdAndUserId(
                student1.id,
                testUser.id,
            );
            const retrieved2 = await studentService.getByIdAndUserId(
                student2.id,
                testUser.id,
            );

            expect(retrieved1.id).not.toBe(retrieved2.id);
            expect(retrieved1.academicPerformances).toHaveLength(3);
            expect(retrieved2.academicPerformances).toHaveLength(3);
        });

        it("should properly isolate students between different users", async () => {
            // Create another user
            const user2 = userRepository.create({
                email: `isolation_test_${Date.now().toString()}@example.com`,
                password: "hashedPassword123",
                role: Role.USER,
            });
            await userRepository.save(user2);
            createdUserIds.push(user2.id);
            const request: StudentRequest = plainToInstance(StudentRequest, {
                // Required: Academic Performances (3 items with different values for each grade)
                academicPerformances: [
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                    },
                ],
                // Optional: Aptitude Exams (multiple exam types including VNUHCM with components)
                aptitudeExams: [
                    {
                        examType: DGNLType.VNUHCM,
                        languageScore: 350,
                        mathScore: 200,
                        scienceLogic: 150,
                        score: 700,
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                    },
                ],
                // Optional: Awards (multiple awards with different categories and levels)
                awards: [
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.ENGLISH,
                        level: Rank.THIRD,
                        name: NationalExcellentExamType.NATIONAL,
                    },
                ],
                // Optional: Certifications (language and other certifications)
                certifications: [
                    {
                        examType: CCNNType.IELTS,
                        level: "7.5",
                    },
                    {
                        examType: CCNNType.TOEFL_iBT,
                        level: "105",
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                    },
                ],
                // Required: Conducts (3 items with different values for each grade)
                conducts: [
                    { conduct: Conduct.GOOD, grade: 10 },
                    { conduct: Conduct.SATISFACTORY, grade: 11 },
                    { conduct: Conduct.PASSED, grade: 12 },
                ],
                // Required: Majors (multiple major groups, 1-3 items)
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                // Required: Budget (with maxBudget > minBudget)
                maxBudget: 150000000,
                minBudget: 50000000,
                // Required: National Exams (exactly 4 subjects with varied scores)
                nationalExams: [
                    { name: VietnameseSubject.TOAN, score: 9.5 },
                    { name: VietnameseSubject.NGU_VAN, score: 8.5 },
                    { name: VietnameseSubject.TIENG_ANH, score: 9.0 },
                    { name: VietnameseSubject.VAT_LY, score: 8.75 },
                ],
                // Required: Province
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                // Optional: Special Student Cases (multiple cases)
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                // Optional: Talent Exams (multiple talent subjects)
                talentExams: [
                    { name: VietnameseSubject.VE_MY_THUAT, score: 9.0 },
                    { name: VietnameseSubject.HAT, score: 8.5 },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                    },
                ],
                // Required: University Type
                uniType: UniType.PUBLIC,
                // Optional: VSAT Exams (minimum 3, maximum 8 - using valid VSAT subjects)
                vsatExams: [
                    { name: VietnameseSubject.TOAN, score: 140 },
                    { name: VietnameseSubject.NGU_VAN, score: 135 },
                    { name: VietnameseSubject.TIENG_ANH, score: 145 },
                    { name: VietnameseSubject.VAT_LY, score: 130 },
                    { name: VietnameseSubject.HOA_HOC, score: 138 },
                ],
            });
            const validationErrors = await validate(request);
            expect(validationErrors).toHaveLength(0);

            // Create students for each user
            const user1Student = await studentService.create(
                request,
                testUser.id,
            );
            createdStudentIds.push(user1Student.id);

            const user2Student = await studentService.create(
                {
                    academicPerformances: [
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 10,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 11,
                        },
                        {
                            academicPerformance: AcademicPerformance.GOOD,
                            grade: 12,
                        },
                    ],
                    aptitudeExams: [],
                    awards: [],
                    certifications: [],
                    conducts: [
                        { conduct: Conduct.GOOD, grade: 10 },
                        { conduct: Conduct.GOOD, grade: 11 },
                        { conduct: Conduct.GOOD, grade: 12 },
                    ],
                    majors: [MajorGroup.BUSINESS_AND_MANAGEMENT],
                    maxBudget: 60000000,
                    minBudget: 20000000,
                    nationalExams: [
                        { name: VietnameseSubject.TOAN, score: 8.0 },
                        { name: VietnameseSubject.NGU_VAN, score: 7.0 },
                        { name: VietnameseSubject.TIENG_ANH, score: 8.5 },
                        { name: VietnameseSubject.LICH_SU, score: 7.5 },
                    ],
                    province: VietnamSouthernProvinces.HO_CHI_MINH,
                    talentExams: [],
                    uniType: UniType.PUBLIC,
                    vsatExams: [],
                },
                user2.id,
            );
            createdStudentIds.push(user2Student.id);

            // Verify each user can only access their own students
            const user1Page = await studentService.getAllByUserId(
                testUser.id,
                PageRequest.of(0, 100),
            );
            const user2Page = await studentService.getAllByUserId(
                user2.id,
                PageRequest.of(0, 100),
            );
            const user1StudentIds = user1Page.content.map(
                (s: StudentEntity) => s.id,
            );
            const user2StudentIds = user2Page.content.map(
                (s: StudentEntity) => s.id,
            );

            expect(user1StudentIds).toContain(user1Student.id);
            expect(user1StudentIds).not.toContain(user2Student.id);
            expect(user2StudentIds).toContain(user2Student.id);
            expect(user2StudentIds).not.toContain(user1Student.id);
        });
    });
});
