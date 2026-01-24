// src/enum/major.ts
export enum MajorGroup {
    AGRICULTURE_FORESTRY_FISHERIES = "Nông, lâm nghiệp và thủy sản",
    ARCHITECTURE_AND_CONSTRUCTION = "Kiến trúc và xây dựng",
    ARTS = "Nghệ thuật",
    BUSINESS_AND_MANAGEMENT = "Kinh doanh và quản lý",
    COMPUTER_AND_IT = "Máy tính và công nghệ thông tin",
    EDUCATION_AND_TEACHER_TRAINING = "Khoa học giáo dục và đào tạo giáo viên",
    ENGINEERING = "Kỹ thuật",
    ENGINEERING_TECHNOLOGY = "Công nghệ kỹ thuật",
    ENVIRONMENT_AND_PROTECTION = "Môi trường và bảo vệ môi trường",
    HEALTH = "Sức khỏe",
    HUMANITIES = "Nhân văn",
    JOURNALISM_AND_INFORMATION = "Báo chí và thông tin",
    LAW = "Pháp luật",
    LIFE_SCIENCES = "Khoa học sự sống",
    MANUFACTURING_AND_PROCESSING = "Sản xuất và chế biến",
    MATHEMATICS_AND_STATISTICS = "Toán và thống kê",
    NATURAL_SCIENCES = "Khoa học tự nhiên",
    OTHER = "Khác",
    SECURITY_DEFENSE = "An ninh, Quốc phòng",
    SOCIAL_AND_BEHAVIORAL_SCIENCES = "Khoa học xã hội và hành vi",
    SOCIAL_SERVICES = "Dịch vụ xã hội",
    TOURISM_HOSPITALITY_SPORTS_PERSONAL = "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
    TRANSPORT_SERVICES = "Dịch vụ vận tải",
    VETERINARY = "Thú y",
}

export type MajorGroupKey = keyof typeof MajorGroup;

export const MajorGroupCode: Record<number, string> = {
    714: "Khoa học giáo dục và đào tạo giáo viên",
    721: "Nghệ thuật",
    722: "Nhân văn",
    731: "Khoa học xã hội và hành vi",
    732: "Báo chí và thông tin",
    734: "Kinh doanh và quản lý",
    738: "Pháp luật",
    742: "Khoa học sự sống",
    744: "Khoa học tự nhiên",
    746: "Toán và thống kê",
    748: "Máy tính và công nghệ thông tin",
    751: "Công nghệ kỹ thuật",
    752: "Kỹ thuật",
    754: "Sản xuất và chế biến",
    758: "Kiến trúc và xây dựng",
    762: "Nông, lâm nghiệp và thủy sản",
    764: "Thú y",
    772: "Sức khỏe",
    776: "Dịch vụ xã hội",
    781: "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
    784: "Dịch vụ vận tải",
    785: "Môi trường và bảo vệ môi trường",
    786: "An ninh, Quốc phòng",
    790: "Khác",
} as const;

export type MajorGroupCodeKey = keyof typeof MajorGroupCode;
export const MajorGroupCodes = Object.keys(MajorGroupCode).map(Number);

// Create reverse lookups for O(1) performance
const vietnameseNameToCode = new Map<string, number>(
    Object.entries(MajorGroupCode).map(([code, name]) => [name, Number(code)]),
);

const vietnameseNameToEnglishKey = new Map<string, MajorGroupKey>(
    (Object.entries(MajorGroup) as [MajorGroupKey, string][]).map(
        ([key, name]) => [name, key],
    ),
);

const codeToEnglishKey = new Map<number, MajorGroupKey>(
    Object.entries(MajorGroupCode)
        .map(([code, name]) => {
            const englishKey = vietnameseNameToEnglishKey.get(name);
            if (englishKey === undefined) {
                return null;
            }
            return [Number(code), englishKey] as const;
        })
        .filter(
            (entry): entry is readonly [number, MajorGroupKey] =>
                entry !== null,
        ),
);

// Helper function to get code by English key - O(1)
export function getCodeByEnglishKey(
    englishKey: MajorGroupKey,
): MajorGroupCodeKey | undefined {
    const vietnameseName: string = MajorGroup[englishKey];
    const code = vietnameseNameToCode.get(vietnameseName);
    return code;
}

// Helper function to get code by Vietnamese name - O(1)
export function getCodeByVietnameseName(
    vietnameseName: string,
): MajorGroupCodeKey | undefined {
    const code = vietnameseNameToCode.get(vietnameseName);
    return code;
}

// O(1)
export function getEnglishKeyByCode(
    code: MajorGroupCodeKey,
): MajorGroupKey | undefined {
    return codeToEnglishKey.get(code);
}

// O(1)
export function getEnglishKeyByVietnameseName(
    vietnameseName: string,
): MajorGroupKey | undefined {
    return vietnameseNameToEnglishKey.get(vietnameseName);
}

// O(1)
export function getMajorGroupByCode(
    code: MajorGroupCodeKey,
): string | undefined {
    return MajorGroupCode[code];
}

export function getMajorGroupKeys(): MajorGroupKey[] {
    return Object.keys(MajorGroup) as MajorGroupKey[];
}

export function getMajorGroupValues(): string[] {
    return Object.values(MajorGroup);
}

export function isMajorGroupKey(key: string): key is MajorGroupKey {
    return key in MajorGroup;
}

export function isMajorGroupValue(value: string): value is MajorGroup {
    return vietnameseNameToEnglishKey.has(value);
}
