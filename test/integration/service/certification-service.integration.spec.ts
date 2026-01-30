import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
// test/integration/service/certification-service.integration.spec.ts
import { beforeAll, describe, expect, it } from "vitest";

import type { ICertificationService } from "@/service/certification-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { CertificationRequest } from "@/dto/student/certification-request.js";
import { CEFR } from "@/entity/uni_guide/certification.entity.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";
import {
    ExamType,
    isCCNNType,
    isCCQTType,
    isDGNLType,
} from "@/type/enum/exam-type.enum.js";
import { Role } from "@/type/enum/user.enum.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

describe("CertificationService Integration Tests", () => {
    let certificationService: ICertificationService;

    beforeAll(() => {
        getApp();
        certificationService = iocContainer.get<ICertificationService>(
            TYPES.ICertificationService,
        );
    });

    describe("createCertificationEntity", () => {
        describe("IELTS Certifications", () => {
            it("should create IELTS certification with valid score", () => {
                // Arrange
                const certRequest: CertificationRequest = {
                    examType: ExamType.IELTS,
                    level: "7.5",
                };

                // Act
                const result =
                    certificationService.createCertificationEntity(certRequest);

                // Assert
                expect(result).toBeDefined();
                expect(result.examType).toBe(ExamType.IELTS);
                expect(result.level).toBe("7.5");
                expect(result.cefr).toBe(CEFR.C1);
                expect(result.createdBy).toBe(Role.ANONYMOUS);
            });

            it("should map IELTS scores to correct CEFR levels", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "3.0" },
                    { expectedCEFR: CEFR.A2, score: "3.5" },
                    { expectedCEFR: CEFR.B1, score: "4.0" },
                    { expectedCEFR: CEFR.B1, score: "5.0" },
                    { expectedCEFR: CEFR.B2, score: "5.5" },
                    { expectedCEFR: CEFR.B2, score: "6.5" },
                    { expectedCEFR: CEFR.C1, score: "7.0" },
                    { expectedCEFR: CEFR.C1, score: "8.0" },
                    { expectedCEFR: CEFR.C2, score: "8.5" },
                    { expectedCEFR: CEFR.C2, score: "9.0" },
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.IELTS,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for invalid IELTS score range", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "0.5",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "9.5",
                    }),
                ).toThrow(ValidationException);
            });

            it("should throw ValidationException for invalid IELTS score increment", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "7.3",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "8.7",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("TOEFL CBT Certifications", () => {
            it("should create TOEFL CBT certification with valid score", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.TOEFL_CBT,
                    level: "200",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.TOEFL_CBT);
                expect(result.level).toBe("200");
                expect(result.cefr).toBe(CEFR.B2);
            });

            it("should map TOEFL CBT scores to correct CEFR levels", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "50" },
                    { expectedCEFR: CEFR.A1, score: "60" },
                    { expectedCEFR: CEFR.A2, score: "75" },
                    { expectedCEFR: CEFR.A2, score: "90" },
                    { expectedCEFR: CEFR.B1, score: "120" },
                    { expectedCEFR: CEFR.B1, score: "150" },
                    { expectedCEFR: CEFR.B2, score: "180" },
                    { expectedCEFR: CEFR.B2, score: "210" },
                    { expectedCEFR: CEFR.C1, score: "225" },
                    { expectedCEFR: CEFR.C1, score: "240" },
                    { expectedCEFR: CEFR.C2, score: "270" },
                    { expectedCEFR: CEFR.C2, score: "300" },
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_CBT,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for out of range TOEFL CBT scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_CBT,
                        level: "32",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_CBT,
                        level: "301",
                    }),
                ).toThrow(ValidationException);
            });

            it("should throw ValidationException for non-whole number TOEFL CBT scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_CBT,
                        level: "150.5",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("TOEFL iBT Certifications", () => {
            it("should create TOEFL iBT certification with valid score", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.TOEFL_iBT,
                    level: "95",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.TOEFL_iBT);
                expect(result.level).toBe("95");
                expect(result.cefr).toBe(CEFR.C1);
            });

            it("should map TOEFL iBT scores to correct CEFR levels", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "5" },
                    { expectedCEFR: CEFR.A2, score: "7" },
                    { expectedCEFR: CEFR.A2, score: "13" },
                    { expectedCEFR: CEFR.B1, score: "14" },
                    { expectedCEFR: CEFR.B1, score: "49" },
                    { expectedCEFR: CEFR.B2, score: "50" },
                    { expectedCEFR: CEFR.B2, score: "89" },
                    { expectedCEFR: CEFR.C1, score: "90" },
                    { expectedCEFR: CEFR.C1, score: "113" },
                    { expectedCEFR: CEFR.C2, score: "114" },
                    { expectedCEFR: CEFR.C2, score: "120" },
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_iBT,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for out of range TOEFL iBT scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_iBT,
                        level: "-1",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_iBT,
                        level: "121",
                    }),
                ).toThrow(ValidationException);
            });

            it("should throw ValidationException for non-whole number TOEFL iBT scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_iBT,
                        level: "95.5",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("TOEFL Paper Certifications", () => {
            it("should create TOEFL Paper certification with valid score", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.TOEFL_Paper,
                    level: "550",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.TOEFL_Paper);
                expect(result.level).toBe("550");
                expect(result.cefr).toBe(CEFR.C1);
            });

            it("should map TOEFL Paper scores to correct CEFR levels", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "320" },
                    { expectedCEFR: CEFR.A2, score: "347" },
                    { expectedCEFR: CEFR.A2, score: "396" },
                    { expectedCEFR: CEFR.B1, score: "397" },
                    { expectedCEFR: CEFR.B1, score: "476" },
                    { expectedCEFR: CEFR.B2, score: "477" },
                    { expectedCEFR: CEFR.B2, score: "506" },
                    { expectedCEFR: CEFR.C1, score: "507" },
                    { expectedCEFR: CEFR.C1, score: "559" },
                    { expectedCEFR: CEFR.C2, score: "560" },
                    { expectedCEFR: CEFR.C2, score: "677" },
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_Paper,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for out of range TOEFL Paper scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_Paper,
                        level: "309",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_Paper,
                        level: "678",
                    }),
                ).toThrow(ValidationException);
            });

            it("should throw ValidationException for non-whole number TOEFL Paper scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEFL_Paper,
                        level: "550.5",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("TOEIC Certifications", () => {
            it("should create TOEIC certification with valid score", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.TOEIC,
                    level: "850",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.TOEIC);
                expect(result.level).toBe("850");
                expect(result.cefr).toBe(CEFR.B2);
            });

            it("should map TOEIC scores to correct CEFR levels", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "100" },
                    { expectedCEFR: CEFR.A2, score: "225" },
                    { expectedCEFR: CEFR.A2, score: "545" },
                    { expectedCEFR: CEFR.B1, score: "550" },
                    { expectedCEFR: CEFR.B1, score: "780" },
                    { expectedCEFR: CEFR.B2, score: "785" },
                    { expectedCEFR: CEFR.B2, score: "940" },
                    { expectedCEFR: CEFR.C1, score: "945" },
                    { expectedCEFR: CEFR.C1, score: "980" },
                    { expectedCEFR: CEFR.C2, score: "985" },
                    { expectedCEFR: CEFR.C2, score: "990" },
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEIC,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for out of range TOEIC scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "55",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "995",
                    }),
                ).toThrow(ValidationException);
            });

            it("should throw ValidationException for non-multiple of 5 TOEIC scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "851",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "783",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("JLPT Certifications", () => {
            it("should create JLPT certification with valid level", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.JLPT,
                    level: "N2",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.JLPT);
                expect(result.level).toBe("N2");
                expect(result.cefr).toBeUndefined();
            });

            it("should accept all valid JLPT levels", () => {
                const validLevels = ["N1", "N2", "N3", "N4", "N5"];

                validLevels.forEach((level) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.JLPT,
                            level,
                        });
                    expect(result.level).toBe(level);
                    expect(result.cefr).toBeUndefined();
                });
            });

            it("should throw ValidationException for invalid JLPT levels", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.JLPT,
                        level: "N6",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.JLPT,
                        level: "N0",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.JLPT,
                        level: "1",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("Non-CCNN Exam Types", () => {
            it("should create SAT certification without CEFR mapping", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.SAT,
                    level: "1400",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.SAT);
                expect(result.level).toBe("1400");
                expect(result.cefr).toBeUndefined();
            });

            it("should create ACT certification without CEFR mapping", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.ACT,
                    level: "30",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.ACT);
                expect(result.level).toBe("30");
                expect(result.cefr).toBeUndefined();
            });

            it("should create IB certification without CEFR mapping", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.IB,
                    level: "38",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.IB);
                expect(result.level).toBe("38");
                expect(result.cefr).toBeUndefined();
            });

            it("should create A_Level certification without CEFR mapping", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.A_Level,
                    level: "A*",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.examType).toBe(ExamType.A_Level);
                expect(result.level).toBe("A*");
                expect(result.cefr).toBeUndefined();
            });
        });

        describe("CreatedBy Field", () => {
            it("should set createdBy to ANONYMOUS when not provided", () => {
                const certRequest: CertificationRequest = {
                    examType: ExamType.IELTS,
                    level: "7.0",
                };

                const result =
                    certificationService.createCertificationEntity(certRequest);

                expect(result.createdBy).toBe(Role.ANONYMOUS);
            });
        });
    });

    describe("createCertificationEntities", () => {
        it("should create multiple certification entities", () => {
            // Arrange
            const certRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "7.5" },
                { examType: ExamType.TOEIC, level: "850" },
                { examType: ExamType.JLPT, level: "N2" },
            ];

            // Act
            const results =
                certificationService.createCertificationEntities(certRequests);

            // Assert
            expect(results).toHaveLength(3);
            expect(results[0].examType).toBe(ExamType.IELTS);
            expect(results[0].cefr).toBe(CEFR.C1);
            expect(results[1].examType).toBe(ExamType.TOEIC);
            expect(results[1].cefr).toBe(CEFR.B2);
            expect(results[2].examType).toBe(ExamType.JLPT);
            expect(results[2].cefr).toBeUndefined();
        });

        it("should return empty array for empty input", () => {
            const results = certificationService.createCertificationEntities(
                [],
            );
            expect(results).toHaveLength(0);
        });

        it("should create entities with different CEFR levels", () => {
            const certRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "3.5" }, // A2
                { examType: ExamType.IELTS, level: "5.0" }, // B1
                { examType: ExamType.IELTS, level: "6.5" }, // B2
                { examType: ExamType.IELTS, level: "7.5" }, // C1
                { examType: ExamType.IELTS, level: "8.5" }, // C2
            ];

            const results =
                certificationService.createCertificationEntities(certRequests);

            expect(results).toHaveLength(5);
            expect(results[0].cefr).toBe(CEFR.A2);
            expect(results[1].cefr).toBe(CEFR.B1);
            expect(results[2].cefr).toBe(CEFR.B2);
            expect(results[3].cefr).toBe(CEFR.C1);
            expect(results[4].cefr).toBe(CEFR.C2);
        });

        it("should throw ValidationException if any certification is invalid", () => {
            const certRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "7.5" },
                { examType: ExamType.IELTS, level: "10.0" }, // Invalid
            ];

            expect(() =>
                certificationService.createCertificationEntities(certRequests),
            ).toThrow(ValidationException);
        });
    });

    describe("getCEFRLevel", () => {
        it("should return undefined for non-CCNN exam types", () => {
            expect(
                certificationService.getCEFRLevel(ExamType.SAT, "1400"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.ACT, "30"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.IB, "38"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.A_Level, "A*"),
            ).toBeUndefined();
        });

        it("should return undefined for JLPT (CCNN type but no CEFR mapping)", () => {
            expect(
                certificationService.getCEFRLevel(ExamType.JLPT, "N2"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.JLPT, "N1"),
            ).toBeUndefined();
        });

        it("should return undefined for invalid numeric levels", () => {
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "invalid"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "abc"),
            ).toBeUndefined();
        });

        it("should return undefined for out of range scores", () => {
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "0.5"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "9.5"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "50"),
            ).toBeUndefined();
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "1000"),
            ).toBeUndefined();
        });

        it("should handle boundary cases correctly", () => {
            // IELTS boundaries
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "3.5"),
            ).toBe(CEFR.A2);
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "4.0"),
            ).toBe(CEFR.B1);
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "5.5"),
            ).toBe(CEFR.B2);
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "7.0"),
            ).toBe(CEFR.C1);
            expect(
                certificationService.getCEFRLevel(ExamType.IELTS, "8.5"),
            ).toBe(CEFR.C2);

            // TOEIC boundaries
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "225"),
            ).toBe(CEFR.A2);
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "550"),
            ).toBe(CEFR.B1);
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "785"),
            ).toBe(CEFR.B2);
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "945"),
            ).toBe(CEFR.C1);
            expect(
                certificationService.getCEFRLevel(ExamType.TOEIC, "985"),
            ).toBe(CEFR.C2);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle whitespace in level strings", () => {
            const certRequest: CertificationRequest = {
                examType: ExamType.IELTS,
                level: " 7.5 ",
            };

            const result =
                certificationService.createCertificationEntity(certRequest);
            expect(result.cefr).toBe(CEFR.C1);
        });

        it("should handle level as string number for numeric exams", () => {
            const certRequest: CertificationRequest = {
                examType: ExamType.TOEIC,
                level: "850",
            };

            const result =
                certificationService.createCertificationEntity(certRequest);
            expect(result.level).toBe("850");
            expect(result.cefr).toBe(CEFR.B2);
        });

        it("should validate increment requirements for IELTS", () => {
            // Valid increments
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "6.0",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "6.5",
                }),
            ).not.toThrow();

            // Invalid increments
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "6.3",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "6.7",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate multiple of 5 requirement for TOEIC", () => {
            // Valid multiples of 5
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "750",
                }),
            ).not.toThrow();

            // Invalid - not multiple of 5
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "753",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate whole number requirement for TOEFL exams", () => {
            // Valid whole numbers
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "95",
                }),
            ).not.toThrow();

            // Invalid - decimal
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "95.5",
                }),
            ).toThrow(ValidationException);
        });
    });

    describe("Type Guard Tests", () => {
        it("should correctly identify CCNN types", () => {
            expect(isCCNNType(ExamType.IELTS)).toBe(true);
            expect(isCCNNType(ExamType.JLPT)).toBe(true);
            expect(isCCNNType(ExamType.TOEFL_CBT)).toBe(true);
            expect(isCCNNType(ExamType.TOEFL_iBT)).toBe(true);
            expect(isCCNNType(ExamType.TOEFL_Paper)).toBe(true);
            expect(isCCNNType(ExamType.TOEIC)).toBe(true);

            expect(isCCNNType(ExamType.SAT)).toBe(false);
            expect(isCCNNType(ExamType.ACT)).toBe(false);
            expect(isCCNNType(ExamType.IB)).toBe(false);
        });

        it("should correctly identify CCQT types", () => {
            expect(isCCQTType(ExamType.A_Level)).toBe(true);
            expect(isCCQTType(ExamType.ACT)).toBe(true);
            expect(isCCQTType(ExamType.Duolingo_English_Test)).toBe(true);
            expect(isCCQTType(ExamType.IB)).toBe(true);
            expect(isCCQTType(ExamType.OSSD)).toBe(true);
            expect(isCCQTType(ExamType.PTE_Academic)).toBe(true);
            expect(isCCQTType(ExamType.SAT)).toBe(true);

            expect(isCCQTType(ExamType.IELTS)).toBe(false);
            expect(isCCQTType(ExamType.TOEIC)).toBe(false);
        });

        it("should correctly identify DGNL types", () => {
            expect(isDGNLType(ExamType.HSA)).toBe(true);
            expect(isDGNLType(ExamType.TSA)).toBe(true);
            expect(isDGNLType(ExamType.VNUHCM)).toBe(true);

            expect(isDGNLType(ExamType.IELTS)).toBe(false);
            expect(isDGNLType(ExamType.SAT)).toBe(false);
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle mixed certification types in batch creation", () => {
            const certRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "7.5" }, // CCNN with CEFR
                { examType: ExamType.JLPT, level: "N2" }, // CCNN without CEFR
                { examType: ExamType.SAT, level: "1400" }, // CCQT
                { examType: ExamType.A_Level, level: "A*" }, // CCQT string
                { examType: ExamType.HSA, level: "120" }, // DGNL
            ];

            const results =
                certificationService.createCertificationEntities(certRequests);

            expect(results).toHaveLength(5);
            expect(results[0].cefr).toBe(CEFR.C1);
            expect(results[1].cefr).toBeUndefined();
            expect(results[2].cefr).toBeUndefined();
            expect(results[3].cefr).toBeUndefined();
            expect(results[4].cefr).toBeUndefined();
        });

        it("should handle all CEFR levels across different exam types", () => {
            const certRequests: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "3.0" }, // A1
                { examType: ExamType.TOEIC, level: "300" }, // A2
                { examType: ExamType.TOEFL_iBT, level: "45" }, // B1
                { examType: ExamType.TOEFL_CBT, level: "195" }, // B2
                { examType: ExamType.TOEFL_Paper, level: "530" }, // C1
                { examType: ExamType.IELTS, level: "9.0" }, // C2
            ];

            const results =
                certificationService.createCertificationEntities(certRequests);

            expect(results[0].cefr).toBe(CEFR.A1);
            expect(results[1].cefr).toBe(CEFR.A2);
            expect(results[2].cefr).toBe(CEFR.B1);
            expect(results[3].cefr).toBe(CEFR.B2);
            expect(results[4].cefr).toBe(CEFR.C1);
            expect(results[5].cefr).toBe(CEFR.C2);
        });

        it("should maintain separate validation for each exam type", () => {
            // IELTS allows 0.5 increments
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "7.5",
                }),
            ).not.toThrow();

            // TOEIC must be multiple of 5
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "755",
                }),
            ).not.toThrow();

            // TOEFL iBT must be whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "95",
                }),
            ).not.toThrow();

            // Each has different invalid patterns
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "7.3",
                }),
            ).toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "753",
                }),
            ).toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "95.5",
                }),
            ).toThrow();
        });
    });

    describe("Minimum and Maximum Score Tests", () => {
        it("should accept minimum valid scores", () => {
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "1.0",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_CBT,
                    level: "33",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "0",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_Paper,
                    level: "310",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "60",
                }),
            ).not.toThrow();
        });

        it("should accept maximum valid scores", () => {
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "9.0",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_CBT,
                    level: "300",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "120",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_Paper,
                    level: "677",
                }),
            ).not.toThrow();

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "990",
                }),
            ).not.toThrow();
        });

        it("should reject scores just below minimum", () => {
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "0.5",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_CBT,
                    level: "32",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_Paper,
                    level: "309",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "55",
                }),
            ).toThrow(ValidationException);
        });

        it("should reject scores just above maximum", () => {
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IELTS,
                    level: "9.5",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_CBT,
                    level: "301",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "121",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_Paper,
                    level: "678",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TOEIC,
                    level: "995",
                }),
            ).toThrow(ValidationException);
        });
    });

    describe("Additional Boundary and Edge Cases", () => {
        describe("IELTS Extended Coverage", () => {
            it("should map minimum and lower A1 IELTS scores correctly", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "1.0" }, // absolute minimum
                    { expectedCEFR: CEFR.A1, score: "1.5" },
                    { expectedCEFR: CEFR.A1, score: "2.0" },
                    { expectedCEFR: CEFR.A1, score: "2.5" },
                    { expectedCEFR: CEFR.A1, score: "3.0" }, // just below A2 threshold
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.IELTS,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for more invalid IELTS increments", () => {
                const invalidIncrements = ["4.2", "5.3", "6.1", "7.7", "8.3"];

                invalidIncrements.forEach((score) => {
                    expect(() =>
                        certificationService.createCertificationEntity({
                            examType: ExamType.IELTS,
                            level: score,
                        }),
                    ).toThrow(ValidationException);
                });
            });

            it("should throw ValidationException for negative IELTS scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "-1.0",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.IELTS,
                        level: "-0.5",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("TOEFL iBT Extended Coverage", () => {
            it("should map TOEFL iBT score 0 to A1", () => {
                const result = certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_iBT,
                    level: "0",
                });
                expect(result.cefr).toBe(CEFR.A1);
            });

            it("should handle critical TOEFL iBT boundary at score 7", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "0" },
                    { expectedCEFR: CEFR.A1, score: "6" }, // just below A2
                    { expectedCEFR: CEFR.A2, score: "7" }, // boundary
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_iBT,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });
        });

        describe("TOEFL CBT Extended Coverage", () => {
            it("should handle TOEFL CBT minimum boundary correctly", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "33" }, // absolute minimum
                    { expectedCEFR: CEFR.A1, score: "40" },
                    { expectedCEFR: CEFR.A1, score: "50" },
                    { expectedCEFR: CEFR.A1, score: "60" }, // upper bound of A1
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_CBT,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });
        });

        describe("TOEFL Paper Extended Coverage", () => {
            it("should handle TOEFL Paper minimum boundary", () => {
                const result = certificationService.createCertificationEntity({
                    examType: ExamType.TOEFL_Paper,
                    level: "310",
                });
                expect(result.cefr).toBe(CEFR.A1);
            });

            it("should map lower TOEFL Paper A1 range correctly", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "310" }, // minimum
                    { expectedCEFR: CEFR.A1, score: "330" },
                    { expectedCEFR: CEFR.A1, score: "346" }, // just below A2
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEFL_Paper,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });
        });

        describe("TOEIC Extended Coverage", () => {
            it("should map TOEIC lower A1 range correctly", () => {
                const testCases = [
                    { expectedCEFR: CEFR.A1, score: "60" }, // minimum
                    { expectedCEFR: CEFR.A1, score: "100" },
                    { expectedCEFR: CEFR.A1, score: "150" },
                    { expectedCEFR: CEFR.A1, score: "220" }, // just below A2
                ];

                testCases.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEIC,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should throw ValidationException for negative TOEIC scores", () => {
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "-5",
                    }),
                ).toThrow(ValidationException);

                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.TOEIC,
                        level: "-100",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("A_Level Complete Grade Coverage", () => {
            it("should accept all valid A-Level grades", () => {
                const validGrades = [
                    "A",
                    "A*",
                    "B",
                    "C",
                    "D",
                    "E",
                    "F",
                    "N",
                    "O",
                    "U",
                ];

                validGrades.forEach((grade) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.A_Level,
                            level: grade,
                        });
                    expect(result.level).toBe(grade);
                    expect(result.cefr).toBeUndefined();
                    expect(result.examType).toBe(ExamType.A_Level);
                });
            });

            it("should throw ValidationException for invalid A-Level grades", () => {
                const invalidGrades = [
                    "Z",
                    "A+",
                    "F-",
                    "AA",
                    "1",
                    "a",
                    "a*",
                    "B+",
                    "C-",
                ];

                invalidGrades.forEach((grade) => {
                    expect(() =>
                        certificationService.createCertificationEntity({
                            examType: ExamType.A_Level,
                            level: grade,
                        }),
                    ).toThrow(ValidationException);
                });
            });

            it("should be case-sensitive for A-Level grades", () => {
                // Valid uppercase
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.A_Level,
                        level: "A",
                    }),
                ).not.toThrow();

                // Invalid lowercase
                expect(() =>
                    certificationService.createCertificationEntity({
                        examType: ExamType.A_Level,
                        level: "a",
                    }),
                ).toThrow(ValidationException);
            });
        });

        describe("Negative Score Validation Across Exam Types", () => {
            it("should reject negative scores for all numeric exam types", () => {
                const negativeScoreTests = [
                    { examType: ExamType.IELTS, level: "-1.0" },
                    { examType: ExamType.TOEFL_iBT, level: "-1" },
                    { examType: ExamType.TOEFL_CBT, level: "-50" },
                    { examType: ExamType.TOEFL_Paper, level: "-100" },
                    { examType: ExamType.TOEIC, level: "-5" },
                    { examType: ExamType.SAT, level: "-100" },
                    { examType: ExamType.ACT, level: "-5" },
                    { examType: ExamType.IB, level: "-10" },
                ];

                negativeScoreTests.forEach(({ examType, level }) => {
                    expect(() =>
                        certificationService.createCertificationEntity({
                            examType,
                            level,
                        }),
                    ).toThrow(ValidationException);
                });
            });
        });

        describe("CCNN Exam Type Minimum Score CEFR Mapping", () => {
            it("should correctly map absolute minimum scores to CEFR A1", () => {
                const minScores = [
                    { cefr: CEFR.A1, examType: ExamType.IELTS, level: "1.0" },
                    { cefr: CEFR.A1, examType: ExamType.TOEFL_iBT, level: "0" },
                    {
                        cefr: CEFR.A1,
                        examType: ExamType.TOEFL_CBT,
                        level: "33",
                    },
                    {
                        cefr: CEFR.A1,
                        examType: ExamType.TOEFL_Paper,
                        level: "310",
                    },
                    { cefr: CEFR.A1, examType: ExamType.TOEIC, level: "60" },
                ];

                minScores.forEach(({ cefr, examType, level }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType,
                            level,
                        });
                    expect(result.cefr).toBe(cefr);
                });
            });
        });

        describe("Exact Boundary Transitions", () => {
            it("should handle exact CEFR level boundaries for IELTS", () => {
                const boundaries = [
                    { expectedCEFR: CEFR.A1, score: "3.0" }, // just below 3.5
                    { expectedCEFR: CEFR.A2, score: "3.5" }, // exact boundary
                    { expectedCEFR: CEFR.B1, score: "4.0" }, // exact boundary
                    { expectedCEFR: CEFR.B1, score: "5.0" }, // upper B1
                    { expectedCEFR: CEFR.B2, score: "5.5" }, // lower B2
                    { expectedCEFR: CEFR.B2, score: "6.5" }, // upper B2
                    { expectedCEFR: CEFR.C1, score: "7.0" }, // exact boundary
                    { expectedCEFR: CEFR.C1, score: "8.0" }, // upper C1
                    { expectedCEFR: CEFR.C2, score: "8.5" }, // exact boundary
                ];

                boundaries.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.IELTS,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });

            it("should handle exact CEFR level boundaries for TOEIC", () => {
                const boundaries = [
                    { expectedCEFR: CEFR.A1, score: "220" }, // just below 225
                    { expectedCEFR: CEFR.A2, score: "225" }, // exact boundary
                    { expectedCEFR: CEFR.A2, score: "545" }, // just below 550
                    { expectedCEFR: CEFR.B1, score: "550" }, // exact boundary
                    { expectedCEFR: CEFR.B1, score: "780" }, // just below 785
                    { expectedCEFR: CEFR.B2, score: "785" }, // exact boundary
                    { expectedCEFR: CEFR.B2, score: "940" }, // just below 945
                    { expectedCEFR: CEFR.C1, score: "945" }, // exact boundary
                    { expectedCEFR: CEFR.C1, score: "980" }, // just below 985
                    { expectedCEFR: CEFR.C2, score: "985" }, // exact boundary
                ];

                boundaries.forEach(({ expectedCEFR, score }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.TOEIC,
                            level: score,
                        });
                    expect(result.cefr).toBe(expectedCEFR);
                });
            });
        });

        describe("getCEFRLevel Boundary Coverage", () => {
            it("should return undefined for IELTS scores with invalid increments in getCEFRLevel", () => {
                const invalidIncrements = [
                    "5.1",
                    "5.2",
                    "5.3",
                    "5.4",
                    "5.6",
                    "5.7",
                    "5.8",
                    "5.9",
                ];

                invalidIncrements.forEach((score) => {
                    const result = certificationService.getCEFRLevel(
                        ExamType.IELTS,
                        score,
                    );
                    expect(result).toBeUndefined();
                });
            });

            it("should return undefined for TOEIC scores not multiple of 5 in getCEFRLevel", () => {
                const invalidScores = [
                    "751",
                    "752",
                    "753",
                    "754",
                    "756",
                    "757",
                    "758",
                    "759",
                ];

                invalidScores.forEach((score) => {
                    const result = certificationService.getCEFRLevel(
                        ExamType.TOEIC,
                        score,
                    );
                    expect(result).toBeUndefined();
                });
            });

            it("should return undefined for decimal TOEFL scores in getCEFRLevel", () => {
                // TOEFL iBT
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "90.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_iBT,
                        "100.1",
                    ),
                ).toBeUndefined();

                // TOEFL CBT
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "150.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_CBT,
                        "200.3",
                    ),
                ).toBeUndefined();

                // TOEFL Paper
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "500.5",
                    ),
                ).toBeUndefined();
                expect(
                    certificationService.getCEFRLevel(
                        ExamType.TOEFL_Paper,
                        "550.7",
                    ),
                ).toBeUndefined();
            });
        });

        describe("Edge Cases for All Exam Types", () => {
            it("should handle minimum valid scores that result in A1 CEFR across exam types", () => {
                const minA1Scores = [
                    { examType: ExamType.IELTS, level: "1.0" },
                    { examType: ExamType.IELTS, level: "1.5" },
                    { examType: ExamType.TOEFL_iBT, level: "0" },
                    { examType: ExamType.TOEFL_iBT, level: "3" },
                    { examType: ExamType.TOEFL_CBT, level: "33" },
                    { examType: ExamType.TOEFL_CBT, level: "45" },
                    { examType: ExamType.TOEFL_Paper, level: "310" },
                    { examType: ExamType.TOEFL_Paper, level: "330" },
                    { examType: ExamType.TOEIC, level: "60" },
                    { examType: ExamType.TOEIC, level: "100" },
                ];

                minA1Scores.forEach(({ examType, level }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType,
                            level,
                        });
                    expect(result.cefr).toBe(CEFR.A1);
                });
            });

            it("should handle maximum valid scores that result in C2 CEFR across exam types", () => {
                const maxC2Scores = [
                    { examType: ExamType.IELTS, level: "8.5" },
                    { examType: ExamType.IELTS, level: "9.0" },
                    { examType: ExamType.TOEFL_iBT, level: "114" },
                    { examType: ExamType.TOEFL_iBT, level: "120" },
                    { examType: ExamType.TOEFL_CBT, level: "270" },
                    { examType: ExamType.TOEFL_CBT, level: "300" },
                    { examType: ExamType.TOEFL_Paper, level: "600" },
                    { examType: ExamType.TOEFL_Paper, level: "677" },
                    { examType: ExamType.TOEIC, level: "985" },
                    { examType: ExamType.TOEIC, level: "990" },
                ];

                maxC2Scores.forEach(({ examType, level }) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType,
                            level,
                        });
                    expect(result.cefr).toBe(CEFR.C2);
                });
            });
        });

        describe("String-based Exam Types Complete Validation", () => {
            it("should validate all JLPT levels work correctly", () => {
                const jlptLevels = ["N1", "N2", "N3", "N4", "N5"];

                jlptLevels.forEach((level) => {
                    const result =
                        certificationService.createCertificationEntity({
                            examType: ExamType.JLPT,
                            level,
                        });
                    expect(result.level).toBe(level);
                    expect(result.examType).toBe(ExamType.JLPT);
                    expect(result.cefr).toBeUndefined();
                });
            });

            it("should reject JLPT levels with lowercase", () => {
                const invalidLevels = ["n1", "n2", "n3", "n4", "n5"];

                invalidLevels.forEach((level) => {
                    expect(() =>
                        certificationService.createCertificationEntity({
                            examType: ExamType.JLPT,
                            level,
                        }),
                    ).toThrow(ValidationException);
                });
            });
        });
    });

    describe("CCQT Exam Types Validation", () => {
        it("should validate SAT score range", () => {
            // SAT: 400-1600, multiple of 10
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.SAT,
                    level: "399", // below minimum
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.SAT,
                    level: "1601", // above maximum
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.SAT,
                    level: "1405", // not multiple of 10
                }),
            ).toThrow(ValidationException);
        });

        it("should validate ACT score range", () => {
            // ACT: 1-36, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.ACT,
                    level: "0",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.ACT,
                    level: "37",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.ACT,
                    level: "25.5", // decimal
                }),
            ).toThrow(ValidationException);
        });

        it("should validate IB score range", () => {
            // IB: 0-45, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IB,
                    level: "-1",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.IB,
                    level: "46",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate Duolingo English Test score range", () => {
            // Duolingo: 10-160, multiple of 5
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.Duolingo_English_Test,
                    level: "9",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.Duolingo_English_Test,
                    level: "161",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.Duolingo_English_Test,
                    level: "123", // not multiple of 5
                }),
            ).toThrow(ValidationException);
        });

        it("should validate OSSD score range", () => {
            // OSSD: 0-100, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.OSSD,
                    level: "-1",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.OSSD,
                    level: "101",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate PTE Academic score range", () => {
            // PTE: 10-90, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.PTE_Academic,
                    level: "9",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.PTE_Academic,
                    level: "91",
                }),
            ).toThrow(ValidationException);
        });
    });
    describe("DGNL Exam Types Validation", () => {
        it("should validate HSA score range", () => {
            // HSA: 0-150, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.HSA,
                    level: "-1",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.HSA,
                    level: "151",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate TSA score range", () => {
            // TSA: 0-100, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TSA,
                    level: "-1",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.TSA,
                    level: "101",
                }),
            ).toThrow(ValidationException);
        });

        it("should validate VNUHCM score range", () => {
            // VNUHCM: 0-1200, whole number
            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.VNUHCM,
                    level: "-1",
                }),
            ).toThrow(ValidationException);

            expect(() =>
                certificationService.createCertificationEntity({
                    examType: ExamType.VNUHCM,
                    level: "1201",
                }),
            ).toThrow(ValidationException);
        });
    });
    describe("Batch Operations Extended", () => {
        it("should handle very large batch (100+ certifications)", () => {
            const largeBatch = Array.from({ length: 100 }, (_, i) => ({
                examType: i % 2 === 0 ? ExamType.IELTS : ExamType.TOEIC,
                level: i % 2 === 0 ? "7.0" : "850",
            }));

            const results =
                certificationService.createCertificationEntities(largeBatch);
            expect(results).toHaveLength(100);
        });

        it("should handle batch with all exam types", () => {
            const allExamTypes: CertificationRequest[] = [
                { examType: ExamType.IELTS, level: "7.0" },
                { examType: ExamType.JLPT, level: "N2" },
                { examType: ExamType.TOEFL_CBT, level: "200" },
                { examType: ExamType.TOEFL_iBT, level: "95" },
                { examType: ExamType.TOEFL_Paper, level: "550" },
                { examType: ExamType.TOEIC, level: "850" },
                { examType: ExamType.SAT, level: "1400" },
                { examType: ExamType.ACT, level: "30" },
                { examType: ExamType.IB, level: "38" },
                { examType: ExamType.A_Level, level: "A*" },
                { examType: ExamType.Duolingo_English_Test, level: "120" },
                { examType: ExamType.OSSD, level: "85" },
                { examType: ExamType.PTE_Academic, level: "70" },
                { examType: ExamType.HSA, level: "120" },
                { examType: ExamType.TSA, level: "80" },
                { examType: ExamType.VNUHCM, level: "1000" },
            ];

            const results =
                certificationService.createCertificationEntities(allExamTypes);
            expect(results).toHaveLength(16);
        });
    });

    describe("DTO Validation with class-validator", () => {
        describe("Valid Certifications", () => {
            it("should validate IELTS certification DTO successfully", async () => {
                // Arrange
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "7.5",
                };

                // Act
                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                // Assert
                expect(errors).toHaveLength(0);
                expect(dto.examType).toBe(ExamType.IELTS);
                expect(dto.level).toBe("7.5");
            });

            it("should validate TOEIC certification DTO successfully", async () => {
                const plainObject = {
                    examType: ExamType.TOEIC,
                    level: "850",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors).toHaveLength(0);
            });

            it("should validate JLPT certification DTO successfully", async () => {
                const plainObject = {
                    examType: ExamType.JLPT,
                    level: "N2",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors).toHaveLength(0);
            });

            it("should validate A-Level certification DTO successfully", async () => {
                const plainObject = {
                    examType: ExamType.A_Level,
                    level: "A*",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors).toHaveLength(0);
            });

            it("should validate all CCNN exam types", async () => {
                const ccnnExams = [
                    { examType: ExamType.IELTS, level: "7.0" },
                    { examType: ExamType.JLPT, level: "N1" },
                    { examType: ExamType.TOEFL_CBT, level: "200" },
                    { examType: ExamType.TOEFL_iBT, level: "95" },
                    { examType: ExamType.TOEFL_Paper, level: "550" },
                    { examType: ExamType.TOEIC, level: "850" },
                ];

                for (const plainObject of ccnnExams) {
                    const dto = plainToInstance(
                        CertificationRequest,
                        plainObject,
                    );
                    const errors = await validate(dto);
                    expect(errors).toHaveLength(0);
                }
            });

            it("should validate all CCQT exam types", async () => {
                const ccqtExams = [
                    { examType: ExamType.A_Level, level: "A*" },
                    { examType: ExamType.ACT, level: "30" },
                    { examType: ExamType.Duolingo_English_Test, level: "120" },
                    { examType: ExamType.IB, level: "38" },
                    { examType: ExamType.OSSD, level: "85" },
                    { examType: ExamType.PTE_Academic, level: "70" },
                    { examType: ExamType.SAT, level: "1400" },
                ];

                for (const plainObject of ccqtExams) {
                    const dto = plainToInstance(
                        CertificationRequest,
                        plainObject,
                    );
                    const errors = await validate(dto);
                    expect(errors).toHaveLength(0);
                }
            });

            it("should validate all DGNL exam types", async () => {
                const dgnlExams = [
                    { examType: ExamType.HSA, level: "120" },
                    { examType: ExamType.TSA, level: "80" },
                    { examType: ExamType.VNUHCM, level: "1000" },
                ];

                for (const plainObject of dgnlExams) {
                    const dto = plainToInstance(
                        CertificationRequest,
                        plainObject,
                    );
                    const errors = await validate(dto);
                    expect(errors.length).toBeGreaterThan(0);
                }
            });
        });

        describe("Invalid Certifications - DTO Validation", () => {
            it("should fail validation for missing examType", async () => {
                const plainObject = {
                    level: "7.5",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe("examType");
            });

            it("should fail validation for missing level", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe("level");
            });

            it("should fail validation for empty level string", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for level exceeding max length", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "a".repeat(51), // exceeds 50 char limit
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for invalid IELTS score (out of range)", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "10.0",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for invalid IELTS increment", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "7.3",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for invalid TOEIC score (not multiple of 5)", async () => {
                const plainObject = {
                    examType: ExamType.TOEIC,
                    level: "853",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for invalid JLPT level", async () => {
                const plainObject = {
                    examType: ExamType.JLPT,
                    level: "N6",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for invalid A-Level grade", async () => {
                const plainObject = {
                    examType: ExamType.A_Level,
                    level: "Z",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for negative TOEIC score", async () => {
                const plainObject = {
                    examType: ExamType.TOEIC,
                    level: "-100",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for TOEFL iBT decimal score", async () => {
                const plainObject = {
                    examType: ExamType.TOEFL_iBT,
                    level: "95.5",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for SAT score not multiple of 10", async () => {
                const plainObject = {
                    examType: ExamType.SAT,
                    level: "1405",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for ACT decimal score", async () => {
                const plainObject = {
                    examType: ExamType.ACT,
                    level: "25.5",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });

            it("should fail validation for Duolingo not multiple of 5", async () => {
                const plainObject = {
                    examType: ExamType.Duolingo_English_Test,
                    level: "123",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors.length).toBeGreaterThan(0);
            });
        });

        describe("Integration - DTO Validation with Service", () => {
            it("should successfully create entity after DTO validation", async () => {
                // Arrange
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "7.5",
                };

                // Act - Validate DTO
                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                // Assert - No validation errors
                expect(errors).toHaveLength(0);

                // Act - Create entity via service
                const entity =
                    certificationService.createCertificationEntity(dto);

                // Assert - Entity created successfully
                expect(entity).toBeDefined();
                expect(entity.examType).toBe(ExamType.IELTS);
                expect(entity.level).toBe("7.5");
                expect(entity.cefr).toBe(CEFR.C1);
            });

            it("should validate and create multiple entities", async () => {
                // Arrange
                const plainObjects = [
                    { examType: ExamType.IELTS, level: "7.5" },
                    { examType: ExamType.TOEIC, level: "850" },
                    { examType: ExamType.JLPT, level: "N2" },
                ];

                // Act - Validate all DTOs
                const dtos = plainObjects.map((obj) =>
                    plainToInstance(CertificationRequest, obj),
                );

                const validationResults = await Promise.all(
                    dtos.map((dto) => validate(dto)),
                );

                // Assert - All DTOs are valid
                validationResults.forEach((errors) => {
                    expect(errors).toHaveLength(0);
                });

                // Act - Create entities
                const entities =
                    certificationService.createCertificationEntities(dtos);

                // Assert - All entities created
                expect(entities).toHaveLength(3);
                expect(entities[0].cefr).toBe(CEFR.C1);
                expect(entities[1].cefr).toBe(CEFR.B2);
                expect(entities[2].cefr).toBeUndefined();
            });

            it("should fail DTO validation before reaching service for invalid data", async () => {
                // Arrange - Invalid IELTS score
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: "10.0",
                };

                // Act - Validate DTO
                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                // Assert - Validation should fail
                expect(errors.length).toBeGreaterThan(0);
            });

            it("should pass validation for boundary valid scores", async () => {
                const validCases = [
                    { examType: ExamType.IELTS, level: "1.0" },
                    { examType: ExamType.IELTS, level: "9.0" },
                    { examType: ExamType.TOEIC, level: "60" },
                    { examType: ExamType.TOEIC, level: "990" },
                ];

                for (const { examType, level } of validCases) {
                    const dto = plainToInstance(CertificationRequest, {
                        examType,
                        level,
                    });

                    const errors = await validate(dto);
                    expect(errors).toHaveLength(0);

                    const entity =
                        certificationService.createCertificationEntity(dto);
                    expect(entity).toBeDefined();
                }
            });

            it("should fail validation for boundary invalid scores", async () => {
                const invalidCases = [
                    { examType: ExamType.IELTS, level: "0.5" },
                    { examType: ExamType.IELTS, level: "9.5" },
                    { examType: ExamType.TOEIC, level: "55" },
                    { examType: ExamType.TOEIC, level: "995" },
                ];

                for (const { examType, level } of invalidCases) {
                    const dto = plainToInstance(CertificationRequest, {
                        examType,
                        level,
                    });

                    const errors = await validate(dto);
                    expect(errors.length).toBeGreaterThan(0);
                }
            });

            it("should pass validation for valid certification exam types (CCNN + CCQT)", async () => {
                const validCertificationTypes = [
                    // CCNN types (6)
                    { examType: ExamType.IELTS, level: "7.0" },
                    { examType: ExamType.JLPT, level: "N2" },
                    { examType: ExamType.TOEFL_CBT, level: "200" },
                    { examType: ExamType.TOEFL_iBT, level: "95" },
                    { examType: ExamType.TOEFL_Paper, level: "550" },
                    { examType: ExamType.TOEIC, level: "850" },
                    // CCQT types (7)
                    { examType: ExamType.SAT, level: "1400" },
                    { examType: ExamType.ACT, level: "30" },
                    { examType: ExamType.IB, level: "38" },
                    { examType: ExamType.A_Level, level: "A*" },
                    { examType: ExamType.Duolingo_English_Test, level: "120" },
                    { examType: ExamType.OSSD, level: "85" },
                    { examType: ExamType.PTE_Academic, level: "70" },
                ];

                for (const { examType, level } of validCertificationTypes) {
                    const dto = plainToInstance(CertificationRequest, {
                        examType,
                        level,
                    });
                    const errors = await validate(dto);

                    expect(errors).toHaveLength(0);

                    const entity =
                        certificationService.createCertificationEntity(dto);
                    expect(entity).toBeDefined();
                    expect(entity.examType).toBe(examType);
                    expect(entity.level).toBe(level);
                }
            });

            it("should fail validation for invalid certification exam types (DGNL)", async () => {
                const invalidCertificationTypes = [
                    // DGNL types (3) - not allowed for certifications
                    { examType: ExamType.HSA, level: "120" },
                    { examType: ExamType.TSA, level: "80" },
                    { examType: ExamType.VNUHCM, level: "1000" },
                ];

                for (const { examType, level } of invalidCertificationTypes) {
                    const dto = plainToInstance(CertificationRequest, {
                        examType,
                        level,
                    });
                    const errors = await validate(dto);

                    expect(errors.length).toBeGreaterThan(0);

                    const examTypeError = errors.find(
                        (e) => e.property === "examType",
                    );
                    expect(examTypeError).toBeDefined();
                }
            });

            it("should handle whitespace in level after DTO validation", async () => {
                const plainObject = {
                    examType: ExamType.IELTS,
                    level: " 7.5 ",
                };

                const dto = plainToInstance(CertificationRequest, plainObject);
                const errors = await validate(dto);

                expect(errors).toHaveLength(0);

                const entity =
                    certificationService.createCertificationEntity(dto);
                expect(entity.cefr).toBe(CEFR.C1);
            });

            it("should validate large batch with plainToInstance", async () => {
                const largeBatch = Array.from({ length: 100 }, (_, i) => ({
                    examType: i % 2 === 0 ? ExamType.IELTS : ExamType.TOEIC,
                    level: i % 2 === 0 ? "7.0" : "850",
                }));

                for (const plainObject of largeBatch) {
                    const dto = plainToInstance(
                        CertificationRequest,
                        plainObject,
                    );
                    const errors = await validate(dto);
                    expect(errors).toHaveLength(0);
                }

                const dtos = largeBatch.map((obj) =>
                    plainToInstance(CertificationRequest, obj),
                );
                const entities =
                    certificationService.createCertificationEntities(dtos);

                expect(entities).toHaveLength(100);
            });
        });
    });
});
