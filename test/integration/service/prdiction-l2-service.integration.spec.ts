import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { type DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IPredictionL2Service } from "@/service/prediction-l2-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import { AcademicPerformanceEntity } from "@/entity/uni_guide/academic-performance.entity.js";
import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import {
    CEFR,
    CertificationEntity,
} from "@/entity/uni_guide/certification.entity.js";
import { ConductEntity } from "@/entity/uni_guide/conduct.entity.js";
import { NationalExamEntity } from "@/entity/uni_guide/national-exam.enity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TalentExamEntity } from "@/entity/uni_guide/talent-exam.entity.js";
import { VsatExamEntity } from "@/entity/uni_guide/vsat-exam.entity.js";
import { getApp } from "@/test/setup.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";
import { AcademicPerformance } from "@/type/enum/academic-performance.enum.js";
import { Conduct } from "@/type/enum/conduct.enum.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam-type.enum.js";
import { MajorGroup } from "@/type/enum/major.enum.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.enum.js";
import { Rank } from "@/type/enum/rank.enum.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.enum.js";
import { VietnameseSubject } from "@/type/enum/subject.enum.js";
import { UniType } from "@/type/enum/uni-type.enum.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.enum.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

describe("PredictionL2Service Integration Tests", () => {
    let dataSource: DataSource;
    let predictionL2Service: IPredictionL2Service;

    const createdStudentIds: UUID[] = [];
    async function createBaseStudent(overrides?: Partial<StudentEntity>) {
        const studentRepository = dataSource.getRepository(StudentEntity);

        // 1. Define your default values
        const defaults = {
            majors: [MajorGroup.ENGINEERING],
            maxBudget: 50000000,
            minBudget: 10000000,
            province: VietnamSouthernProvinces.HO_CHI_MINH,
            uniType: UniType.PUBLIC,
        };

        // 2. Merge defaults with overrides and create the entity instance
        // This ensures overrides take precedence
        const studentData = { ...defaults, ...overrides };
        const student = studentRepository.create(studentData);

        // 3. Save the merged entity
        const saved = await studentRepository.save(student);

        // 4. Track and return
        createdStudentIds.push(saved.id);
        return saved;
    }

    async function setupValidStudentData(studentId: UUID) {
        await Promise.all([
            dataSource.getRepository(AcademicPerformanceEntity).save([
                {
                    academicPerformance: AcademicPerformance.GOOD,
                    grade: 10,
                    studentId,
                },
                {
                    academicPerformance: AcademicPerformance.GOOD,
                    grade: 11,
                    studentId,
                },
                {
                    academicPerformance: AcademicPerformance.GOOD,
                    grade: 12,
                    studentId,
                },
            ]),
            dataSource.getRepository(ConductEntity).save([
                { conduct: Conduct.GOOD, grade: 10, studentId },
                { conduct: Conduct.GOOD, grade: 11, studentId },
                { conduct: Conduct.GOOD, grade: 12, studentId },
            ]),
            dataSource.getRepository(NationalExamEntity).save([
                { name: VietnameseSubject.TOAN, score: 8.0, studentId },
                { name: VietnameseSubject.VAT_LY, score: 7.5, studentId },
                { name: VietnameseSubject.HOA_HOC, score: 7.0, studentId },
                { name: VietnameseSubject.NGU_VAN, score: 7.0, studentId },
            ]),
        ]);
    }
    beforeAll(() => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        predictionL2Service = iocContainer.get<IPredictionL2Service>(
            TYPES.IPredictionL2Service,
        );
    });

    afterAll(async () => {
        // Clean up created students (cascading will handle related entities)
        const studentRepo = dataSource.getRepository(StudentEntity);
        for (const studentId of createdStudentIds) {
            try {
                await studentRepo.delete(studentId);
            } catch (error) {
                console.error(`Failed to delete student ${studentId}:`, error);
            }
        }
    });

    describe("getL2PredictResults", () => {
        it("should successfully get L2 predictions for a student with complete data", async () => {
            // Arrange - Create student with comprehensive data
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING, MajorGroup.NATURAL_SCIENCES],
                maxBudget: 100000000,
                minBudget: 30000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                // Academic performances
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                // Conducts
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    {
                        conduct: Conduct.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                // National exams
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 9.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 9.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 8.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                ]),
                // Certifications
                dataSource.getRepository(CertificationEntity).save({
                    cefr: CEFR.C1,
                    examType: CCNNType.IELTS,
                    level: "7.5",
                    studentId: student.id,
                }),
                // Aptitude exam
                dataSource.getRepository(AptitudeExamEntity).save({
                    examType: DGNLType.VNUHCM,
                    score: 850,
                    studentId: student.id,
                    vnuhcmScoreComponents: {
                        languageScore: 350,
                        mathScore: 300,
                        scienceLogic: 200,
                    },
                }),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);

            // Verify result structure
            results.forEach((result) => {
                expect(result.ma_xet_tuyen).toBeDefined();
                expect(result.score).toBeDefined();
                expect(typeof result.score).toBe("number");
                expect(result.score).toBeGreaterThanOrEqual(0);
                expect(result.score).toBeLessThanOrEqual(1);
            });
        });

        it("should deduplicate results by ma_xet_tuyen keeping highest score", async () => {
            // Arrange - Create student with multiple majors
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            const maXetTuyenSet = new Set(results.map((r) => r.ma_xet_tuyen));
            expect(maXetTuyenSet.size).toBe(results.length); // No duplicates
        });

        it("should throw EntityNotFoundException for non-existent student", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act & Assert
            await expect(
                predictionL2Service.getL2PredictResults(nonExistentId),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should handle student with VSAT exams", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(VsatExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 140,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 135,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.TIENG_ANH,
                        score: 145,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 130,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle concurrent requests for different students", async () => {
            // Arrange - Create two students
            const studentRepo = dataSource.getRepository(StudentEntity);
            const [student1, student2] = await Promise.all([
                (async () => {
                    const s = studentRepo.create({
                        majors: [MajorGroup.ENGINEERING],
                        maxBudget: 50000000,
                        minBudget: 10000000,
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        uniType: UniType.PUBLIC,
                    });
                    await studentRepo.save(s);
                    await Promise.all([
                        dataSource
                            .getRepository(AcademicPerformanceEntity)
                            .save([
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 10,
                                    studentId: s.id,
                                },
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 11,
                                    studentId: s.id,
                                },
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 12,
                                    studentId: s.id,
                                },
                            ]),
                        dataSource.getRepository(ConductEntity).save([
                            {
                                conduct: Conduct.GOOD,
                                grade: 10,
                                studentId: s.id,
                            },
                            {
                                conduct: Conduct.GOOD,
                                grade: 11,
                                studentId: s.id,
                            },
                            {
                                conduct: Conduct.GOOD,
                                grade: 12,
                                studentId: s.id,
                            },
                        ]),
                        dataSource.getRepository(NationalExamEntity).save([
                            {
                                name: VietnameseSubject.TOAN,
                                score: 8.0,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.VAT_LY,
                                score: 7.5,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.HOA_HOC,
                                score: 7.0,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.NGU_VAN,
                                score: 7.0,
                                studentId: s.id,
                            },
                        ]),
                    ]);
                    return s;
                })(),
                (async () => {
                    const s = studentRepo.create({
                        majors: [MajorGroup.BUSINESS_AND_MANAGEMENT],
                        maxBudget: 60000000,
                        minBudget: 20000000,
                        province: VietnamSouthernProvinces.HO_CHI_MINH,
                        uniType: UniType.PUBLIC,
                    });
                    await studentRepo.save(s);
                    await Promise.all([
                        dataSource
                            .getRepository(AcademicPerformanceEntity)
                            .save([
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 10,
                                    studentId: s.id,
                                },
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 11,
                                    studentId: s.id,
                                },
                                {
                                    academicPerformance:
                                        AcademicPerformance.GOOD,
                                    grade: 12,
                                    studentId: s.id,
                                },
                            ]),
                        dataSource.getRepository(ConductEntity).save([
                            {
                                conduct: Conduct.GOOD,
                                grade: 10,
                                studentId: s.id,
                            },
                            {
                                conduct: Conduct.GOOD,
                                grade: 11,
                                studentId: s.id,
                            },
                            {
                                conduct: Conduct.GOOD,
                                grade: 12,
                                studentId: s.id,
                            },
                        ]),
                        dataSource.getRepository(NationalExamEntity).save([
                            {
                                name: VietnameseSubject.TOAN,
                                score: 8.0,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.LICH_SU,
                                score: 7.5,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.DIA_LY,
                                score: 7.0,
                                studentId: s.id,
                            },
                            {
                                name: VietnameseSubject.NGU_VAN,
                                score: 7.0,
                                studentId: s.id,
                            },
                        ]),
                    ]);
                    return s;
                })(),
            ]);

            createdStudentIds.push(student1.id, student2.id);

            // Act
            const [results1, results2] = await Promise.all([
                predictionL2Service.getL2PredictResults(student1.id),
                predictionL2Service.getL2PredictResults(student2.id),
            ]);

            // Assert
            expect(results1).toBeDefined();
            expect(results2).toBeDefined();
            expect(Array.isArray(results1)).toBe(true);
            expect(Array.isArray(results2)).toBe(true);
        });

        // NEW TESTS - Certification Variations
        it("should handle student with JLPT certification", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // JLPT certification
                dataSource.getRepository(CertificationEntity).save({
                    examType: CCNNType.JLPT,
                    level: "N1",
                    studentId: student.id,
                }),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with mixed CEFR certifications", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // Multiple CEFR certifications
                dataSource.getRepository(CertificationEntity).save([
                    {
                        cefr: CEFR.C1,
                        examType: CCNNType.IELTS,
                        level: "7.5",
                        studentId: student.id,
                    },
                    {
                        cefr: CEFR.B2,
                        examType: CCNNType.TOEFL_iBT,
                        level: "90",
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with NO certifications (default path)", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // NO certifications
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with multiple CCQT certifications", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // CCQT certifications
                dataSource.getRepository(CertificationEntity).save([
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                        studentId: student.id,
                    },
                    {
                        examType: CCQTType.ACT,
                        level: "32",
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Talent Exams
        it("should handle student with talent exams", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ARTS],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // Talent exams
                dataSource.getRepository(TalentExamEntity).save([
                    {
                        name: VietnameseSubject.VE_MY_THUAT,
                        score: 9.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HAT,
                        score: 8.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.DOC_DIEN_CAM,
                        score: 8.75,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Aptitude Exam Variations
        it("should handle student with HSA aptitude exam", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // HSA aptitude exam
                dataSource.getRepository(AptitudeExamEntity).save({
                    examType: DGNLType.HSA,
                    score: 95,
                    studentId: student.id,
                }),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with NO aptitude exams", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
                // NO aptitude exams
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - University Type & Province Variations
        it("should handle private university type", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PRIVATE,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle different provinces", async () => {
            // Arrange - Test with HCM
            const studentRepo = dataSource.getRepository(StudentEntity);

            // Test with HCM first
            const studentHCM = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(studentHCM);
            createdStudentIds.push(studentHCM.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: studentHCM.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: studentHCM.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: studentHCM.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    {
                        conduct: Conduct.GOOD,
                        grade: 10,
                        studentId: studentHCM.id,
                    },
                    {
                        conduct: Conduct.GOOD,
                        grade: 11,
                        studentId: studentHCM.id,
                    },
                    {
                        conduct: Conduct.GOOD,
                        grade: 12,
                        studentId: studentHCM.id,
                    },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: studentHCM.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: studentHCM.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: studentHCM.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: studentHCM.id,
                    },
                ]),
            ]);

            // Test with Binh Duong
            const studentBD = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.BINH_DUONG,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(studentBD);
            createdStudentIds.push(studentBD.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: studentBD.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: studentBD.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: studentBD.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    {
                        conduct: Conduct.GOOD,
                        grade: 10,
                        studentId: studentBD.id,
                    },
                    {
                        conduct: Conduct.GOOD,
                        grade: 11,
                        studentId: studentBD.id,
                    },
                    {
                        conduct: Conduct.GOOD,
                        grade: 12,
                        studentId: studentBD.id,
                    },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: studentBD.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: studentBD.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: studentBD.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: studentBD.id,
                    },
                ]),
            ]);

            // Act
            const resultsHCM = await predictionL2Service.getL2PredictResults(
                studentHCM.id,
            );
            const resultsBD = await predictionL2Service.getL2PredictResults(
                studentBD.id,
            );

            expect(resultsHCM).toBeDefined();
            expect(Array.isArray(resultsHCM)).toBe(true);
            expect(resultsHCM.length).toBeGreaterThan(0);
            expect(resultsBD).toBeDefined();
            expect(Array.isArray(resultsBD)).toBe(true);
            expect(resultsBD.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Edge Cases
        it("should handle student with minimum required data only", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with maxBudget = minBudget", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 50000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
        });

        it("should handle student with maximum majors (3)", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Special Student Cases
        it("should handle student with special student cases", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                    SpecialStudentCase.ETHNIC_MINORITY_STUDENT,
                ],
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Awards
        it("should handle student with awards", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.MATHEMATICS_AND_STATISTICS],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                    { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 9.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 9.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 8.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                ]),
                // Awards
                dataSource.getRepository(AwardEntity).save([
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                        studentId: student.id,
                    },
                    {
                        category: NationalExcellentStudentExamSubject.PHYSICS,
                        level: Rank.SECOND,
                        name: NationalExcellentExamType.NATIONAL,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        // NEW TESTS - Complex Scenarios
        it("should handle comprehensive student with all optional relations", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [
                    MajorGroup.ENGINEERING,
                    MajorGroup.NATURAL_SCIENCES,
                    MajorGroup.MATHEMATICS_AND_STATISTICS,
                ],
                maxBudget: 150000000,
                minBudget: 50000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                specialStudentCases: [
                    SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY,
                ],
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    {
                        conduct: Conduct.SATISFACTORY,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        conduct: Conduct.PASSED,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 9.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 9.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 8.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(CertificationEntity).save([
                    {
                        cefr: CEFR.C1,
                        examType: CCNNType.IELTS,
                        level: "7.5",
                        studentId: student.id,
                    },
                    {
                        examType: CCQTType.SAT,
                        level: "1450",
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(AptitudeExamEntity).save([
                    {
                        examType: DGNLType.VNUHCM,
                        score: 850,
                        studentId: student.id,
                        vnuhcmScoreComponents: {
                            languageScore: 350,
                            mathScore: 300,
                            scienceLogic: 200,
                        },
                    },
                    {
                        examType: DGNLType.HSA,
                        score: 95,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(AwardEntity).save([
                    {
                        category:
                            NationalExcellentStudentExamSubject.MATHEMATICS,
                        level: Rank.FIRST,
                        name: NationalExcellentExamType.NATIONAL,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(TalentExamEntity).save([
                    {
                        name: VietnameseSubject.VE_MY_THUAT,
                        score: 9.0,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(VsatExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 140,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 135,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.TIENG_ANH,
                        score: 145,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 130,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 138,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Verify deduplication
            const maXetTuyenSet = new Set(results.map((r) => r.ma_xet_tuyen));
            expect(maXetTuyenSet.size).toBe(results.length);
        });

        it("should handle student with varied academic and conduct ratings", async () => {
            // Arrange
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.SATISFACTORY,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        academicPerformance: AcademicPerformance.PASSED,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                    {
                        conduct: Conduct.SATISFACTORY,
                        grade: 11,
                        studentId: student.id,
                    },
                    {
                        conduct: Conduct.NOT_PASSED,
                        grade: 12,
                        studentId: student.id,
                    },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 8.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 7.5,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 7.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 7.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            // Act
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe("deduplicateByHighestScore", () => {
        it("should remove duplicates and keep highest score", () => {
            // Arrange
            const results: L2PredictResult[] = [
                {
                    ma_xet_tuyen: "SIU7140103THPTQG",
                    score: 0.9995385162588366,
                },
                {
                    ma_xet_tuyen: "SIU7140103THPTQG",
                    score: 0.9992295911230948,
                },
                {
                    ma_xet_tuyen: "HIU7140114THPTQG",
                    score: 0.9990123456789012,
                },
            ];

            // Act
            const deduplicated =
                predictionL2Service.deduplicateByHighestScore(results);

            // Assert
            expect(deduplicated).toHaveLength(2);
            const siu7140103Result = deduplicated.find(
                (r) => r.ma_xet_tuyen === "SIU7140103THPTQG",
            );
            expect(siu7140103Result?.score).toBe(0.9995385162588366);
        });

        it("should handle empty array", () => {
            // Arrange
            const results: L2PredictResult[] = [];

            // Act
            const deduplicated =
                predictionL2Service.deduplicateByHighestScore(results);

            // Assert
            expect(deduplicated).toHaveLength(0);
        });

        it("should handle array with no duplicates", () => {
            // Arrange
            const results: L2PredictResult[] = [
                {
                    ma_xet_tuyen: "SIU7140103THPTQG",
                    score: 0.9995385162588366,
                },
                {
                    ma_xet_tuyen: "HIU7140114THPTQG",
                    score: 0.9992295911230948,
                },
            ];

            // Act
            const deduplicated =
                predictionL2Service.deduplicateByHighestScore(results);

            // Assert
            expect(deduplicated).toHaveLength(2);
        });

        it("should deduplicate complex results with multiple duplicates", () => {
            // Arrange
            const results: L2PredictResult[] = [
                { ma_xet_tuyen: "SIU7140103THPTQG", score: 0.95 },
                { ma_xet_tuyen: "SIU7140103THPTQG", score: 0.99 }, // Highest
                { ma_xet_tuyen: "SIU7140103THPTQG", score: 0.92 },
                { ma_xet_tuyen: "HIU7140114THPTQG", score: 0.88 },
                { ma_xet_tuyen: "HIU7140114THPTQG", score: 0.91 }, // Highest
                { ma_xet_tuyen: "XYZ123THPTQG", score: 0.85 },
            ];

            // Act
            const deduplicated =
                predictionL2Service.deduplicateByHighestScore(results);

            // Assert
            expect(deduplicated).toHaveLength(3);
            expect(
                deduplicated.find((r) => r.ma_xet_tuyen === "SIU7140103THPTQG")
                    ?.score,
            ).toBe(0.99);
            expect(
                deduplicated.find((r) => r.ma_xet_tuyen === "HIU7140114THPTQG")
                    ?.score,
            ).toBe(0.91);
            expect(
                deduplicated.find((r) => r.ma_xet_tuyen === "XYZ123THPTQG")
                    ?.score,
            ).toBe(0.85);
        });
    });

    describe("Validation Error Cases", () => {
        it("should throw ValidationException when student has insufficient academic performances", async () => {
            const studentRepo = dataSource.getRepository(StudentEntity);
            const student = studentRepo.create({
                majors: [MajorGroup.ENGINEERING],
                maxBudget: 50000000,
                minBudget: 10000000,
                province: VietnamSouthernProvinces.HO_CHI_MINH,
                uniType: UniType.PUBLIC,
            });
            await studentRepo.save(student);
            createdStudentIds.push(student.id);

            await dataSource.getRepository(AcademicPerformanceEntity).save([
                {
                    academicPerformance: AcademicPerformance.GOOD,
                    grade: 10,
                    studentId: student.id,
                },
                {
                    academicPerformance: AcademicPerformance.GOOD,
                    grade: 11,
                    studentId: student.id,
                },
                // Missing grade 12
            ]);

            await expect(
                predictionL2Service.getL2PredictResults(student.id),
            ).rejects.toThrow(ValidationException);
        });

        it("should throw ValidationException when student has insufficient conducts", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            await dataSource.getRepository(ConductEntity).save([
                { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                // Missing grade 12
            ]);

            await expect(
                predictionL2Service.getL2PredictResults(student.id),
            ).rejects.toThrow(ValidationException);
        });

        it("should throw ValidationException when student has insufficient national exams", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            await dataSource.getRepository(NationalExamEntity).save([
                {
                    name: VietnameseSubject.TOAN,
                    score: 8.0,
                    studentId: student.id,
                },
                {
                    name: VietnameseSubject.VAT_LY,
                    score: 7.5,
                    studentId: student.id,
                },
                {
                    name: VietnameseSubject.HOA_HOC,
                    score: 7.0,
                    studentId: student.id,
                },
                // Only 3 subjects, requires 4
            ]);

            await expect(
                predictionL2Service.getL2PredictResults(student.id),
            ).rejects.toThrow(ValidationException);
        });
    });

    it("should return empty array when no matching programs exist", async () => {
        const studentRepo = dataSource.getRepository(StudentEntity);
        const student = studentRepo.create({
            majors: [MajorGroup.ENGINEERING],
            maxBudget: 1, // Impossible budget
            minBudget: 1,
            province: VietnamSouthernProvinces.HO_CHI_MINH,
            uniType: UniType.PUBLIC,
        });
        await studentRepo.save(student);
        createdStudentIds.push(student.id);

        // Provide all other valid data
        await setupValidStudentData(student.id);

        const results = await predictionL2Service.getL2PredictResults(
            student.id,
        );

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
    });

    describe("Boundary and Scale Tests", () => {
        it("should handle extreme exam scores (0.0 and 10.0)", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            const studentId = student.id;
            await Promise.all([
                dataSource.getRepository(AcademicPerformanceEntity).save([
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 10,
                        studentId,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 11,
                        studentId,
                    },
                    {
                        academicPerformance: AcademicPerformance.GOOD,
                        grade: 12,
                        studentId,
                    },
                ]),
                dataSource.getRepository(ConductEntity).save([
                    { conduct: Conduct.GOOD, grade: 10, studentId },
                    { conduct: Conduct.GOOD, grade: 11, studentId },
                    { conduct: Conduct.GOOD, grade: 12, studentId },
                ]),
                dataSource.getRepository(NationalExamEntity).save([
                    {
                        name: VietnameseSubject.TOAN,
                        score: 0.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.VAT_LY,
                        score: 10.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.HOA_HOC,
                        score: 5.0,
                        studentId: student.id,
                    },
                    {
                        name: VietnameseSubject.NGU_VAN,
                        score: 5.0,
                        studentId: student.id,
                    },
                ]),
            ]);

            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );
            expect(results.every((r) => r.score >= 0 && r.score <= 1)).toBe(
                true,
            );
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with maximum VSAT exams (8)", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            await setupValidStudentData(student.id);
            const vsatSubjects = [
                VietnameseSubject.TOAN,
                VietnameseSubject.NGU_VAN,
                VietnameseSubject.TIENG_ANH,
                VietnameseSubject.VAT_LY,
                VietnameseSubject.HOA_HOC,
                VietnameseSubject.SINH_HOC,
                VietnameseSubject.LICH_SU,
                VietnameseSubject.DIA_LY,
            ];

            await dataSource.getRepository(VsatExamEntity).save(
                vsatSubjects.map((name) => ({
                    name,
                    score: 140,
                    studentId: student.id,
                })),
            );

            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );
            expect(results).toBeDefined();
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        it("should handle student with maximum number of certifications", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.HUMANITIES],
            });
            await setupValidStudentData(student.id);
            const certificationRepository =
                dataSource.getRepository(CertificationEntity);
            await certificationRepository.save([
                {
                    examType: CCQTType.SAT,
                    level: "1450",
                    studentId: student.id,
                },
                {
                    examType: CCQTType.ACT,
                    level: "32",
                    studentId: student.id,
                },
                {
                    examType: CCNNType.JLPT,
                    level: "N4",
                    studentId: student.id,
                },
                {
                    cefr: CEFR.C2,
                    examType: CCNNType.TOEFL_iBT,
                    level: "120",
                    studentId: student.id,
                },
                {
                    cefr: CEFR.C2,
                    examType: CCNNType.TOEIC,
                    level: "990",
                    studentId: student.id,
                },
                {
                    cefr: CEFR.C2,
                    examType: CCNNType.IELTS,
                    level: "9.0",
                    studentId: student.id,
                },
            ]);
            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe("Result Integrity", () => {
        it("should maintain consistent results for same student across multiple calls", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            await setupValidStudentData(student.id);

            const results1 = await predictionL2Service.getL2PredictResults(
                student.id,
            );
            const results2 = await predictionL2Service.getL2PredictResults(
                student.id,
            );

            expect(results1).toEqual(results2);
        });

        it("should validate L2PredictResult DTO structure with class-validator", async () => {
            const student = await createBaseStudent({
                majors: [MajorGroup.ENGINEERING],
            });
            await setupValidStudentData(student.id);

            const results = await predictionL2Service.getL2PredictResults(
                student.id,
            );
            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
            for (const result of results) {
                const dto = plainToInstance(L2PredictResult, result);
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });
    });

    it("should handle student with mixed JLPT and CEFR certifications", async () => {
        const student = await createBaseStudent({
            majors: [MajorGroup.HUMANITIES],
        });
        await setupValidStudentData(student.id);
        await dataSource.getRepository(CertificationEntity).save([
            { examType: CCNNType.JLPT, level: "N2", studentId: student.id },
            {
                cefr: CEFR.C1,
                examType: CCNNType.IELTS,
                level: "7.0",
                studentId: student.id,
            },
        ]);

        const results = await predictionL2Service.getL2PredictResults(
            student.id,
        );
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
    });

    it("should handle student with all NOT_PASSED academic performances", async () => {
        const student = await createBaseStudent({
            majors: [MajorGroup.ENGINEERING],
        });
        await Promise.all([
            dataSource.getRepository(ConductEntity).save([
                { conduct: Conduct.GOOD, grade: 10, studentId: student.id },
                { conduct: Conduct.GOOD, grade: 11, studentId: student.id },
                { conduct: Conduct.GOOD, grade: 12, studentId: student.id },
            ]),
            dataSource.getRepository(NationalExamEntity).save([
                {
                    name: VietnameseSubject.TOAN,
                    score: 8.0,
                    studentId: student.id,
                },
                {
                    name: VietnameseSubject.VAT_LY,
                    score: 7.5,
                    studentId: student.id,
                },
                {
                    name: VietnameseSubject.HOA_HOC,
                    score: 7.0,
                    studentId: student.id,
                },
                {
                    name: VietnameseSubject.NGU_VAN,
                    score: 7.0,
                    studentId: student.id,
                },
            ]),
        ]);

        await dataSource.getRepository(AcademicPerformanceEntity).save([
            {
                academicPerformance: AcademicPerformance.NOT_PASSED,
                grade: 10,
                studentId: student.id,
            },
            {
                academicPerformance: AcademicPerformance.NOT_PASSED,
                grade: 11,
                studentId: student.id,
            },
            {
                academicPerformance: AcademicPerformance.NOT_PASSED,
                grade: 12,
                studentId: student.id,
            },
        ]);

        const results = await predictionL2Service.getL2PredictResults(
            student.id,
        );
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
    });

    it("should handle all DGNLType exam types", async () => {
        const student = await createBaseStudent({
            majors: [MajorGroup.ENGINEERING],
        });
        await setupValidStudentData(student.id);

        await dataSource.getRepository(AptitudeExamEntity).save([
            {
                examType: DGNLType.HSA,
                score: 150,
                studentId: student.id,
            },
            {
                examType: DGNLType.TSA,
                score: 100,
                studentId: student.id,
            },
            {
                examType: DGNLType.VNUHCM,
                score: 850,
                studentId: student.id,
                vnuhcmScoreComponents: {
                    languageScore: 350,
                    mathScore: 300,
                    scienceLogic: 200,
                },
            },
        ]);
        const results = await predictionL2Service.getL2PredictResults(
            student.id,
        );
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
    });
});
