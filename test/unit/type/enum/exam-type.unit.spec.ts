// test/unit/type/enum/exam-type.unit.spec.ts
import { describe, expect, it } from "vitest";

import {
    CCNNTypes,
    CCQTTypes,
    DGNLTypes,
    ExamType,
    getExamCategory,
    handleExamValidation,
    isCCNNType,
    isCCQTType,
    isDGNLType,
    validateExamTypeScore,
} from "@/type/enum/exam-type.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

describe("ExamType Enum and Utilities", () => {
    describe("ExamType Enum", () => {
        it("should have all expected exam types", () => {
            expect(ExamType.A_Level).toBe("Alevel");
            expect(ExamType.ACT).toBe("ACT");
            expect(ExamType.Duolingo_English_Test).toBe("DoulingoEnglishTest");
            expect(ExamType.HSA).toBe("HSA");
            expect(ExamType.IB).toBe("IB");
            expect(ExamType.IELTS).toBe("IELTS");
            expect(ExamType.JLPT).toBe("JLPT");
            expect(ExamType.OSSD).toBe("OSSD");
            expect(ExamType.PTE_Academic).toBe("PTEAcademic");
            expect(ExamType.SAT).toBe("SAT");
            expect(ExamType.TOEFL_CBT).toBe("TOEFL CBT");
            expect(ExamType.TOEFL_iBT).toBe("TOEFL iBT");
            expect(ExamType.TOEFL_Paper).toBe("TOEFL Paper");
            expect(ExamType.TOEIC).toBe("TOEIC");
            expect(ExamType.TSA).toBe("TSA");
            expect(ExamType.VNUHCM).toBe("VNUHCM");
        });

        it("should have 16 exam types total", () => {
            const examTypes = Object.values(ExamType);
            expect(examTypes).toHaveLength(16);
        });
    });

    describe("Categorization Constants", () => {
        describe("CCNNTypes", () => {
            it("should contain correct CCNN exam types", () => {
                expect(CCNNTypes).toEqual([
                    ExamType.IELTS,
                    ExamType.JLPT,
                    ExamType.TOEFL_CBT,
                    ExamType.TOEFL_iBT,
                    ExamType.TOEFL_Paper,
                    ExamType.TOEIC,
                ]);
            });

            it("should have 6 CCNN exam types", () => {
                expect(CCNNTypes).toHaveLength(6);
            });
        });

        describe("CCQTTypes", () => {
            it("should contain correct CCQT exam types", () => {
                expect(CCQTTypes).toEqual([
                    ExamType.A_Level,
                    ExamType.ACT,
                    ExamType.Duolingo_English_Test,
                    ExamType.IB,
                    ExamType.OSSD,
                    ExamType.PTE_Academic,
                    ExamType.SAT,
                ]);
            });

            it("should have 7 CCQT exam types", () => {
                expect(CCQTTypes).toHaveLength(7);
            });
        });

        describe("DGNLTypes", () => {
            it("should contain correct DGNL exam types", () => {
                expect(DGNLTypes).toEqual([
                    ExamType.HSA,
                    ExamType.TSA,
                    ExamType.VNUHCM,
                ]);
            });

            it("should have 3 DGNL exam types", () => {
                expect(DGNLTypes).toHaveLength(3);
            });
        });

        it("should not have overlapping exam types between categories", () => {
            const ccnnSet = new Set<ExamType>(CCNNTypes);
            const ccqtSet = new Set<ExamType>(CCQTTypes);
            const dgnlSet = new Set<ExamType>(DGNLTypes);

            CCQTTypes.forEach((type) => {
                expect(ccnnSet.has(type)).toBe(false);
                expect(dgnlSet.has(type)).toBe(false);
            });

            DGNLTypes.forEach((type) => {
                expect(ccnnSet.has(type)).toBe(false);
                expect(ccqtSet.has(type)).toBe(false);
            });
        });

        it("should cover all exam types across all categories", () => {
            const allCategorizedTypes = [
                ...CCNNTypes,
                ...CCQTTypes,
                ...DGNLTypes,
            ];
            const allExamTypes = Object.values(ExamType);

            expect(allCategorizedTypes).toHaveLength(allExamTypes.length);
            allExamTypes.forEach((type) => {
                expect(allCategorizedTypes).toContain(type);
            });
        });
    });

    describe("Type Guards", () => {
        describe("isCCNNType", () => {
            it("should return true for CCNN exam types", () => {
                expect(isCCNNType(ExamType.IELTS)).toBe(true);
                expect(isCCNNType(ExamType.JLPT)).toBe(true);
                expect(isCCNNType(ExamType.TOEFL_CBT)).toBe(true);
                expect(isCCNNType(ExamType.TOEFL_iBT)).toBe(true);
                expect(isCCNNType(ExamType.TOEFL_Paper)).toBe(true);
                expect(isCCNNType(ExamType.TOEIC)).toBe(true);
            });

            it("should return false for non-CCNN exam types", () => {
                expect(isCCNNType(ExamType.SAT)).toBe(false);
                expect(isCCNNType(ExamType.ACT)).toBe(false);
                expect(isCCNNType(ExamType.A_Level)).toBe(false);
                expect(isCCNNType(ExamType.HSA)).toBe(false);
                expect(isCCNNType(ExamType.TSA)).toBe(false);
            });
        });

        describe("isCCQTType", () => {
            it("should return true for CCQT exam types", () => {
                expect(isCCQTType(ExamType.A_Level)).toBe(true);
                expect(isCCQTType(ExamType.ACT)).toBe(true);
                expect(isCCQTType(ExamType.Duolingo_English_Test)).toBe(true);
                expect(isCCQTType(ExamType.IB)).toBe(true);
                expect(isCCQTType(ExamType.OSSD)).toBe(true);
                expect(isCCQTType(ExamType.PTE_Academic)).toBe(true);
                expect(isCCQTType(ExamType.SAT)).toBe(true);
            });

            it("should return false for non-CCQT exam types", () => {
                expect(isCCQTType(ExamType.IELTS)).toBe(false);
                expect(isCCQTType(ExamType.TOEFL_iBT)).toBe(false);
                expect(isCCQTType(ExamType.TOEIC)).toBe(false);
                expect(isCCQTType(ExamType.HSA)).toBe(false);
            });
        });

        describe("isDGNLType", () => {
            it("should return true for DGNL exam types", () => {
                expect(isDGNLType(ExamType.HSA)).toBe(true);
                expect(isDGNLType(ExamType.TSA)).toBe(true);
                expect(isDGNLType(ExamType.VNUHCM)).toBe(true);
            });

            it("should return false for non-DGNL exam types", () => {
                expect(isDGNLType(ExamType.IELTS)).toBe(false);
                expect(isDGNLType(ExamType.SAT)).toBe(false);
                expect(isDGNLType(ExamType.ACT)).toBe(false);
                expect(isDGNLType(ExamType.TOEFL_iBT)).toBe(false);
            });
        });
    });

    describe("getExamCategory", () => {
        it("should return CCNN for CCNN exam types", () => {
            expect(getExamCategory(ExamType.IELTS)).toBe("CCNN");
            expect(getExamCategory(ExamType.JLPT)).toBe("CCNN");
            expect(getExamCategory(ExamType.TOEFL_CBT)).toBe("CCNN");
            expect(getExamCategory(ExamType.TOEFL_iBT)).toBe("CCNN");
            expect(getExamCategory(ExamType.TOEFL_Paper)).toBe("CCNN");
            expect(getExamCategory(ExamType.TOEIC)).toBe("CCNN");
        });

        it("should return CCQT for CCQT exam types", () => {
            expect(getExamCategory(ExamType.A_Level)).toBe("CCQT");
            expect(getExamCategory(ExamType.ACT)).toBe("CCQT");
            expect(getExamCategory(ExamType.Duolingo_English_Test)).toBe(
                "CCQT",
            );
            expect(getExamCategory(ExamType.IB)).toBe("CCQT");
            expect(getExamCategory(ExamType.OSSD)).toBe("CCQT");
            expect(getExamCategory(ExamType.PTE_Academic)).toBe("CCQT");
            expect(getExamCategory(ExamType.SAT)).toBe("CCQT");
        });

        it("should return ĐGNL for DGNL exam types", () => {
            expect(getExamCategory(ExamType.HSA)).toBe("ĐGNL");
            expect(getExamCategory(ExamType.TSA)).toBe("ĐGNL");
            expect(getExamCategory(ExamType.VNUHCM)).toBe("ĐGNL");
        });
    });

    describe("validateExamTypeScore", () => {
        describe("A_Level Validation", () => {
            it("should accept valid A_Level grades", () => {
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
                    const errors = validateExamTypeScore(
                        ExamType.A_Level,
                        grade,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should not accept lowercase A_Level grades", () => {
                const errors = validateExamTypeScore(ExamType.A_Level, "a*");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should be case-sensitive for A_Level grades", () => {
                const errors = validateExamTypeScore(ExamType.A_Level, "a");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should reject invalid A_Level grades", () => {
                const errors = validateExamTypeScore(ExamType.A_Level, "Z");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });
        });

        describe("JLPT Validation", () => {
            it("should accept valid JLPT levels", () => {
                const validLevels = ["N1", "N2", "N3", "N4", "N5"];
                validLevels.forEach((level) => {
                    const errors = validateExamTypeScore(ExamType.JLPT, level);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should accept lowercase JLPT levels", () => {
                const errors = validateExamTypeScore(ExamType.JLPT, "n1");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should be case-sensitive for JLPT levels", () => {
                const errors = validateExamTypeScore(ExamType.JLPT, "n2");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should reject invalid JLPT levels", () => {
                const errors = validateExamTypeScore(ExamType.JLPT, "N6");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });
        });

        describe("IELTS Validation", () => {
            it("should accept valid IELTS scores", () => {
                const validScores = ["1.0", "4.5", "6.0", "7.5", "8.0", "9.0"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.IELTS, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject IELTS scores outside range", () => {
                const errors1 = validateExamTypeScore(ExamType.IELTS, "0.5");
                expect(errors1.level).toContain("must be between 1 and 9");

                const errors2 = validateExamTypeScore(ExamType.IELTS, "9.5");
                expect(errors2.level).toContain("must be between 1 and 9");
            });

            it("should reject IELTS scores not in 0.5 increments", () => {
                const errors = validateExamTypeScore(ExamType.IELTS, "7.3");
                expect(errors.level).toContain("0.5 increments");
            });

            it("should reject non-numeric IELTS scores", () => {
                const errors = validateExamTypeScore(ExamType.IELTS, "invalid");
                expect(errors.level).toContain("must be a valid number");
            });
        });

        describe("TOEFL CBT Validation", () => {
            it("should accept valid TOEFL CBT scores", () => {
                const validScores = ["33", "150", "250", "300"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.TOEFL_CBT,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL CBT scores outside range", () => {
                const errors1 = validateExamTypeScore(ExamType.TOEFL_CBT, "32");
                expect(errors1.level).toContain("must be between 33 and 300");

                const errors2 = validateExamTypeScore(
                    ExamType.TOEFL_CBT,
                    "301",
                );
                expect(errors2.level).toContain("must be between 33 and 300");
            });

            it("should reject decimal TOEFL CBT scores", () => {
                const errors = validateExamTypeScore(
                    ExamType.TOEFL_CBT,
                    "200.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TOEFL iBT Validation", () => {
            it("should accept valid TOEFL iBT scores", () => {
                const validScores = ["0", "50", "90", "120"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.TOEFL_iBT,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL iBT scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.TOEFL_iBT, "121");
                expect(errors.level).toContain("must be between 0 and 120");
            });

            it("should reject decimal TOEFL iBT scores", () => {
                const errors = validateExamTypeScore(
                    ExamType.TOEFL_iBT,
                    "95.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TOEFL Paper Validation", () => {
            it("should accept valid TOEFL Paper scores", () => {
                const validScores = ["310", "450", "550", "677"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.TOEFL_Paper,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL Paper scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    ExamType.TOEFL_Paper,
                    "309",
                );
                expect(errors1.level).toContain("must be between 310 and 677");

                const errors2 = validateExamTypeScore(
                    ExamType.TOEFL_Paper,
                    "678",
                );
                expect(errors2.level).toContain("must be between 310 and 677");
            });

            it("should reject decimal TOEFL Paper scores", () => {
                const errors = validateExamTypeScore(
                    ExamType.TOEFL_Paper,
                    "550.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TOEIC Validation", () => {
            it("should accept valid TOEIC scores", () => {
                const validScores = ["60", "500", "850", "990"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.TOEIC, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEIC scores outside range", () => {
                const errors1 = validateExamTypeScore(ExamType.TOEIC, "55");
                expect(errors1.level).toContain("must be between 60 and 990");

                const errors2 = validateExamTypeScore(ExamType.TOEIC, "995");
                expect(errors2.level).toContain("must be between 60 and 990");
            });

            it("should reject TOEIC scores not in multiples of 5", () => {
                const errors = validateExamTypeScore(ExamType.TOEIC, "851");
                expect(errors.level).toContain("must be a multiple of 5");
            });
        });

        describe("ACT Validation", () => {
            it("should accept valid ACT scores", () => {
                const validScores = ["1", "20", "30", "36"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.ACT, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject ACT scores outside range", () => {
                const errors1 = validateExamTypeScore(ExamType.ACT, "0");
                expect(errors1.level).toContain("must be between 1 and 36");

                const errors2 = validateExamTypeScore(ExamType.ACT, "37");
                expect(errors2.level).toContain("must be between 1 and 36");
            });

            it("should reject decimal ACT scores", () => {
                const errors = validateExamTypeScore(ExamType.ACT, "30.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("Duolingo English Test Validation", () => {
            it("should accept valid Duolingo scores", () => {
                const validScores = ["10", "80", "120", "160"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.Duolingo_English_Test,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject Duolingo scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    ExamType.Duolingo_English_Test,
                    "5",
                );
                expect(errors1.level).toContain("must be between 10 and 160");

                const errors2 = validateExamTypeScore(
                    ExamType.Duolingo_English_Test,
                    "165",
                );
                expect(errors2.level).toContain("must be between 10 and 160");
            });

            it("should reject Duolingo scores not in multiples of 5", () => {
                const errors = validateExamTypeScore(
                    ExamType.Duolingo_English_Test,
                    "123",
                );
                expect(errors.level).toContain("must be a multiple of 5");
            });
        });

        describe("IB Validation", () => {
            it("should accept valid IB scores", () => {
                const validScores = ["0", "20", "38", "45"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.IB, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject IB scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.IB, "46");
                expect(errors.level).toContain("must be between 0 and 45");
            });

            it("should reject decimal IB scores", () => {
                const errors = validateExamTypeScore(ExamType.IB, "40.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("OSSD Validation", () => {
            it("should accept valid OSSD scores", () => {
                const validScores = ["0", "50", "85", "100"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.OSSD, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject OSSD scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.OSSD, "101");
                expect(errors.level).toContain("must be between 0 and 100");
            });

            it("should reject decimal OSSD scores", () => {
                const errors = validateExamTypeScore(ExamType.OSSD, "85.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("PTE Academic Validation", () => {
            it("should accept valid PTE Academic scores", () => {
                const validScores = ["10", "50", "70", "90"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.PTE_Academic,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject PTE Academic scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    ExamType.PTE_Academic,
                    "9",
                );
                expect(errors1.level).toContain("must be between 10 and 90");

                const errors2 = validateExamTypeScore(
                    ExamType.PTE_Academic,
                    "91",
                );
                expect(errors2.level).toContain("must be between 10 and 90");
            });

            it("should reject decimal PTE Academic scores", () => {
                const errors = validateExamTypeScore(
                    ExamType.PTE_Academic,
                    "70.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("SAT Validation", () => {
            it("should accept valid SAT scores", () => {
                const validScores = ["400", "1000", "1400", "1600"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.SAT, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject SAT scores outside range", () => {
                const errors1 = validateExamTypeScore(ExamType.SAT, "390");
                expect(errors1.level).toContain("must be between 400 and 1600");

                const errors2 = validateExamTypeScore(ExamType.SAT, "1610");
                expect(errors2.level).toContain("must be between 400 and 1600");
            });

            it("should reject SAT scores not in multiples of 10", () => {
                const errors = validateExamTypeScore(ExamType.SAT, "1405");
                expect(errors.level).toContain("must be a multiple of 10");
            });
        });

        describe("HSA Validation", () => {
            it("should accept valid HSA scores", () => {
                const validScores = ["0", "75", "120", "150"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.HSA, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject HSA scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.HSA, "151");
                expect(errors.level).toContain("must be between 0 and 150");
            });

            it("should reject decimal HSA scores", () => {
                const errors = validateExamTypeScore(ExamType.HSA, "120.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TSA Validation", () => {
            it("should accept valid TSA scores", () => {
                const validScores = ["0", "50", "85", "100"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(ExamType.TSA, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TSA scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.TSA, "101");
                expect(errors.level).toContain("must be between 0 and 100");
            });

            it("should reject decimal TSA scores", () => {
                const errors = validateExamTypeScore(ExamType.TSA, "85.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("VNUHCM Validation", () => {
            it("should accept valid VNUHCM scores", () => {
                const validScores = ["0", "600", "1000", "1200"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        ExamType.VNUHCM,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject VNUHCM scores outside range", () => {
                const errors = validateExamTypeScore(ExamType.VNUHCM, "1201");
                expect(errors.level).toContain("must be between 0 and 1200");
            });

            it("should reject decimal VNUHCM scores", () => {
                const errors = validateExamTypeScore(ExamType.VNUHCM, "1000.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });
    });

    describe("handleExamValidation", () => {
        it("should not throw for valid exam scores", () => {
            expect(() => {
                handleExamValidation(ExamType.IELTS, "7.5");
            }).not.toThrow();
            expect(() => {
                handleExamValidation(ExamType.SAT, "1400");
            }).not.toThrow();
            expect(() => {
                handleExamValidation(ExamType.A_Level, "A*");
            }).not.toThrow();
        });

        it("should throw ValidationException for invalid exam scores", () => {
            expect(() => {
                handleExamValidation(ExamType.IELTS, "10.0");
            }).toThrow(ValidationException);
            expect(() => {
                handleExamValidation(ExamType.SAT, "2000");
            }).toThrow(ValidationException);
            expect(() => {
                handleExamValidation(ExamType.A_Level, "Z");
            }).toThrow(ValidationException);
        });

        it("should include prefix in error messages when provided", () => {
            try {
                handleExamValidation(ExamType.IELTS, "10.0", "certification");
                expect.fail("Should have thrown ValidationException");
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                if (error instanceof ValidationException) {
                    expect(error.validationErrors).toHaveProperty(
                        "certification.level",
                    );
                }
            }
        });

        it("should not include prefix when not provided", () => {
            try {
                handleExamValidation(ExamType.IELTS, "10.0");
                expect.fail("Should have thrown ValidationException");
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                if (error instanceof ValidationException) {
                    expect(error.validationErrors).toHaveProperty("level");
                    expect(error.validationErrors).not.toHaveProperty(
                        "certification.level",
                    );
                }
            }
        });

        it("should handle multiple validation errors with prefix", () => {
            try {
                handleExamValidation(
                    ExamType.IELTS,
                    "invalid",
                    "certifications[0]",
                );
                expect.fail("Should have thrown ValidationException");
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                if (error instanceof ValidationException) {
                    expect(error.validationErrors).toHaveProperty(
                        "certifications[0].level",
                    );
                }
            }
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle empty string scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "");
            expect(errors.level).toContain("must be a valid number");
        });

        it("should handle whitespace-only scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "   ");
            expect(errors.level).toContain("must be a valid number");
        });

        it("should handle negative scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "-5");
            expect(errors.level).toContain("must be between 1 and 9");
        });

        it("should handle very large scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "999999");
            expect(errors.level).toContain("must be between 1 and 9");
        });

        it("should handle special characters in scores", () => {
            // parseFloat("7.5%") returns 7.5, which is valid for IELTS
            const errors = validateExamTypeScore(ExamType.IELTS, "7.5%");
            expect(errors.level).toBeUndefined();
        });

        it("should handle scores with multiple decimal points", () => {
            // parseFloat("7.5.0") returns 7.5, which is valid for IELTS
            const errors = validateExamTypeScore(ExamType.IELTS, "7.5.0");
            expect(errors.level).toBeUndefined();
        });

        it("should reject truly invalid non-numeric strings", () => {
            const errors1 = validateExamTypeScore(ExamType.IELTS, "abc");
            expect(errors1.level).toBeDefined();
            expect(errors1.level).toContain("must be a valid number");

            const errors2 = validateExamTypeScore(
                ExamType.IELTS,
                "not a number",
            );
            expect(errors2.level).toBeDefined();
            expect(errors2.level).toContain("must be a valid number");
        });

        it("should handle scientific notation", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "1e2");
            expect(errors.level).toBeDefined();
        });

        it("should trim and validate A_Level grades correctly", () => {
            const errors = validateExamTypeScore(ExamType.A_Level, " A* ");
            expect(errors.level).toBeUndefined();
        });

        it("should trim whitespace from numeric scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "  7.5  ");
            expect(errors.level).toBeUndefined();
        });

        it("should trim whitespace from JLPT levels", () => {
            const errors = validateExamTypeScore(ExamType.JLPT, " N1 ");
            expect(errors.level).toBeUndefined();
        });

        it("should handle case sensitivity for JLPT", () => {
            const errorsUpper = validateExamTypeScore(ExamType.JLPT, "N1");
            const errorsLower = validateExamTypeScore(ExamType.JLPT, "n1");

            expect(errorsUpper.level).toBeUndefined();
            expect(errorsLower.level).toBeDefined();
            expect(errorsLower.level).toContain("must be one of");
        });

        it("should validate boundary values for all numeric exam types", () => {
            // Test minimum valid scores
            expect(
                validateExamTypeScore(ExamType.IELTS, "1.0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_CBT, "33").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_iBT, "0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_Paper, "310").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEIC, "60").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.ACT, "1").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.SAT, "400").level,
            ).toBeUndefined();

            // Test maximum valid scores
            expect(
                validateExamTypeScore(ExamType.IELTS, "9.0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_CBT, "300").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_iBT, "120").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_Paper, "677").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.TOEIC, "990").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.ACT, "36").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(ExamType.SAT, "1600").level,
            ).toBeUndefined();
        });

        it("should validate just below minimum boundary", () => {
            expect(
                validateExamTypeScore(ExamType.IELTS, "0.5").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_CBT, "32").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_Paper, "309").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEIC, "55").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.ACT, "0").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.SAT, "390").level,
            ).toBeDefined();
        });

        it("should validate just above maximum boundary", () => {
            expect(
                validateExamTypeScore(ExamType.IELTS, "9.5").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_CBT, "301").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_iBT, "121").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEFL_Paper, "678").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.TOEIC, "995").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.ACT, "37").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(ExamType.SAT, "1610").level,
            ).toBeDefined();
        });
    });

    describe("Integration Tests", () => {
        it("should validate all exam types have non-overlapping categories", () => {
            const allExamTypes = Object.values(ExamType);

            allExamTypes.forEach((examType) => {
                const isCCNN = isCCNNType(examType);
                const isCCQT = isCCQTType(examType);
                const isDGNL = isDGNLType(examType);

                // Each exam should belong to exactly one category
                const categoryCount = [isCCNN, isCCQT, isDGNL].filter(
                    Boolean,
                ).length;
                expect(categoryCount).toBe(1);
            });
        });

        it("should validate category getter matches type guards", () => {
            const allExamTypes = Object.values(ExamType);

            allExamTypes.forEach((examType) => {
                const category = getExamCategory(examType);

                if (isCCNNType(examType)) {
                    expect(category).toBe("CCNN");
                } else if (isCCQTType(examType)) {
                    expect(category).toBe("CCQT");
                } else if (isDGNLType(examType)) {
                    expect(category).toBe("ĐGNL");
                } else {
                    expect(category).toBeUndefined();
                }
            });
        });

        it("should validate all exam types have validation rules", () => {
            const allExamTypes = Object.values(ExamType);
            const testScores: Record<string, string> = {
                [ExamType.A_Level]: "A*",
                [ExamType.ACT]: "30",
                [ExamType.Duolingo_English_Test]: "120",
                [ExamType.HSA]: "120",
                [ExamType.IB]: "38",
                [ExamType.IELTS]: "7.5",
                [ExamType.JLPT]: "N1",
                [ExamType.OSSD]: "85",
                [ExamType.PTE_Academic]: "70",
                [ExamType.SAT]: "1400",
                [ExamType.TOEFL_CBT]: "200",
                [ExamType.TOEFL_iBT]: "100",
                [ExamType.TOEFL_Paper]: "550",
                [ExamType.TOEIC]: "850",
                [ExamType.TSA]: "85",
                [ExamType.VNUHCM]: "1000",
            };

            allExamTypes.forEach((examType) => {
                const testScore = testScores[examType];
                expect(testScore).toBeDefined();

                const errors = validateExamTypeScore(examType, testScore);
                expect(errors.level).toBeUndefined();
            });
        });

        it("should handle validation for all exam types with invalid scores", () => {
            const allExamTypes = Object.values(ExamType);
            const invalidScores: Record<string, string> = {
                [ExamType.A_Level]: "Z",
                [ExamType.ACT]: "50",
                [ExamType.Duolingo_English_Test]: "200",
                [ExamType.HSA]: "200",
                [ExamType.IB]: "50",
                [ExamType.IELTS]: "10.0",
                [ExamType.JLPT]: "N6",
                [ExamType.OSSD]: "150",
                [ExamType.PTE_Academic]: "100",
                [ExamType.SAT]: "2000",
                [ExamType.TOEFL_CBT]: "400",
                [ExamType.TOEFL_iBT]: "150",
                [ExamType.TOEFL_Paper]: "800",
                [ExamType.TOEIC]: "1000",
                [ExamType.TSA]: "150",
                [ExamType.VNUHCM]: "1500",
            };

            allExamTypes.forEach((examType) => {
                const invalidScore = invalidScores[examType];
                expect(invalidScore).toBeDefined();

                const errors = validateExamTypeScore(examType, invalidScore);
                expect(errors.level).toBeDefined();
            });
        });
    });

    describe("Performance and Stress Tests", () => {
        it("should validate large batch of scores efficiently", () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                validateExamTypeScore(ExamType.IELTS, "7.5");
                validateExamTypeScore(ExamType.SAT, "1400");
                validateExamTypeScore(ExamType.TOEFL_iBT, "100");
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete 3000 validations in reasonable time (< 1 second)
            expect(duration).toBeLessThan(1000);
        });

        it("should handle rapid type guard calls", () => {
            const iterations = 10000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                isCCNNType(ExamType.IELTS);
                isCCQTType(ExamType.SAT);
                isDGNLType(ExamType.HSA);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete 30000 type checks very quickly (< 100ms)
            expect(duration).toBeLessThan(100);
        });
    });

    describe("Comprehensive Validation Coverage", () => {
        it("should have consistent error message format", () => {
            const invalidTests = [
                {
                    examType: ExamType.IELTS,
                    expectedKeyword: "between",
                    level: "10",
                },
                {
                    examType: ExamType.SAT,
                    expectedKeyword: "between",
                    level: "2000",
                },
                {
                    examType: ExamType.A_Level,
                    expectedKeyword: "must be one of",
                    level: "Z",
                },
                {
                    examType: ExamType.TOEIC,
                    expectedKeyword: "multiple of",
                    level: "851",
                },
            ];

            invalidTests.forEach(({ examType, expectedKeyword, level }) => {
                const errors = validateExamTypeScore(examType, level);
                expect(errors.level).toBeDefined();
                expect(errors.level?.toLowerCase()).toContain(
                    expectedKeyword.toLowerCase(),
                );
            });
        });

        it("should validate only level field in error object", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "10");
            const errorKeys = Object.keys(errors);

            expect(errorKeys).toHaveLength(1);
            expect(errorKeys[0]).toBe("level");
        });

        it("should return empty errors object for valid scores", () => {
            const errors = validateExamTypeScore(ExamType.IELTS, "7.5");
            const definedErrors = Object.values(errors).filter(
                (val) => val !== undefined,
            );

            expect(definedErrors).toHaveLength(0);
        });
    });
});
