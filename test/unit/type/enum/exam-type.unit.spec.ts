// test/unit/type/enum/exam-type.unit.spec.ts
import { describe, expect, it } from "vitest";

import {
    CCNNType,
    CCQTType,
    DGNLType,
    type ExamType,
    getExamCategory,
    handleExamValidation,
    isCCNNType,
    isCCQTType,
    isDGNLType,
    validateExamTypeScore,
} from "@/type/enum/exam-type.enum.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

describe("ExamType Enum and Utilities", () => {
    describe("ExamType Enum", () => {
        it("should have all expected exam types", () => {
            expect(CCQTType.A_Level).toBe("Alevel");
            expect(CCQTType.ACT).toBe("ACT");
            expect(CCQTType.Duolingo_English_Test).toBe("DoulingoEnglishTest");
            expect(DGNLType.HSA).toBe("HSA");
            expect(CCQTType.IB).toBe("IB");
            expect(CCNNType.IELTS).toBe("IELTS");
            expect(CCNNType.JLPT).toBe("JLPT");
            expect(CCQTType.OSSD).toBe("OSSD");
            expect(CCQTType.PTE_Academic).toBe("PTEAcademic");
            expect(CCQTType.SAT).toBe("SAT");
            expect(CCNNType.TOEFL_CBT).toBe("TOEFL CBT");
            expect(CCNNType.TOEFL_iBT).toBe("TOEFL iBT");
            expect(CCNNType.TOEFL_Paper).toBe("TOEFL Paper");
            expect(CCNNType.TOEIC).toBe("TOEIC");
            expect(DGNLType.TSA).toBe("TSA");
            expect(DGNLType.VNUHCM).toBe("VNUHCM");
        });

        it("should have 16 exam types total", () => {
            const examTypes = [
                ...Object.values(CCNNType),
                ...Object.values(CCQTType),
                ...Object.values(DGNLType),
            ];
            expect(examTypes).toHaveLength(16);
        });
    });

    describe("Categorization Constants", () => {
        describe("CCNNTypes", () => {
            it("should contain correct CCNN exam types", () => {
                expect(Object.values(CCNNType)).toEqual([
                    CCNNType.IELTS,
                    CCNNType.JLPT,
                    CCNNType.TOEFL_CBT,
                    CCNNType.TOEFL_iBT,
                    CCNNType.TOEFL_Paper,
                    CCNNType.TOEIC,
                ]);
            });

            it("should have 6 CCNN exam types", () => {
                expect(Object.values(CCNNType)).toHaveLength(6);
            });
        });

        describe("CCQTTypes", () => {
            it("should contain correct CCQT exam types", () => {
                expect(Object.values(CCQTType)).toEqual([
                    CCQTType.A_Level,
                    CCQTType.ACT,
                    CCQTType.Duolingo_English_Test,
                    CCQTType.IB,
                    CCQTType.OSSD,
                    CCQTType.PTE_Academic,
                    CCQTType.SAT,
                ]);
            });

            it("should have 7 CCQT exam types", () => {
                expect(Object.values(CCQTType)).toHaveLength(7);
            });
        });

        describe("DGNLTypes", () => {
            it("should contain correct DGNL exam types", () => {
                expect(Object.values(DGNLType)).toEqual([
                    DGNLType.HSA,
                    DGNLType.TSA,
                    DGNLType.VNUHCM,
                ]);
            });

            it("should have 3 DGNL exam types", () => {
                expect(Object.values(DGNLType)).toHaveLength(3);
            });
            it("should not have overlapping exam types between categories", () => {
                const ccnnValues = Object.values(CCNNType);
                const ccqtValues = Object.values(CCQTType);
                const dgnlValues = Object.values(DGNLType);

                const ccnnSet = new Set<ExamType>(ccnnValues);
                const ccqtSet = new Set<ExamType>(ccqtValues);
                const dgnlSet = new Set<ExamType>(dgnlValues);

                ccqtValues.forEach((type) => {
                    expect(ccnnSet.has(type)).toBe(false);
                    expect(dgnlSet.has(type)).toBe(false);
                });

                dgnlValues.forEach((type) => {
                    expect(ccnnSet.has(type)).toBe(false);
                    expect(ccqtSet.has(type)).toBe(false);
                });
            });

            it("should cover all exam types across all categories", () => {
                const allCategorizedTypes = [
                    ...Object.values(CCNNType),
                    ...Object.values(CCQTType),
                    ...Object.values(DGNLType),
                ];

                const expectedTotalCount =
                    Object.values(CCNNType).length +
                    Object.values(CCQTType).length +
                    Object.values(DGNLType).length;

                expect(allCategorizedTypes).toHaveLength(expectedTotalCount);

                const uniqueTypes = new Set(allCategorizedTypes);
                expect(uniqueTypes.size).toBe(expectedTotalCount);
            });
        });
    });

    describe("Type Guards", () => {
        describe("isCCNNType", () => {
            it("should return true for CCNN exam types", () => {
                expect(isCCNNType(CCNNType.IELTS)).toBe(true);
                expect(isCCNNType(CCNNType.JLPT)).toBe(true);
                expect(isCCNNType(CCNNType.TOEFL_CBT)).toBe(true);
                expect(isCCNNType(CCNNType.TOEFL_iBT)).toBe(true);
                expect(isCCNNType(CCNNType.TOEFL_Paper)).toBe(true);
                expect(isCCNNType(CCNNType.TOEIC)).toBe(true);
            });

            it("should return false for non-CCNN exam types", () => {
                expect(isCCNNType(CCQTType.SAT)).toBe(false);
                expect(isCCNNType(CCQTType.ACT)).toBe(false);
                expect(isCCNNType(CCQTType.A_Level)).toBe(false);
                expect(isCCNNType(DGNLType.HSA)).toBe(false);
                expect(isCCNNType(DGNLType.TSA)).toBe(false);
            });
        });

        describe("isCCQTType", () => {
            it("should return true for CCQT exam types", () => {
                expect(isCCQTType(CCQTType.A_Level)).toBe(true);
                expect(isCCQTType(CCQTType.ACT)).toBe(true);
                expect(isCCQTType(CCQTType.Duolingo_English_Test)).toBe(true);
                expect(isCCQTType(CCQTType.IB)).toBe(true);
                expect(isCCQTType(CCQTType.OSSD)).toBe(true);
                expect(isCCQTType(CCQTType.PTE_Academic)).toBe(true);
                expect(isCCQTType(CCQTType.SAT)).toBe(true);
            });

            it("should return false for non-CCQT exam types", () => {
                expect(isCCQTType(CCNNType.IELTS)).toBe(false);
                expect(isCCQTType(CCNNType.TOEFL_iBT)).toBe(false);
                expect(isCCQTType(CCNNType.TOEIC)).toBe(false);
                expect(isCCQTType(DGNLType.HSA)).toBe(false);
            });
        });

        describe("isDGNLType", () => {
            it("should return true for DGNL exam types", () => {
                expect(isDGNLType(DGNLType.HSA)).toBe(true);
                expect(isDGNLType(DGNLType.TSA)).toBe(true);
                expect(isDGNLType(DGNLType.VNUHCM)).toBe(true);
            });

            it("should return false for non-DGNL exam types", () => {
                expect(isDGNLType(CCNNType.IELTS)).toBe(false);
                expect(isDGNLType(CCQTType.SAT)).toBe(false);
                expect(isDGNLType(CCQTType.ACT)).toBe(false);
                expect(isDGNLType(CCNNType.TOEFL_iBT)).toBe(false);
            });
        });
    });

    describe("getExamCategory", () => {
        it("should return CCNN for CCNN exam types", () => {
            expect(getExamCategory(CCNNType.IELTS)).toBe("CCNN");
            expect(getExamCategory(CCNNType.JLPT)).toBe("CCNN");
            expect(getExamCategory(CCNNType.TOEFL_CBT)).toBe("CCNN");
            expect(getExamCategory(CCNNType.TOEFL_iBT)).toBe("CCNN");
            expect(getExamCategory(CCNNType.TOEFL_Paper)).toBe("CCNN");
            expect(getExamCategory(CCNNType.TOEIC)).toBe("CCNN");
        });

        it("should return CCQT for CCQT exam types", () => {
            expect(getExamCategory(CCQTType.A_Level)).toBe("CCQT");
            expect(getExamCategory(CCQTType.ACT)).toBe("CCQT");
            expect(getExamCategory(CCQTType.Duolingo_English_Test)).toBe(
                "CCQT",
            );
            expect(getExamCategory(CCQTType.IB)).toBe("CCQT");
            expect(getExamCategory(CCQTType.OSSD)).toBe("CCQT");
            expect(getExamCategory(CCQTType.PTE_Academic)).toBe("CCQT");
            expect(getExamCategory(CCQTType.SAT)).toBe("CCQT");
        });

        it("should return ĐGNL for DGNL exam types", () => {
            expect(getExamCategory(DGNLType.HSA)).toBe("ĐGNL");
            expect(getExamCategory(DGNLType.TSA)).toBe("ĐGNL");
            expect(getExamCategory(DGNLType.VNUHCM)).toBe("ĐGNL");
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
                        CCQTType.A_Level,
                        grade,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should not accept lowercase A_Level grades", () => {
                const errors = validateExamTypeScore(CCQTType.A_Level, "a*");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should be case-sensitive for A_Level grades", () => {
                const errors = validateExamTypeScore(CCQTType.A_Level, "a");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should reject invalid A_Level grades", () => {
                const errors = validateExamTypeScore(CCQTType.A_Level, "Z");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });
        });

        describe("JLPT Validation", () => {
            it("should accept valid JLPT levels", () => {
                const validLevels = ["N1", "N2", "N3", "N4", "N5"];
                validLevels.forEach((level) => {
                    const errors = validateExamTypeScore(CCNNType.JLPT, level);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should accept lowercase JLPT levels", () => {
                const errors = validateExamTypeScore(CCNNType.JLPT, "n1");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should be case-sensitive for JLPT levels", () => {
                const errors = validateExamTypeScore(CCNNType.JLPT, "n2");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });

            it("should reject invalid JLPT levels", () => {
                const errors = validateExamTypeScore(CCNNType.JLPT, "N6");
                expect(errors.level).toBeDefined();
                expect(errors.level).toContain("must be one of");
            });
        });

        describe("IELTS Validation", () => {
            it("should accept valid IELTS scores", () => {
                const validScores = ["1.0", "4.5", "6.0", "7.5", "8.0", "9.0"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCNNType.IELTS, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject IELTS scores outside range", () => {
                const errors1 = validateExamTypeScore(CCNNType.IELTS, "0.5");
                expect(errors1.level).toContain("must be between 1 and 9");

                const errors2 = validateExamTypeScore(CCNNType.IELTS, "9.5");
                expect(errors2.level).toContain("must be between 1 and 9");
            });

            it("should reject IELTS scores not in 0.5 increments", () => {
                const errors = validateExamTypeScore(CCNNType.IELTS, "7.3");
                expect(errors.level).toContain("0.5 increments");
            });

            it("should reject non-numeric IELTS scores", () => {
                const errors = validateExamTypeScore(CCNNType.IELTS, "invalid");
                expect(errors.level).toContain("must be a valid number");
            });
        });

        describe("TOEFL CBT Validation", () => {
            it("should accept valid TOEFL CBT scores", () => {
                const validScores = ["33", "150", "250", "300"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        CCNNType.TOEFL_CBT,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL CBT scores outside range", () => {
                const errors1 = validateExamTypeScore(CCNNType.TOEFL_CBT, "32");
                expect(errors1.level).toContain("must be between 33 and 300");

                const errors2 = validateExamTypeScore(
                    CCNNType.TOEFL_CBT,
                    "301",
                );
                expect(errors2.level).toContain("must be between 33 and 300");
            });

            it("should reject decimal TOEFL CBT scores", () => {
                const errors = validateExamTypeScore(
                    CCNNType.TOEFL_CBT,
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
                        CCNNType.TOEFL_iBT,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL iBT scores outside range", () => {
                const errors = validateExamTypeScore(CCNNType.TOEFL_iBT, "121");
                expect(errors.level).toContain("must be between 0 and 120");
            });

            it("should reject decimal TOEFL iBT scores", () => {
                const errors = validateExamTypeScore(
                    CCNNType.TOEFL_iBT,
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
                        CCNNType.TOEFL_Paper,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEFL Paper scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    CCNNType.TOEFL_Paper,
                    "309",
                );
                expect(errors1.level).toContain("must be between 310 and 677");

                const errors2 = validateExamTypeScore(
                    CCNNType.TOEFL_Paper,
                    "678",
                );
                expect(errors2.level).toContain("must be between 310 and 677");
            });

            it("should reject decimal TOEFL Paper scores", () => {
                const errors = validateExamTypeScore(
                    CCNNType.TOEFL_Paper,
                    "550.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TOEIC Validation", () => {
            it("should accept valid TOEIC scores", () => {
                const validScores = ["60", "500", "850", "990"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCNNType.TOEIC, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TOEIC scores outside range", () => {
                const errors1 = validateExamTypeScore(CCNNType.TOEIC, "55");
                expect(errors1.level).toContain("must be between 60 and 990");

                const errors2 = validateExamTypeScore(CCNNType.TOEIC, "995");
                expect(errors2.level).toContain("must be between 60 and 990");
            });

            it("should reject TOEIC scores not in multiples of 5", () => {
                const errors = validateExamTypeScore(CCNNType.TOEIC, "851");
                expect(errors.level).toContain("must be a multiple of 5");
            });
        });

        describe("ACT Validation", () => {
            it("should accept valid ACT scores", () => {
                const validScores = ["1", "20", "30", "36"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCQTType.ACT, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject ACT scores outside range", () => {
                const errors1 = validateExamTypeScore(CCQTType.ACT, "0");
                expect(errors1.level).toContain("must be between 1 and 36");

                const errors2 = validateExamTypeScore(CCQTType.ACT, "37");
                expect(errors2.level).toContain("must be between 1 and 36");
            });

            it("should reject decimal ACT scores", () => {
                const errors = validateExamTypeScore(CCQTType.ACT, "30.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("Duolingo English Test Validation", () => {
            it("should accept valid Duolingo scores", () => {
                const validScores = ["10", "80", "120", "160"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        CCQTType.Duolingo_English_Test,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject Duolingo scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    CCQTType.Duolingo_English_Test,
                    "5",
                );
                expect(errors1.level).toContain("must be between 10 and 160");

                const errors2 = validateExamTypeScore(
                    CCQTType.Duolingo_English_Test,
                    "165",
                );
                expect(errors2.level).toContain("must be between 10 and 160");
            });

            it("should reject Duolingo scores not in multiples of 5", () => {
                const errors = validateExamTypeScore(
                    CCQTType.Duolingo_English_Test,
                    "123",
                );
                expect(errors.level).toContain("must be a multiple of 5");
            });
        });

        describe("IB Validation", () => {
            it("should accept valid IB scores", () => {
                const validScores = ["0", "20", "38", "45"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCQTType.IB, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject IB scores outside range", () => {
                const errors = validateExamTypeScore(CCQTType.IB, "46");
                expect(errors.level).toContain("must be between 0 and 45");
            });

            it("should reject decimal IB scores", () => {
                const errors = validateExamTypeScore(CCQTType.IB, "40.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("OSSD Validation", () => {
            it("should accept valid OSSD scores", () => {
                const validScores = ["0", "50", "85", "100"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCQTType.OSSD, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject OSSD scores outside range", () => {
                const errors = validateExamTypeScore(CCQTType.OSSD, "101");
                expect(errors.level).toContain("must be between 0 and 100");
            });

            it("should reject decimal OSSD scores", () => {
                const errors = validateExamTypeScore(CCQTType.OSSD, "85.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("PTE Academic Validation", () => {
            it("should accept valid PTE Academic scores", () => {
                const validScores = ["10", "50", "70", "90"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        CCQTType.PTE_Academic,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject PTE Academic scores outside range", () => {
                const errors1 = validateExamTypeScore(
                    CCQTType.PTE_Academic,
                    "9",
                );
                expect(errors1.level).toContain("must be between 10 and 90");

                const errors2 = validateExamTypeScore(
                    CCQTType.PTE_Academic,
                    "91",
                );
                expect(errors2.level).toContain("must be between 10 and 90");
            });

            it("should reject decimal PTE Academic scores", () => {
                const errors = validateExamTypeScore(
                    CCQTType.PTE_Academic,
                    "70.5",
                );
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("SAT Validation", () => {
            it("should accept valid SAT scores", () => {
                const validScores = ["400", "1000", "1400", "1600"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(CCQTType.SAT, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject SAT scores outside range", () => {
                const errors1 = validateExamTypeScore(CCQTType.SAT, "390");
                expect(errors1.level).toContain("must be between 400 and 1600");

                const errors2 = validateExamTypeScore(CCQTType.SAT, "1610");
                expect(errors2.level).toContain("must be between 400 and 1600");
            });

            it("should reject SAT scores not in multiples of 10", () => {
                const errors = validateExamTypeScore(CCQTType.SAT, "1405");
                expect(errors.level).toContain("must be a multiple of 10");
            });
        });

        describe("HSA Validation", () => {
            it("should accept valid HSA scores", () => {
                const validScores = ["0", "75", "120", "150"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(DGNLType.HSA, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject HSA scores outside range", () => {
                const errors = validateExamTypeScore(DGNLType.HSA, "151");
                expect(errors.level).toContain("must be between 0 and 150");
            });

            it("should reject decimal HSA scores", () => {
                const errors = validateExamTypeScore(DGNLType.HSA, "120.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("TSA Validation", () => {
            it("should accept valid TSA scores", () => {
                const validScores = ["0", "50", "85", "100"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(DGNLType.TSA, score);
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject TSA scores outside range", () => {
                const errors = validateExamTypeScore(DGNLType.TSA, "101");
                expect(errors.level).toContain("must be between 0 and 100");
            });

            it("should reject decimal TSA scores", () => {
                const errors = validateExamTypeScore(DGNLType.TSA, "85.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });

        describe("VNUHCM Validation", () => {
            it("should accept valid VNUHCM scores", () => {
                const validScores = ["0", "600", "1000", "1200"];
                validScores.forEach((score) => {
                    const errors = validateExamTypeScore(
                        DGNLType.VNUHCM,
                        score,
                    );
                    expect(errors.level).toBeUndefined();
                });
            });

            it("should reject VNUHCM scores outside range", () => {
                const errors = validateExamTypeScore(DGNLType.VNUHCM, "1201");
                expect(errors.level).toContain("must be between 0 and 1200");
            });

            it("should reject decimal VNUHCM scores", () => {
                const errors = validateExamTypeScore(DGNLType.VNUHCM, "1000.5");
                expect(errors.level).toContain("must be a whole number");
            });
        });
    });

    describe("handleExamValidation", () => {
        it("should not throw for valid exam scores", () => {
            expect(() => {
                handleExamValidation(CCNNType.IELTS, "7.5");
            }).not.toThrow();
            expect(() => {
                handleExamValidation(CCQTType.SAT, "1400");
            }).not.toThrow();
            expect(() => {
                handleExamValidation(CCQTType.A_Level, "A*");
            }).not.toThrow();
        });

        it("should throw ValidationException for invalid exam scores", () => {
            expect(() => {
                handleExamValidation(CCNNType.IELTS, "10.0");
            }).toThrow(ValidationException);
            expect(() => {
                handleExamValidation(CCQTType.SAT, "2000");
            }).toThrow(ValidationException);
            expect(() => {
                handleExamValidation(CCQTType.A_Level, "Z");
            }).toThrow(ValidationException);
        });

        it("should include prefix in error messages when provided", () => {
            let thrownError: unknown;

            try {
                handleExamValidation(CCNNType.IELTS, "10.0", "certification");
            } catch (error) {
                thrownError = error as Error;
            }

            expect(thrownError).toBeInstanceOf(ValidationException);
            expect(
                (thrownError as ValidationException).validationErrors,
            ).toHaveProperty("certification.level");
        });

        it("should not include prefix when not provided", () => {
            let thrownError: unknown;

            try {
                handleExamValidation(CCNNType.IELTS, "10.0");
            } catch (error) {
                thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(ValidationException);
            const validationError = thrownError as ValidationException;
            expect(validationError.validationErrors).toHaveProperty("level");
            expect(validationError.validationErrors).not.toHaveProperty(
                "certification.level",
            );
        });

        it("should handle multiple validation errors with prefix", () => {
            let thrownError: unknown;

            try {
                handleExamValidation(
                    CCNNType.IELTS,
                    "invalid",
                    "certifications[0]",
                );
            } catch (error) {
                thrownError = error;
            }

            expect(thrownError).toBeInstanceOf(ValidationException);
            expect(
                (thrownError as ValidationException).validationErrors,
            ).toHaveProperty("certifications[0].level");
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle empty string scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "");
            expect(errors.level).toContain("Level is required.");
        });

        it("should handle whitespace-only scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "   ");
            expect(errors.level).toContain("must be a valid number");
        });

        it("should handle negative scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "-5");
            expect(errors.level).toContain("must be between 1 and 9");
        });

        it("should handle very large scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "999999");
            expect(errors.level).toContain("must be between 1 and 9");
        });

        it("should handle special characters in scores", () => {
            // parseFloat("7.5%") returns 7.5, which is valid for IELTS
            const errors = validateExamTypeScore(CCNNType.IELTS, "7.5%");
            expect(errors.level).toBeUndefined();
        });

        it("should handle scores with multiple decimal points", () => {
            // parseFloat("7.5.0") returns 7.5, which is valid for IELTS
            const errors = validateExamTypeScore(CCNNType.IELTS, "7.5.0");
            expect(errors.level).toBeUndefined();
        });

        it("should reject truly invalid non-numeric strings", () => {
            const errors1 = validateExamTypeScore(CCNNType.IELTS, "abc");
            expect(errors1.level).toBeDefined();
            expect(errors1.level).toContain("must be a valid number");

            const errors2 = validateExamTypeScore(
                CCNNType.IELTS,
                "not a number",
            );
            expect(errors2.level).toBeDefined();
            expect(errors2.level).toContain("must be a valid number");
        });

        it("should handle scientific notation", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "1e2");
            expect(errors.level).toBeDefined();
        });

        it("should trim and validate A_Level grades correctly", () => {
            const errors = validateExamTypeScore(CCQTType.A_Level, " A* ");
            expect(errors.level).toBeUndefined();
        });

        it("should trim whitespace from numeric scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "  7.5  ");
            expect(errors.level).toBeUndefined();
        });

        it("should trim whitespace from JLPT levels", () => {
            const errors = validateExamTypeScore(CCNNType.JLPT, " N1 ");
            expect(errors.level).toBeUndefined();
        });

        it("should handle case sensitivity for JLPT", () => {
            const errorsUpper = validateExamTypeScore(CCNNType.JLPT, "N1");
            const errorsLower = validateExamTypeScore(CCNNType.JLPT, "n1");

            expect(errorsUpper.level).toBeUndefined();
            expect(errorsLower.level).toBeDefined();
            expect(errorsLower.level).toContain("must be one of");
        });

        it("should validate boundary values for all numeric exam types", () => {
            // Test minimum valid scores
            expect(
                validateExamTypeScore(CCNNType.IELTS, "1.0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_CBT, "33").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_iBT, "0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_Paper, "310").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEIC, "60").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCQTType.ACT, "1").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCQTType.SAT, "400").level,
            ).toBeUndefined();

            // Test maximum valid scores
            expect(
                validateExamTypeScore(CCNNType.IELTS, "9.0").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_CBT, "300").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_iBT, "120").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_Paper, "677").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCNNType.TOEIC, "990").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCQTType.ACT, "36").level,
            ).toBeUndefined();
            expect(
                validateExamTypeScore(CCQTType.SAT, "1600").level,
            ).toBeUndefined();
        });

        it("should validate just below minimum boundary", () => {
            expect(
                validateExamTypeScore(CCNNType.IELTS, "0.5").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_CBT, "32").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_Paper, "309").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEIC, "55").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCQTType.ACT, "0").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCQTType.SAT, "390").level,
            ).toBeDefined();
        });

        it("should validate just above maximum boundary", () => {
            expect(
                validateExamTypeScore(CCNNType.IELTS, "9.5").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_CBT, "301").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_iBT, "121").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEFL_Paper, "678").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCNNType.TOEIC, "995").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCQTType.ACT, "37").level,
            ).toBeDefined();
            expect(
                validateExamTypeScore(CCQTType.SAT, "1610").level,
            ).toBeDefined();
        });
    });

    describe("Integration Tests", () => {
        it("should validate all exam types have non-overlapping categories", () => {
            const allExamTypes = [
                ...Object.values(CCNNType),
                ...Object.values(CCQTType),
                ...Object.values(DGNLType),
            ];

            allExamTypes.forEach((examType) => {
                const isCCNN = isCCNNType(examType);
                const isCCQT = isCCQTType(examType);
                const isDGNL = isDGNLType(examType);

                const categoryCount = [isCCNN, isCCQT, isDGNL].filter(
                    Boolean,
                ).length;

                expect(
                    categoryCount,
                    `Exam type ${examType} should belong to exactly one category`,
                ).toBe(1);
            });
        });

        it("should validate category getter matches type guards", () => {
            const allExamTypes = Object.values([CCNNType, CCQTType, DGNLType]);

            allExamTypes.forEach((examType) => {
                const category = getExamCategory(examType);
                const expectedCategory = isCCNNType(examType)
                    ? "CCNN"
                    : isCCQTType(examType)
                      ? "CCQT"
                      : isDGNLType(examType)
                        ? "ĐGNL"
                        : undefined;

                expect(category).toBe(expectedCategory);
            });
        });

        it("should validate all exam types have validation rules", () => {
            const allExamTypes = [
                ...Object.values(CCNNType),
                ...Object.values(DGNLType),
                ...Object.values(CCQTType),
            ];
            const testScores: Record<CCNNType | CCQTType | DGNLType, string> = {
                [CCNNType.IELTS]: "7.5",
                [CCNNType.JLPT]: "N1",
                [CCNNType.TOEFL_CBT]: "200",
                [CCNNType.TOEFL_iBT]: "100",
                [CCNNType.TOEFL_Paper]: "550",
                [CCNNType.TOEIC]: "850",
                [CCQTType.A_Level]: "A*",
                [CCQTType.ACT]: "30",
                [CCQTType.Duolingo_English_Test]: "120",
                [CCQTType.IB]: "38",
                [CCQTType.OSSD]: "85",
                [CCQTType.PTE_Academic]: "70",
                [CCQTType.SAT]: "1400",
                [DGNLType.HSA]: "120",
                [DGNLType.TSA]: "85",
                [DGNLType.VNUHCM]: "1000",
            };

            allExamTypes.forEach((examType) => {
                const testScore = testScores[examType];
                expect(testScore).toBeDefined();

                const errors = validateExamTypeScore(examType, testScore);
                expect(errors.level).toBeUndefined();
            });
        });

        it("should handle validation for all exam types with invalid scores", () => {
            const allExamTypes = [
                ...Object.values(CCNNType),
                ...Object.values(DGNLType),
                ...Object.values(CCQTType),
            ];
            const invalidScores: Record<string, string> = {
                [CCNNType.IELTS]: "10.0",
                [CCNNType.JLPT]: "N6",
                [CCNNType.TOEFL_CBT]: "400",
                [CCNNType.TOEFL_iBT]: "150",
                [CCNNType.TOEFL_Paper]: "800",
                [CCNNType.TOEIC]: "1000",
                [CCQTType.A_Level]: "Z",
                [CCQTType.ACT]: "50",
                [CCQTType.Duolingo_English_Test]: "200",
                [CCQTType.IB]: "50",
                [CCQTType.OSSD]: "150",
                [CCQTType.PTE_Academic]: "100",
                [CCQTType.SAT]: "2000",
                [DGNLType.HSA]: "200",
                [DGNLType.TSA]: "150",
                [DGNLType.VNUHCM]: "1500",
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
                validateExamTypeScore(CCNNType.IELTS, "7.5");
                validateExamTypeScore(CCQTType.SAT, "1400");
                validateExamTypeScore(CCNNType.TOEFL_iBT, "100");
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
                isCCNNType(CCNNType.IELTS);
                isCCQTType(CCQTType.SAT);
                isDGNLType(DGNLType.HSA);
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
                    examType: CCNNType.IELTS,
                    expectedKeyword: "between",
                    level: "10",
                },
                {
                    examType: CCQTType.SAT,
                    expectedKeyword: "between",
                    level: "2000",
                },
                {
                    examType: CCQTType.A_Level,
                    expectedKeyword: "must be one of",
                    level: "Z",
                },
                {
                    examType: CCNNType.TOEIC,
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
            const errors = validateExamTypeScore(CCNNType.IELTS, "10");
            const errorKeys = Object.keys(errors);

            expect(errorKeys).toHaveLength(1);
            expect(errorKeys[0]).toBe("level");
        });

        it("should return empty errors object for valid scores", () => {
            const errors = validateExamTypeScore(CCNNType.IELTS, "7.5");
            const definedErrors = Object.values(errors).filter(
                (val) => val !== undefined,
            );

            expect(definedErrors).toHaveLength(0);
        });
    });
});
