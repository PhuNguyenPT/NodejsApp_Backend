// test/unit/type/enum/major.unit.spec.ts
import { describe, expect, it } from "vitest";

import {
    getCodeByEnglishKey,
    getCodeByVietnameseName,
    getEnglishKeyByCode,
    getEnglishKeyByVietnameseName,
    getMajorGroupByCode,
    getMajorGroupKeys,
    getMajorGroupValues,
    isMajorGroupKey,
    isMajorGroupValue,
    MajorGroup,
    MajorGroupCode,
    type MajorGroupCodeKey,
    MajorGroupCodes,
    type MajorGroupKey,
} from "@/type/enum/major.js";

describe("Major Group Enum and Utilities", () => {
    describe("MajorGroup Enum", () => {
        it("should have all 24 major groups with correct Vietnamese names", () => {
            expect(MajorGroup.AGRICULTURE_FORESTRY_FISHERIES).toBe(
                "Nông, lâm nghiệp và thủy sản",
            );
            expect(MajorGroup.ARCHITECTURE_AND_CONSTRUCTION).toBe(
                "Kiến trúc và xây dựng",
            );
            expect(MajorGroup.ARTS).toBe("Nghệ thuật");
            expect(MajorGroup.BUSINESS_AND_MANAGEMENT).toBe(
                "Kinh doanh và quản lý",
            );
            expect(MajorGroup.COMPUTER_AND_IT).toBe(
                "Máy tính và công nghệ thông tin",
            );
            expect(MajorGroup.EDUCATION_AND_TEACHER_TRAINING).toBe(
                "Khoa học giáo dục và đào tạo giáo viên",
            );
            expect(MajorGroup.ENGINEERING).toBe("Kỹ thuật");
            expect(MajorGroup.ENGINEERING_TECHNOLOGY).toBe(
                "Công nghệ kỹ thuật",
            );
            expect(MajorGroup.ENVIRONMENT_AND_PROTECTION).toBe(
                "Môi trường và bảo vệ môi trường",
            );
            expect(MajorGroup.HEALTH).toBe("Sức khỏe");
            expect(MajorGroup.HUMANITIES).toBe("Nhân văn");
            expect(MajorGroup.JOURNALISM_AND_INFORMATION).toBe(
                "Báo chí và thông tin",
            );
            expect(MajorGroup.LAW).toBe("Pháp luật");
            expect(MajorGroup.LIFE_SCIENCES).toBe("Khoa học sự sống");
            expect(MajorGroup.MANUFACTURING_AND_PROCESSING).toBe(
                "Sản xuất và chế biến",
            );
            expect(MajorGroup.MATHEMATICS_AND_STATISTICS).toBe(
                "Toán và thống kê",
            );
            expect(MajorGroup.NATURAL_SCIENCES).toBe("Khoa học tự nhiên");
            expect(MajorGroup.OTHER).toBe("Khác");
            expect(MajorGroup.SECURITY_DEFENSE).toBe("An ninh, Quốc phòng");
            expect(MajorGroup.SOCIAL_AND_BEHAVIORAL_SCIENCES).toBe(
                "Khoa học xã hội và hành vi",
            );
            expect(MajorGroup.SOCIAL_SERVICES).toBe("Dịch vụ xã hội");
            expect(MajorGroup.TOURISM_HOSPITALITY_SPORTS_PERSONAL).toBe(
                "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
            );
            expect(MajorGroup.TRANSPORT_SERVICES).toBe("Dịch vụ vận tải");
            expect(MajorGroup.VETERINARY).toBe("Thú y");
        });

        it("should have exactly 24 major groups", () => {
            const majorGroups = Object.values(MajorGroup);
            expect(majorGroups).toHaveLength(24);
        });

        it("should have unique Vietnamese names", () => {
            const values = Object.values(MajorGroup);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });

        it("should have all keys in SCREAMING_SNAKE_CASE", () => {
            const keys = Object.keys(MajorGroup);
            keys.forEach((key) => {
                expect(key).toMatch(/^[A-Z_]+$/);
            });
        });
    });

    describe("MajorGroupCode", () => {
        it("should have all 24 codes with correct Vietnamese names", () => {
            expect(MajorGroupCode[714]).toBe(
                "Khoa học giáo dục và đào tạo giáo viên",
            );
            expect(MajorGroupCode[721]).toBe("Nghệ thuật");
            expect(MajorGroupCode[722]).toBe("Nhân văn");
            expect(MajorGroupCode[731]).toBe("Khoa học xã hội và hành vi");
            expect(MajorGroupCode[732]).toBe("Báo chí và thông tin");
            expect(MajorGroupCode[734]).toBe("Kinh doanh và quản lý");
            expect(MajorGroupCode[738]).toBe("Pháp luật");
            expect(MajorGroupCode[742]).toBe("Khoa học sự sống");
            expect(MajorGroupCode[744]).toBe("Khoa học tự nhiên");
            expect(MajorGroupCode[746]).toBe("Toán và thống kê");
            expect(MajorGroupCode[748]).toBe("Máy tính và công nghệ thông tin");
            expect(MajorGroupCode[751]).toBe("Công nghệ kỹ thuật");
            expect(MajorGroupCode[752]).toBe("Kỹ thuật");
            expect(MajorGroupCode[754]).toBe("Sản xuất và chế biến");
            expect(MajorGroupCode[758]).toBe("Kiến trúc và xây dựng");
            expect(MajorGroupCode[762]).toBe("Nông, lâm nghiệp và thủy sản");
            expect(MajorGroupCode[764]).toBe("Thú y");
            expect(MajorGroupCode[772]).toBe("Sức khỏe");
            expect(MajorGroupCode[776]).toBe("Dịch vụ xã hội");
            expect(MajorGroupCode[781]).toBe(
                "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
            );
            expect(MajorGroupCode[784]).toBe("Dịch vụ vận tải");
            expect(MajorGroupCode[785]).toBe("Môi trường và bảo vệ môi trường");
            expect(MajorGroupCode[786]).toBe("An ninh, Quốc phòng");
            expect(MajorGroupCode[790]).toBe("Khác");
        });

        it("should have exactly 24 codes", () => {
            const codes = Object.keys(MajorGroupCode);
            expect(codes).toHaveLength(24);
        });

        it("should have all codes as valid numbers", () => {
            const codes = Object.keys(MajorGroupCode).map(Number);
            codes.forEach((code) => {
                expect(typeof code).toBe("number");
                expect(Number.isNaN(code)).toBe(false);
                expect(code).toBeGreaterThan(0);
            });
        });

        it("should have codes in the 700-799 range", () => {
            const codes = Object.keys(MajorGroupCode).map(Number);
            codes.forEach((code) => {
                expect(code).toBeGreaterThanOrEqual(700);
                expect(code).toBeLessThan(800);
            });
        });
    });

    describe("MajorGroupCodes array", () => {
        it("should contain all 24 numeric codes", () => {
            const expectedCodes = [
                714, 721, 722, 731, 732, 734, 738, 742, 744, 746, 748, 751, 752,
                754, 758, 762, 764, 772, 776, 781, 784, 785, 786, 790,
            ];

            expect(MajorGroupCodes).toHaveLength(24);
            expectedCodes.forEach((code) => {
                expect(MajorGroupCodes).toContain(code);
            });
        });

        it("should only contain numbers", () => {
            MajorGroupCodes.forEach((code) => {
                expect(typeof code).toBe("number");
                expect(Number.isNaN(code)).toBe(false);
            });
        });

        it("should match keys from MajorGroupCode", () => {
            const codeKeys = Object.keys(MajorGroupCode).map(Number);
            expect(MajorGroupCodes.sort()).toEqual(codeKeys.sort());
        });
    });

    describe("Data Consistency", () => {
        it("should have matching Vietnamese names between MajorGroup and MajorGroupCode", () => {
            const majorGroupValues = Object.values(MajorGroup);
            const codeValues = Object.values(MajorGroupCode);

            // All MajorGroup values should exist in MajorGroupCode
            majorGroupValues.forEach((value) => {
                expect(codeValues).toContain(value);
            });

            // All MajorGroupCode values should exist in MajorGroup
            codeValues.forEach((value) => {
                expect(majorGroupValues).toContain(value);
            });
        });

        it("should have 1:1 mapping between codes and Vietnamese names", () => {
            const codeValues = Object.values(MajorGroupCode);
            const uniqueCodeValues = new Set(codeValues);
            expect(uniqueCodeValues.size).toBe(codeValues.length);
        });

        it("should have same count in all data structures", () => {
            expect(Object.keys(MajorGroup)).toHaveLength(24);
            expect(Object.keys(MajorGroupCode)).toHaveLength(24);
            expect(MajorGroupCodes).toHaveLength(24);
        });
    });

    describe("getCodeByEnglishKey", () => {
        it("should return correct code for all English keys", () => {
            expect(getCodeByEnglishKey("EDUCATION_AND_TEACHER_TRAINING")).toBe(
                714,
            );
            expect(getCodeByEnglishKey("ARTS")).toBe(721);
            expect(getCodeByEnglishKey("HUMANITIES")).toBe(722);
            expect(getCodeByEnglishKey("SOCIAL_AND_BEHAVIORAL_SCIENCES")).toBe(
                731,
            );
            expect(getCodeByEnglishKey("JOURNALISM_AND_INFORMATION")).toBe(732);
            expect(getCodeByEnglishKey("BUSINESS_AND_MANAGEMENT")).toBe(734);
            expect(getCodeByEnglishKey("LAW")).toBe(738);
            expect(getCodeByEnglishKey("LIFE_SCIENCES")).toBe(742);
            expect(getCodeByEnglishKey("NATURAL_SCIENCES")).toBe(744);
            expect(getCodeByEnglishKey("MATHEMATICS_AND_STATISTICS")).toBe(746);
            expect(getCodeByEnglishKey("COMPUTER_AND_IT")).toBe(748);
            expect(getCodeByEnglishKey("ENGINEERING_TECHNOLOGY")).toBe(751);
            expect(getCodeByEnglishKey("ENGINEERING")).toBe(752);
            expect(getCodeByEnglishKey("MANUFACTURING_AND_PROCESSING")).toBe(
                754,
            );
            expect(getCodeByEnglishKey("ARCHITECTURE_AND_CONSTRUCTION")).toBe(
                758,
            );
            expect(getCodeByEnglishKey("AGRICULTURE_FORESTRY_FISHERIES")).toBe(
                762,
            );
            expect(getCodeByEnglishKey("VETERINARY")).toBe(764);
            expect(getCodeByEnglishKey("HEALTH")).toBe(772);
            expect(getCodeByEnglishKey("SOCIAL_SERVICES")).toBe(776);
            expect(
                getCodeByEnglishKey("TOURISM_HOSPITALITY_SPORTS_PERSONAL"),
            ).toBe(781);
            expect(getCodeByEnglishKey("TRANSPORT_SERVICES")).toBe(784);
            expect(getCodeByEnglishKey("ENVIRONMENT_AND_PROTECTION")).toBe(785);
            expect(getCodeByEnglishKey("SECURITY_DEFENSE")).toBe(786);
            expect(getCodeByEnglishKey("OTHER")).toBe(790);
        });

        it("should return undefined for non-existent keys", () => {
            const result = getCodeByEnglishKey("NON_EXISTENT" as MajorGroupKey);
            expect(result).toBeUndefined();
        });

        it("should work for all major group keys", () => {
            const allKeys = getMajorGroupKeys();
            allKeys.forEach((key) => {
                const code = getCodeByEnglishKey(key);
                expect(code).toBeDefined();
                expect(typeof code).toBe("number");
            });
        });
    });

    describe("getCodeByVietnameseName", () => {
        it("should return correct code for all Vietnamese names", () => {
            expect(
                getCodeByVietnameseName(
                    "Khoa học giáo dục và đào tạo giáo viên",
                ),
            ).toBe(714);
            expect(getCodeByVietnameseName("Nghệ thuật")).toBe(721);
            expect(getCodeByVietnameseName("Nhân văn")).toBe(722);
            expect(getCodeByVietnameseName("Khoa học xã hội và hành vi")).toBe(
                731,
            );
            expect(getCodeByVietnameseName("Báo chí và thông tin")).toBe(732);
            expect(getCodeByVietnameseName("Kinh doanh và quản lý")).toBe(734);
            expect(getCodeByVietnameseName("Pháp luật")).toBe(738);
            expect(getCodeByVietnameseName("Khoa học sự sống")).toBe(742);
            expect(getCodeByVietnameseName("Khoa học tự nhiên")).toBe(744);
            expect(getCodeByVietnameseName("Toán và thống kê")).toBe(746);
            expect(
                getCodeByVietnameseName("Máy tính và công nghệ thông tin"),
            ).toBe(748);
            expect(getCodeByVietnameseName("Công nghệ kỹ thuật")).toBe(751);
            expect(getCodeByVietnameseName("Kỹ thuật")).toBe(752);
            expect(getCodeByVietnameseName("Sản xuất và chế biến")).toBe(754);
            expect(getCodeByVietnameseName("Kiến trúc và xây dựng")).toBe(758);
            expect(
                getCodeByVietnameseName("Nông, lâm nghiệp và thủy sản"),
            ).toBe(762);
            expect(getCodeByVietnameseName("Thú y")).toBe(764);
            expect(getCodeByVietnameseName("Sức khỏe")).toBe(772);
            expect(getCodeByVietnameseName("Dịch vụ xã hội")).toBe(776);
            expect(
                getCodeByVietnameseName(
                    "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
                ),
            ).toBe(781);
            expect(getCodeByVietnameseName("Dịch vụ vận tải")).toBe(784);
            expect(
                getCodeByVietnameseName("Môi trường và bảo vệ môi trường"),
            ).toBe(785);
            expect(getCodeByVietnameseName("An ninh, Quốc phòng")).toBe(786);
            expect(getCodeByVietnameseName("Khác")).toBe(790);
        });

        it("should return undefined for non-existent names", () => {
            expect(getCodeByVietnameseName("Không tồn tại")).toBeUndefined();
        });

        it("should be case-sensitive", () => {
            expect(getCodeByVietnameseName("kỹ thuật")).toBeUndefined();
            expect(getCodeByVietnameseName("Kỹ thuật")).toBe(752);
        });

        it("should work for all Vietnamese names", () => {
            const allValues = getMajorGroupValues();
            allValues.forEach((name) => {
                const code = getCodeByVietnameseName(name);
                expect(code).toBeDefined();
            });
        });
    });

    describe("getEnglishKeyByCode", () => {
        it("should return correct English key for all codes", () => {
            expect(getEnglishKeyByCode(714)).toBe(
                "EDUCATION_AND_TEACHER_TRAINING",
            );
            expect(getEnglishKeyByCode(721)).toBe("ARTS");
            expect(getEnglishKeyByCode(722)).toBe("HUMANITIES");
            expect(getEnglishKeyByCode(731)).toBe(
                "SOCIAL_AND_BEHAVIORAL_SCIENCES",
            );
            expect(getEnglishKeyByCode(732)).toBe("JOURNALISM_AND_INFORMATION");
            expect(getEnglishKeyByCode(734)).toBe("BUSINESS_AND_MANAGEMENT");
            expect(getEnglishKeyByCode(738)).toBe("LAW");
            expect(getEnglishKeyByCode(742)).toBe("LIFE_SCIENCES");
            expect(getEnglishKeyByCode(744)).toBe("NATURAL_SCIENCES");
            expect(getEnglishKeyByCode(746)).toBe("MATHEMATICS_AND_STATISTICS");
            expect(getEnglishKeyByCode(748)).toBe("COMPUTER_AND_IT");
            expect(getEnglishKeyByCode(751)).toBe("ENGINEERING_TECHNOLOGY");
            expect(getEnglishKeyByCode(752)).toBe("ENGINEERING");
            expect(getEnglishKeyByCode(754)).toBe(
                "MANUFACTURING_AND_PROCESSING",
            );
            expect(getEnglishKeyByCode(758)).toBe(
                "ARCHITECTURE_AND_CONSTRUCTION",
            );
            expect(getEnglishKeyByCode(762)).toBe(
                "AGRICULTURE_FORESTRY_FISHERIES",
            );
            expect(getEnglishKeyByCode(764)).toBe("VETERINARY");
            expect(getEnglishKeyByCode(772)).toBe("HEALTH");
            expect(getEnglishKeyByCode(776)).toBe("SOCIAL_SERVICES");
            expect(getEnglishKeyByCode(781)).toBe(
                "TOURISM_HOSPITALITY_SPORTS_PERSONAL",
            );
            expect(getEnglishKeyByCode(784)).toBe("TRANSPORT_SERVICES");
            expect(getEnglishKeyByCode(785)).toBe("ENVIRONMENT_AND_PROTECTION");
            expect(getEnglishKeyByCode(786)).toBe("SECURITY_DEFENSE");
            expect(getEnglishKeyByCode(790)).toBe("OTHER");
        });

        it("should return undefined for non-existent codes", () => {
            expect(
                getEnglishKeyByCode(999 as MajorGroupCodeKey),
            ).toBeUndefined();
        });

        it("should work for all codes", () => {
            MajorGroupCodes.forEach((code) => {
                const key = getEnglishKeyByCode(code);
                expect(key).toBeDefined();
                expect(typeof key).toBe("string");
            });
        });
    });

    describe("getEnglishKeyByVietnameseName", () => {
        it("should return correct English key for all Vietnamese names", () => {
            expect(
                getEnglishKeyByVietnameseName(
                    "Khoa học giáo dục và đào tạo giáo viên",
                ),
            ).toBe("EDUCATION_AND_TEACHER_TRAINING");
            expect(getEnglishKeyByVietnameseName("Nghệ thuật")).toBe("ARTS");
            expect(getEnglishKeyByVietnameseName("Nhân văn")).toBe(
                "HUMANITIES",
            );
            expect(
                getEnglishKeyByVietnameseName("Khoa học xã hội và hành vi"),
            ).toBe("SOCIAL_AND_BEHAVIORAL_SCIENCES");
            expect(getEnglishKeyByVietnameseName("Báo chí và thông tin")).toBe(
                "JOURNALISM_AND_INFORMATION",
            );
            expect(getEnglishKeyByVietnameseName("Kinh doanh và quản lý")).toBe(
                "BUSINESS_AND_MANAGEMENT",
            );
            expect(getEnglishKeyByVietnameseName("Pháp luật")).toBe("LAW");
            expect(getEnglishKeyByVietnameseName("Khoa học sự sống")).toBe(
                "LIFE_SCIENCES",
            );
            expect(getEnglishKeyByVietnameseName("Khoa học tự nhiên")).toBe(
                "NATURAL_SCIENCES",
            );
            expect(getEnglishKeyByVietnameseName("Toán và thống kê")).toBe(
                "MATHEMATICS_AND_STATISTICS",
            );
            expect(
                getEnglishKeyByVietnameseName(
                    "Máy tính và công nghệ thông tin",
                ),
            ).toBe("COMPUTER_AND_IT");
            expect(getEnglishKeyByVietnameseName("Công nghệ kỹ thuật")).toBe(
                "ENGINEERING_TECHNOLOGY",
            );
            expect(getEnglishKeyByVietnameseName("Kỹ thuật")).toBe(
                "ENGINEERING",
            );
            expect(getEnglishKeyByVietnameseName("Sản xuất và chế biến")).toBe(
                "MANUFACTURING_AND_PROCESSING",
            );
            expect(getEnglishKeyByVietnameseName("Kiến trúc và xây dựng")).toBe(
                "ARCHITECTURE_AND_CONSTRUCTION",
            );
            expect(
                getEnglishKeyByVietnameseName("Nông, lâm nghiệp và thủy sản"),
            ).toBe("AGRICULTURE_FORESTRY_FISHERIES");
            expect(getEnglishKeyByVietnameseName("Thú y")).toBe("VETERINARY");
            expect(getEnglishKeyByVietnameseName("Sức khỏe")).toBe("HEALTH");
            expect(getEnglishKeyByVietnameseName("Dịch vụ xã hội")).toBe(
                "SOCIAL_SERVICES",
            );
            expect(
                getEnglishKeyByVietnameseName(
                    "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
                ),
            ).toBe("TOURISM_HOSPITALITY_SPORTS_PERSONAL");
            expect(getEnglishKeyByVietnameseName("Dịch vụ vận tải")).toBe(
                "TRANSPORT_SERVICES",
            );
            expect(
                getEnglishKeyByVietnameseName(
                    "Môi trường và bảo vệ môi trường",
                ),
            ).toBe("ENVIRONMENT_AND_PROTECTION");
            expect(getEnglishKeyByVietnameseName("An ninh, Quốc phòng")).toBe(
                "SECURITY_DEFENSE",
            );
            expect(getEnglishKeyByVietnameseName("Khác")).toBe("OTHER");
        });

        it("should return undefined for non-existent names", () => {
            expect(
                getEnglishKeyByVietnameseName("Không tồn tại"),
            ).toBeUndefined();
        });

        it("should be case-sensitive", () => {
            expect(getEnglishKeyByVietnameseName("kỹ thuật")).toBeUndefined();
        });

        it("should work for all Vietnamese names", () => {
            const allValues = getMajorGroupValues();
            allValues.forEach((name) => {
                const key = getEnglishKeyByVietnameseName(name);
                expect(key).toBeDefined();
            });
        });
    });

    describe("getMajorGroupByCode", () => {
        it("should return Vietnamese name for all valid codes", () => {
            expect(getMajorGroupByCode(714)).toBe(
                "Khoa học giáo dục và đào tạo giáo viên",
            );
            expect(getMajorGroupByCode(721)).toBe("Nghệ thuật");
            expect(getMajorGroupByCode(722)).toBe("Nhân văn");
            expect(getMajorGroupByCode(731)).toBe("Khoa học xã hội và hành vi");
            expect(getMajorGroupByCode(732)).toBe("Báo chí và thông tin");
            expect(getMajorGroupByCode(734)).toBe("Kinh doanh và quản lý");
            expect(getMajorGroupByCode(738)).toBe("Pháp luật");
            expect(getMajorGroupByCode(742)).toBe("Khoa học sự sống");
            expect(getMajorGroupByCode(744)).toBe("Khoa học tự nhiên");
            expect(getMajorGroupByCode(746)).toBe("Toán và thống kê");
            expect(getMajorGroupByCode(748)).toBe(
                "Máy tính và công nghệ thông tin",
            );
            expect(getMajorGroupByCode(751)).toBe("Công nghệ kỹ thuật");
            expect(getMajorGroupByCode(752)).toBe("Kỹ thuật");
            expect(getMajorGroupByCode(754)).toBe("Sản xuất và chế biến");
            expect(getMajorGroupByCode(758)).toBe("Kiến trúc và xây dựng");
            expect(getMajorGroupByCode(762)).toBe(
                "Nông, lâm nghiệp và thủy sản",
            );
            expect(getMajorGroupByCode(764)).toBe("Thú y");
            expect(getMajorGroupByCode(772)).toBe("Sức khỏe");
            expect(getMajorGroupByCode(776)).toBe("Dịch vụ xã hội");
            expect(getMajorGroupByCode(781)).toBe(
                "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
            );
            expect(getMajorGroupByCode(784)).toBe("Dịch vụ vận tải");
            expect(getMajorGroupByCode(785)).toBe(
                "Môi trường và bảo vệ môi trường",
            );
            expect(getMajorGroupByCode(786)).toBe("An ninh, Quốc phòng");
            expect(getMajorGroupByCode(790)).toBe("Khác");
        });

        it("should return undefined for invalid codes", () => {
            expect(
                getMajorGroupByCode(999 as MajorGroupCodeKey),
            ).toBeUndefined();
        });
    });

    describe("getMajorGroupKeys", () => {
        it("should return all 24 English keys", () => {
            const keys = getMajorGroupKeys();
            expect(keys).toHaveLength(24);

            const expectedKeys: MajorGroupKey[] = [
                "AGRICULTURE_FORESTRY_FISHERIES",
                "ARCHITECTURE_AND_CONSTRUCTION",
                "ARTS",
                "BUSINESS_AND_MANAGEMENT",
                "COMPUTER_AND_IT",
                "EDUCATION_AND_TEACHER_TRAINING",
                "ENGINEERING",
                "ENGINEERING_TECHNOLOGY",
                "ENVIRONMENT_AND_PROTECTION",
                "HEALTH",
                "HUMANITIES",
                "JOURNALISM_AND_INFORMATION",
                "LAW",
                "LIFE_SCIENCES",
                "MANUFACTURING_AND_PROCESSING",
                "MATHEMATICS_AND_STATISTICS",
                "NATURAL_SCIENCES",
                "OTHER",
                "SECURITY_DEFENSE",
                "SOCIAL_AND_BEHAVIORAL_SCIENCES",
                "SOCIAL_SERVICES",
                "TOURISM_HOSPITALITY_SPORTS_PERSONAL",
                "TRANSPORT_SERVICES",
                "VETERINARY",
            ];

            expectedKeys.forEach((key) => {
                expect(keys).toContain(key);
            });
        });

        it("should return array of strings", () => {
            const keys = getMajorGroupKeys();
            keys.forEach((key) => {
                expect(typeof key).toBe("string");
            });
        });
    });

    describe("getMajorGroupValues", () => {
        it("should return all 24 Vietnamese names", () => {
            const values = getMajorGroupValues();
            expect(values).toHaveLength(24);

            const expectedValues = [
                "Nông, lâm nghiệp và thủy sản",
                "Kiến trúc và xây dựng",
                "Nghệ thuật",
                "Kinh doanh và quản lý",
                "Máy tính và công nghệ thông tin",
                "Khoa học giáo dục và đào tạo giáo viên",
                "Kỹ thuật",
                "Công nghệ kỹ thuật",
                "Môi trường và bảo vệ môi trường",
                "Sức khỏe",
                "Nhân văn",
                "Báo chí và thông tin",
                "Pháp luật",
                "Khoa học sự sống",
                "Sản xuất và chế biến",
                "Toán và thống kê",
                "Khoa học tự nhiên",
                "Khác",
                "An ninh, Quốc phòng",
                "Khoa học xã hội và hành vi",
                "Dịch vụ xã hội",
                "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
                "Dịch vụ vận tải",
                "Thú y",
            ];

            expectedValues.forEach((value) => {
                expect(values).toContain(value);
            });
        });

        it("should return array of strings", () => {
            const values = getMajorGroupValues();
            values.forEach((value) => {
                expect(typeof value).toBe("string");
            });
        });
    });

    describe("isMajorGroupKey", () => {
        it("should return true for all valid keys", () => {
            const validKeys: MajorGroupKey[] = [
                "AGRICULTURE_FORESTRY_FISHERIES",
                "ARCHITECTURE_AND_CONSTRUCTION",
                "ARTS",
                "BUSINESS_AND_MANAGEMENT",
                "COMPUTER_AND_IT",
                "EDUCATION_AND_TEACHER_TRAINING",
                "ENGINEERING",
                "ENGINEERING_TECHNOLOGY",
                "ENVIRONMENT_AND_PROTECTION",
                "HEALTH",
                "HUMANITIES",
                "JOURNALISM_AND_INFORMATION",
                "LAW",
                "LIFE_SCIENCES",
                "MANUFACTURING_AND_PROCESSING",
                "MATHEMATICS_AND_STATISTICS",
                "NATURAL_SCIENCES",
                "OTHER",
                "SECURITY_DEFENSE",
                "SOCIAL_AND_BEHAVIORAL_SCIENCES",
                "SOCIAL_SERVICES",
                "TOURISM_HOSPITALITY_SPORTS_PERSONAL",
                "TRANSPORT_SERVICES",
                "VETERINARY",
            ];

            validKeys.forEach((key) => {
                expect(isMajorGroupKey(key)).toBe(true);
            });
        });

        it("should return false for invalid keys", () => {
            expect(isMajorGroupKey("INVALID_KEY")).toBe(false);
            expect(isMajorGroupKey("computer_and_it")).toBe(false);
            expect(isMajorGroupKey("")).toBe(false);
            expect(isMajorGroupKey("123")).toBe(false);
        });
        it("should work for all valid keys", () => {
            const allKeys = getMajorGroupKeys();
            allKeys.forEach((key) => {
                expect(isMajorGroupKey(key)).toBe(true);
            });
        });
    });

    describe("isMajorGroupValue", () => {
        it("should return true for all valid Vietnamese names", () => {
            const validValues = [
                "Nông, lâm nghiệp và thủy sản",
                "Kiến trúc và xây dựng",
                "Nghệ thuật",
                "Kinh doanh và quản lý",
                "Máy tính và công nghệ thông tin",
                "Khoa học giáo dục và đào tạo giáo viên",
                "Kỹ thuật",
                "Công nghệ kỹ thuật",
                "Môi trường và bảo vệ môi trường",
                "Sức khỏe",
                "Nhân văn",
                "Báo chí và thông tin",
                "Pháp luật",
                "Khoa học sự sống",
                "Sản xuất và chế biến",
                "Toán và thống kê",
                "Khoa học tự nhiên",
                "Khác",
                "An ninh, Quốc phòng",
                "Khoa học xã hội và hành vi",
                "Dịch vụ xã hội",
                "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
                "Dịch vụ vận tải",
                "Thú y",
            ];

            validValues.forEach((value) => {
                expect(isMajorGroupValue(value)).toBe(true);
            });
        });

        it("should return false for invalid names", () => {
            expect(isMajorGroupValue("Không tồn tại")).toBe(false);
            expect(isMajorGroupValue("kỹ thuật")).toBe(false);
            expect(isMajorGroupValue("")).toBe(false);
        });

        it("should work for all valid values", () => {
            const allValues = getMajorGroupValues();
            allValues.forEach((value) => {
                expect(isMajorGroupValue(value)).toBe(true);
            });
        });
    });

    describe("Round-trip conversions", () => {
        it("should convert English key -> Code -> English key for all entries", () => {
            const allKeys = getMajorGroupKeys();
            allKeys.forEach((key) => {
                const code = getCodeByEnglishKey(key);
                const backToKey =
                    code !== undefined ? getEnglishKeyByCode(code) : undefined;

                expect(code).toBeDefined();
                expect(backToKey).toBe(key);
            });
        });

        it("should convert Code -> English key -> Code for all entries", () => {
            MajorGroupCodes.forEach((code) => {
                const key = getEnglishKeyByCode(code);
                const backToCode =
                    key !== undefined ? getCodeByEnglishKey(key) : undefined;

                expect(key).toBeDefined();
                expect(backToCode).toBe(code);
            });
        });

        it("should convert Vietnamese name -> Code -> Vietnamese name for all entries", () => {
            const allValues = getMajorGroupValues();
            allValues.forEach((name) => {
                const code = getCodeByVietnameseName(name);
                const backToName =
                    code !== undefined ? getMajorGroupByCode(code) : undefined;

                expect(code).toBeDefined();
                expect(backToName).toBe(name);
            });
        });

        it("should convert Vietnamese name -> English key -> Vietnamese name for all entries", () => {
            const allValues = getMajorGroupValues();
            allValues.forEach((name) => {
                const key = getEnglishKeyByVietnameseName(name);
                const backToName =
                    key !== undefined ? MajorGroup[key] : undefined;

                expect(key).toBeDefined();
                expect(backToName).toBe(name);
            });
        });
    });

    describe("Performance characteristics", () => {
        it("should handle large batch of lookups efficiently", () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                getCodeByEnglishKey("COMPUTER_AND_IT");
                getEnglishKeyByCode(748);
                getCodeByVietnameseName("Kỹ thuật");
                getEnglishKeyByVietnameseName("Sức khỏe");
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 4000 O(1) lookups should be very fast (< 100ms)
            expect(duration).toBeLessThan(100);
        });
    });

    describe("Edge cases", () => {
        it("should handle empty string gracefully", () => {
            expect(getCodeByVietnameseName("")).toBeUndefined();
            expect(getEnglishKeyByVietnameseName("")).toBeUndefined();
            expect(isMajorGroupKey("")).toBe(false);
            expect(isMajorGroupValue("")).toBe(false);
        });

        it("should handle whitespace strings", () => {
            expect(getCodeByVietnameseName("   ")).toBeUndefined();
            expect(getEnglishKeyByVietnameseName("   ")).toBeUndefined();
        });

        it("should handle special characters", () => {
            expect(getCodeByVietnameseName("@#$%")).toBeUndefined();
            expect(isMajorGroupKey("!@#$")).toBe(false);
        });

        it("should handle numeric strings", () => {
            expect(isMajorGroupKey("123")).toBe(false);
            expect(isMajorGroupValue("456")).toBe(false);
        });
    });
});
