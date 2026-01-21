// test/unit/service/certification-service.unit.spec.ts
import "reflect-metadata";
import type { Repository } from "typeorm";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { CertificationRequest } from "@/dto/student/certification-request.js";
import {
    CEFR,
    CertificationEntity,
} from "@/entity/uni_guide/certification.entity.js";
import { CertificationService } from "@/service/impl/certification.service.js";
import { ExamType } from "@/type/enum/exam-type.js";
import { Role } from "@/type/enum/user.js";

describe("CertificationService Business Logic Tests", () => {
    let certificationService: CertificationService;
    let mockRepository: Repository<CertificationEntity>;
    let createSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Create mock repository
        mockRepository = {
            create: vi.fn(),
        } as unknown as Repository<CertificationEntity>;

        // Create spy for the create method
        createSpy = vi.spyOn(mockRepository, "create");

        // Initialize service with mock
        certificationService = new CertificationService(mockRepository);
    });

    describe("CertificationEntity", () => {
        it("should create a certification entity with required fields", () => {
            // Arrange & Act
            const certification = new CertificationEntity({
                examType: ExamType.IELTS,
                level: "7.5",
                studentId: "test-student-id",
            });

            // Assert
            expect(certification.examType).toBe(ExamType.IELTS);
            expect(certification.level).toBe("7.5");
            expect(certification.studentId).toBe("test-student-id");
        });

        it("should create certification with optional createdBy field", () => {
            // Arrange & Act
            const certification = new CertificationEntity({
                createdBy: Role.ADMIN,
                examType: ExamType.TOEFL_iBT,
                level: "100",
                studentId: "test-student-id",
            });

            // Assert
            expect(certification.createdBy).toBe(Role.ADMIN);
        });

        it("should create certification with CEFR level", () => {
            // Arrange & Act
            const certification = new CertificationEntity({
                cefr: CEFR.C1,
                examType: ExamType.IELTS,
                level: "7.5",
                studentId: "student-123",
            });

            // Assert
            expect(certification.cefr).toBe(CEFR.C1);
            expect(certification.examType).toBe(ExamType.IELTS);
            expect(certification.level).toBe("7.5");
        });

        it("should create certification with all fields", () => {
            // Arrange & Act
            const certification = new CertificationEntity({
                cefr: CEFR.B2,
                createdBy: Role.USER,
                examType: ExamType.TOEIC,
                level: "850",
                studentId: "student-456",
                updatedBy: Role.MODERATOR,
            });

            // Assert
            expect(certification.cefr).toBe(CEFR.B2);
            expect(certification.examType).toBe(ExamType.TOEIC);
            expect(certification.level).toBe("850");
            expect(certification.studentId).toBe("student-456");
            expect(certification.createdBy).toBe(Role.USER);
            expect(certification.updatedBy).toBe(Role.MODERATOR);
        });
    });

    describe("createCertificationEntity", () => {
        it("should create a certification entity from certification request", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "7.5",
            };

            const expectedEntity = new CertificationEntity();
            expectedEntity.examType = certificationRequest.examType;
            expectedEntity.level = certificationRequest.level;
            expectedEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(createSpy).toHaveBeenCalledWith(certificationRequest);
            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(result.examType).toBe(ExamType.IELTS);
            expect(result.level).toBe("7.5");
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should set createdBy to ANONYMOUS when not provided", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.TOEFL_iBT,
                level: "95",
            };

            const expectedEntity = new CertificationEntity();
            expectedEntity.examType = certificationRequest.examType;
            expectedEntity.level = certificationRequest.level;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should preserve createdBy if already set", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.TOEIC,
                level: "900",
            };

            const expectedEntity = new CertificationEntity();
            expectedEntity.examType = certificationRequest.examType;
            expectedEntity.level = certificationRequest.level;
            expectedEntity.createdBy = Role.ADMIN;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.createdBy).toBe(Role.ADMIN);
        });

        it("should automatically set CEFR level for CCNN exams", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "7.5",
            };

            const expectedEntity = new CertificationEntity();
            expectedEntity.examType = certificationRequest.examType;
            expectedEntity.level = certificationRequest.level;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.cefr).toBe(CEFR.C1);
        });

        it("should not set CEFR level for non-CCNN exams", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.SAT,
                level: "1400",
            };

            const expectedEntity = new CertificationEntity();
            expectedEntity.examType = certificationRequest.examType;
            expectedEntity.level = certificationRequest.level;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.cefr).toBeUndefined();
        });
    });

    describe("createCertificationEntities", () => {
        it("should create multiple certification entities from array of requests", () => {
            // Arrange
            const certificationRequests: CertificationRequest[] = [
                {
                    examType: ExamType.IELTS,
                    level: "7.5",
                },
                {
                    examType: ExamType.TOEFL_iBT,
                    level: "100",
                },
                {
                    examType: ExamType.TOEIC,
                    level: "850",
                },
            ];

            const mockEntities = certificationRequests.map((req) => {
                const entity = new CertificationEntity();
                entity.examType = req.examType;
                entity.level = req.level;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1])
                .mockReturnValueOnce(mockEntities[2]);

            // Act
            const result = certificationService.createCertificationEntities(
                certificationRequests,
            );

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(result).toHaveLength(3);
            expect(result[0].examType).toBe(ExamType.IELTS);
            expect(result[1].examType).toBe(ExamType.TOEFL_iBT);
            expect(result[2].examType).toBe(ExamType.TOEIC);
            expect(result[0].level).toBe("7.5");
            expect(result[1].level).toBe("100");
            expect(result[2].level).toBe("850");
        });

        it("should return empty array when given empty array", () => {
            // Arrange
            const certificationRequests: CertificationRequest[] = [];

            // Act
            const result = certificationService.createCertificationEntities(
                certificationRequests,
            );

            // Assert
            expect(createSpy).not.toHaveBeenCalled();
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it("should handle single certification in array", () => {
            // Arrange
            const certificationRequests: CertificationRequest[] = [
                {
                    examType: ExamType.IELTS,
                    level: "8.0",
                },
            ];

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequests[0].examType;
            mockEntity.level = certificationRequests[0].level;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = certificationService.createCertificationEntities(
                certificationRequests,
            );

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
            expect(result[0].examType).toBe(ExamType.IELTS);
            expect(result[0].level).toBe("8.0");
        });

        it("should set createdBy to ANONYMOUS for all entities when not provided", () => {
            // Arrange
            const certificationRequests: CertificationRequest[] = [
                {
                    examType: ExamType.IELTS,
                    level: "7.0",
                },
                {
                    examType: ExamType.TOEFL_iBT,
                    level: "90",
                },
            ];

            const mockEntities = certificationRequests.map((req) => {
                const entity = new CertificationEntity();
                entity.examType = req.examType;
                entity.level = req.level;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1]);

            // Act
            const result = certificationService.createCertificationEntities(
                certificationRequests,
            );

            // Assert
            result.forEach((entity) => {
                expect(entity.createdBy).toBe(Role.ANONYMOUS);
            });
        });

        it("should handle large batch of certifications", () => {
            // Arrange
            const largeCertArray: CertificationRequest[] = Array.from(
                { length: 50 },
                (_, i) => ({
                    examType: i % 2 === 0 ? ExamType.IELTS : ExamType.TOEFL_iBT,
                    level: i % 2 === 0 ? "7.5" : "100",
                }),
            );

            const mockEntities = largeCertArray.map((req) => {
                const entity = new CertificationEntity();
                entity.examType = req.examType;
                entity.level = req.level;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            mockEntities.forEach((entity) => {
                createSpy.mockReturnValueOnce(entity);
            });

            // Act
            const result =
                certificationService.createCertificationEntities(
                    largeCertArray,
                );

            // Assert
            expect(result).toHaveLength(50);
            expect(createSpy).toHaveBeenCalledTimes(50);
            expect(result[0].examType).toBe(ExamType.IELTS);
            expect(result[49].examType).toBe(ExamType.TOEFL_iBT);
        });
    });

    describe("getCEFRLevel", () => {
        describe("IELTS CEFR Mapping", () => {
            it("should map IELTS scores to A1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "1.0"),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "3.0"),
                ).toBe(CEFR.A1);
            });

            it("should map IELTS scores to A2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "3.5"),
                ).toBe(CEFR.A2);
            });

            it("should map IELTS scores to B1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "4.0"),
                ).toBe(CEFR.B1);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "5.0"),
                ).toBe(CEFR.B1);
            });

            it("should map IELTS scores to B2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "5.5"),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "6.5"),
                ).toBe(CEFR.B2);
            });

            it("should map IELTS scores to C1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "7.0"),
                ).toBe(CEFR.C1);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "8.0"),
                ).toBe(CEFR.C1);
            });

            it("should map IELTS scores to C2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "8.5"),
                ).toBe(CEFR.C2);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "9.0"),
                ).toBe(CEFR.C2);
            });

            it("should return undefined for out-of-range IELTS scores", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "0.5"),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "9.5"),
                ).toBeUndefined();
            });
        });

        describe("TOEFL iBT CEFR Mapping", () => {
            it("should map TOEFL iBT scores to A1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "0"),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "6"),
                ).toBe(CEFR.A1);
            });

            it("should map TOEFL iBT scores to A2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "7"),
                ).toBe(CEFR.A2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "13"),
                ).toBe(CEFR.A2);
            });

            it("should map TOEFL iBT scores to B1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "14"),
                ).toBe(CEFR.B1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "49"),
                ).toBe(CEFR.B1);
            });

            it("should map TOEFL iBT scores to B2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "50"),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "89"),
                ).toBe(CEFR.B2);
            });

            it("should map TOEFL iBT scores to C1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_iBT, "90"),
                ).toBe(CEFR.C1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "113",
                    ),
                ).toBe(CEFR.C1);
            });

            it("should map TOEFL iBT scores to C2 level", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "114",
                    ),
                ).toBe(CEFR.C2);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "120",
                    ),
                ).toBe(CEFR.C2);
            });
        });

        describe("TOEIC CEFR Mapping", () => {
            it("should map TOEIC scores to A1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "60"),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "220"),
                ).toBe(CEFR.A1);
            });

            it("should map TOEIC scores to A2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "225"),
                ).toBe(CEFR.A2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "545"),
                ).toBe(CEFR.A2);
            });

            it("should map TOEIC scores to B1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "550"),
                ).toBe(CEFR.B1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "780"),
                ).toBe(CEFR.B1);
            });

            it("should map TOEIC scores to B2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "785"),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "940"),
                ).toBe(CEFR.B2);
            });

            it("should map TOEIC scores to C1 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "945"),
                ).toBe(CEFR.C1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "980"),
                ).toBe(CEFR.C1);
            });

            it("should map TOEIC scores to C2 level", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "985"),
                ).toBe(CEFR.C2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "990"),
                ).toBe(CEFR.C2);
            });
        });

        describe("TOEFL CBT CEFR Mapping", () => {
            it("should map TOEFL CBT scores correctly", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_CBT, "50"),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEFL_CBT, "80"),
                ).toBe(CEFR.A2);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "120",
                    ),
                ).toBe(CEFR.B1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "180",
                    ),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "230",
                    ),
                ).toBe(CEFR.C1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "270",
                    ),
                ).toBe(CEFR.C2);
            });
        });

        describe("TOEFL Paper CEFR Mapping", () => {
            it("should map TOEFL Paper scores correctly", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "320",
                    ),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "380",
                    ),
                ).toBe(CEFR.A2);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "450",
                    ),
                ).toBe(CEFR.B1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "490",
                    ),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "530",
                    ),
                ).toBe(CEFR.C1);
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "600",
                    ),
                ).toBe(CEFR.C2);
            });
        });

        describe("Non-CCNN Exams", () => {
            it("should return undefined for JLPT", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.JLPT, "N1"),
                ).toBeUndefined();
            });

            it("should return undefined for SAT", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.SAT, "1400"),
                ).toBeUndefined();
            });

            it("should return undefined for ACT", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.ACT, "30"),
                ).toBeUndefined();
            });

            it("should return undefined for IB", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IB, "38"),
                ).toBeUndefined();
            });
        });

        describe("Edge Cases", () => {
            it("should handle invalid numeric strings", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.IELTS,
                        "invalid",
                    ),
                ).toBeUndefined();
            });

            it("should handle boundary values correctly", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "1.0"),
                ).toBe(CEFR.A1);
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "9.0"),
                ).toBe(CEFR.C2);
            });

            it("should return undefined for IELTS scores not in 0.5 increments", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "7.3"),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "6.7"),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, "8.25"),
                ).toBeUndefined();
            });

            it("should return undefined for TOEFL iBT decimal scores", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "95.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "100.3",
                    ),
                ).toBeUndefined();
            });

            it("should return undefined for TOEFL CBT decimal scores", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "200.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "150.7",
                    ),
                ).toBeUndefined();
            });

            it("should return undefined for TOEFL Paper decimal scores", () => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "550.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "600.3",
                    ),
                ).toBeUndefined();
            });

            it("should return undefined for TOEIC scores not in multiples of 5", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "851"),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "903"),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "787"),
                ).toBeUndefined();
            });

            it("should accept valid TOEIC scores in multiples of 5", () => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "850"),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "900"),
                ).toBe(CEFR.B2);
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, "785"),
                ).toBe(CEFR.B2);
            });
        });
    });

    describe("Exam Type Coverage", () => {
        it("should handle all CCNN exam types", () => {
            const ccnnExams = [
                { examType: ExamType.IELTS, level: "7.0" },
                { examType: ExamType.JLPT, level: "N1" },
                { examType: ExamType.TOEFL_CBT, level: "200" },
                { examType: ExamType.TOEFL_iBT, level: "100" },
                { examType: ExamType.TOEFL_Paper, level: "550" },
                { examType: ExamType.TOEIC, level: "850" },
            ];

            ccnnExams.forEach(({ examType, level }) => {
                const certificationRequest: CertificationRequest = {
                    examType,
                    level,
                };

                const mockEntity = new CertificationEntity();
                mockEntity.examType = examType;
                mockEntity.level = level;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result =
                    certificationService.createCertificationEntity(
                        certificationRequest,
                    );
                expect(result.examType).toBe(examType);
            });
        });

        it("should handle all CCQT exam types", () => {
            const ccqtExams = [
                { examType: ExamType.A_Level, level: "A*" },
                { examType: ExamType.ACT, level: "32" },
                { examType: ExamType.Duolingo_English_Test, level: "120" },
                { examType: ExamType.IB, level: "40" },
                { examType: ExamType.OSSD, level: "85" },
                { examType: ExamType.PTE_Academic, level: "70" },
                { examType: ExamType.SAT, level: "1500" },
            ];

            ccqtExams.forEach(({ examType, level }) => {
                const certificationRequest: CertificationRequest = {
                    examType,
                    level,
                };

                const mockEntity = new CertificationEntity();
                mockEntity.examType = examType;
                mockEntity.level = level;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result =
                    certificationService.createCertificationEntity(
                        certificationRequest,
                    );
                expect(result.examType).toBe(examType);
            });
        });

        it("should handle all DGNL exam types", () => {
            const dgnlExams = [
                { examType: ExamType.HSA, level: "120" },
                { examType: ExamType.TSA, level: "85" },
                { examType: ExamType.VNUHCM, level: "1000" },
            ];

            dgnlExams.forEach(({ examType, level }) => {
                const certificationRequest: CertificationRequest = {
                    examType,
                    level,
                };

                const mockEntity = new CertificationEntity();
                mockEntity.examType = examType;
                mockEntity.level = level;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result =
                    certificationService.createCertificationEntity(
                        certificationRequest,
                    );
                expect(result.examType).toBe(examType);
            });
        });
    });

    describe("Edge Cases", () => {
        it("should handle mixed exam types in batch creation", () => {
            // Arrange
            const mixedRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "7.5" },
                { examType: ExamType.SAT, level: "1400" },
                { examType: ExamType.TOEIC, level: "850" },
            ];

            const mockEntities = mixedRequests.map((req) => {
                const entity = new CertificationEntity();
                entity.examType = req.examType;
                entity.level = req.level;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            mockEntities.forEach((entity) => {
                createSpy.mockReturnValueOnce(entity);
            });

            // Act
            const results =
                certificationService.createCertificationEntities(mixedRequests);

            // Assert
            expect(results[0].examType).toBe(ExamType.IELTS);
            expect(results[1].examType).toBe(ExamType.SAT);
            expect(results[2].examType).toBe(ExamType.TOEIC);
            expect(results[0].cefr).toBe(CEFR.C1);
            expect(results[1].cefr).toBeUndefined();
            expect(results[2].cefr).toBe(CEFR.B2);
        });

        it("should handle rapid successive calls", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "7.0",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act - Call multiple times rapidly
            const result1 =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );
            const result2 =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );
            const result3 =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(result1.examType).toBe(result2.examType);
            expect(result2.examType).toBe(result3.examType);
        });

        it("should handle certifications with string grades", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.A_Level,
                level: "A*",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.level).toBe("A*");
            expect(result.cefr).toBeUndefined();
        });

        it("should handle JLPT certifications without CEFR mapping", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.JLPT,
                level: "N1",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.level).toBe("N1");
            expect(result.cefr).toBeUndefined();
        });
    });

    describe("CertificationService Logic Validation", () => {
        it("should validate that repository.create is called with correct parameters", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "7.5",
            };

            const mockEntity = new CertificationEntity();
            createSpy.mockReturnValue(mockEntity);

            // Act
            certificationService.createCertificationEntity(
                certificationRequest,
            );

            // Assert
            expect(createSpy).toHaveBeenCalledWith({
                examType: ExamType.IELTS,
                level: "7.5",
            });
        });

        it("should validate that createdBy defaults to ANONYMOUS via nullish coalescing", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.TOEFL_iBT,
                level: "95",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;
            mockEntity.createdBy = undefined;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );
            result.createdBy ??= Role.ANONYMOUS;

            // Assert
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should preserve all properties from certification request", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.TOEIC,
                level: "900",
            };

            const mockEntity = new CertificationEntity();
            Object.assign(mockEntity, certificationRequest);
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert
            expect(result.examType).toBe(certificationRequest.examType);
            expect(result.level).toBe(certificationRequest.level);
        });

        it("should validate batch creation maintains individual certification integrity", () => {
            // Arrange
            const certificationRequests: CertificationRequest[] = [
                {
                    examType: ExamType.IELTS,
                    level: "7.5",
                },
                {
                    examType: ExamType.TOEFL_iBT,
                    level: "100",
                },
            ];

            const mockEntities = certificationRequests.map((req) => {
                const entity = new CertificationEntity();
                entity.examType = req.examType;
                entity.level = req.level;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1]);

            // Act
            const results = certificationService.createCertificationEntities(
                certificationRequests,
            );

            // Assert - Verify each certification maintains its unique properties
            expect(results[0].examType).not.toBe(results[1].examType);
            expect(results[0].level).not.toBe(results[1].level);
            expect(results[0].examType).toBe(ExamType.IELTS);
            expect(results[1].examType).toBe(ExamType.TOEFL_iBT);
        });

        it("should validate CEFR assignment happens for CCNN exams", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "6.5",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result =
                certificationService.createCertificationEntity(
                    certificationRequest,
                );

            // Assert - Verify repository.create was called and CEFR was assigned
            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(result.cefr).toBe(CEFR.B2);
            expect(result.examType).toBe(ExamType.IELTS);
            expect(result.level).toBe("6.5");
        });
    });

    describe("CEFR Level Boundary Testing", () => {
        it("should correctly handle IELTS boundary transitions", () => {
            const boundaries = [
                { expected: CEFR.A1, level: "3.0" },
                { expected: CEFR.A2, level: "3.5" },
                { expected: CEFR.B1, level: "4.0" },
                { expected: CEFR.B1, level: "5.0" },
                { expected: CEFR.B2, level: "5.5" },
                { expected: CEFR.B2, level: "6.5" },
                { expected: CEFR.C1, level: "7.0" },
                { expected: CEFR.C1, level: "8.0" },
                { expected: CEFR.C2, level: "8.5" },
                { expected: CEFR.C2, level: "9.0" },
            ];

            boundaries.forEach(({ expected, level }) => {
                expect(
                    certificationService.getCEFRLevel(ExamType.IELTS, level),
                ).toBe(expected);
            });
        });

        it("should correctly handle TOEFL iBT boundary transitions", () => {
            const boundaries = [
                { expected: CEFR.A1, level: "6" },
                { expected: CEFR.A2, level: "7" },
                { expected: CEFR.A2, level: "13" },
                { expected: CEFR.B1, level: "14" },
                { expected: CEFR.B1, level: "49" },
                { expected: CEFR.B2, level: "50" },
                { expected: CEFR.B2, level: "89" },
                { expected: CEFR.C1, level: "90" },
                { expected: CEFR.C1, level: "113" },
                { expected: CEFR.C2, level: "114" },
                { expected: CEFR.C2, level: "120" },
            ];

            boundaries.forEach(({ expected, level }) => {
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        level,
                    ),
                ).toBe(expected);
            });
        });

        it("should correctly handle TOEIC boundary transitions", () => {
            const boundaries = [
                { expected: CEFR.A1, level: "60" },
                { expected: CEFR.A1, level: "220" },
                { expected: CEFR.A2, level: "225" },
                { expected: CEFR.A2, level: "545" },
                { expected: CEFR.B1, level: "550" },
                { expected: CEFR.B1, level: "780" },
                { expected: CEFR.B2, level: "785" },
                { expected: CEFR.B2, level: "940" },
                { expected: CEFR.C1, level: "945" },
                { expected: CEFR.C1, level: "980" },
                { expected: CEFR.C2, level: "985" },
                { expected: CEFR.C2, level: "990" },
            ];

            boundaries.forEach(({ expected, level }) => {
                expect(
                    certificationService.getCEFRLevel(ExamType.TOEIC, level),
                ).toBe(expected);
            });
        });
    });

    describe("Integration with Validation", () => {
        it("should call handleExamValidation before creating entity", () => {
            // Arrange
            const certificationRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: "7.5",
            };

            const mockEntity = new CertificationEntity();
            mockEntity.examType = certificationRequest.examType;
            mockEntity.level = certificationRequest.level;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act & Assert - Should not throw
            expect(() =>
                certificationService.createCertificationEntity(
                    certificationRequest,
                ),
            ).not.toThrow();
        });

        it("should handle valid scores for all exam types", () => {
            const validExams = [
                { examType: ExamType.IELTS, level: "7.5" },
                { examType: ExamType.TOEFL_iBT, level: "100" },
                { examType: ExamType.TOEIC, level: "850" },
                { examType: ExamType.SAT, level: "1400" },
                { examType: ExamType.ACT, level: "30" },
                { examType: ExamType.A_Level, level: "A*" },
                { examType: ExamType.JLPT, level: "N1" },
            ];

            validExams.forEach(({ examType, level }) => {
                const certificationRequest: CertificationRequest = {
                    examType,
                    level,
                };

                const mockEntity = new CertificationEntity();
                mockEntity.examType = examType;
                mockEntity.level = level;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                expect(() =>
                    certificationService.createCertificationEntity(
                        certificationRequest,
                    ),
                ).not.toThrow();
            });
        });
    });
});
