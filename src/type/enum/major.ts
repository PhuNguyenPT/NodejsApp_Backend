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

export const MajorGroupCode = {
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

// Type for major group codes
export type MajorGroupCodeKey = keyof typeof MajorGroupCode;
export const MajorGroupCodes = Object.keys(MajorGroupCode).map(Number);

// Helper function to get code by English key
export function getCodeByEnglishKey(
    englishKey: MajorGroupKey,
): MajorGroupCodeKey | undefined {
    const vietnameseName = MajorGroup[englishKey];
    const foundKey = Object.keys(MajorGroupCode).find(
        (key) =>
            MajorGroupCode[Number(key) as MajorGroupCodeKey] === vietnameseName,
    );
    return foundKey ? (Number(foundKey) as MajorGroupCodeKey) : undefined;
}

// Helper function to get code by Vietnamese name
export function getCodeByVietnameseName(
    vietnameseName: string,
): MajorGroupCodeKey | undefined {
    const foundKey = Object.keys(MajorGroupCode).find(
        (key) =>
            MajorGroupCode[Number(key) as MajorGroupCodeKey] === vietnameseName,
    );
    return foundKey ? (Number(foundKey) as MajorGroupCodeKey) : undefined;
}

export function getEnglishKeyByCode(
    code: MajorGroupCodeKey,
): MajorGroupKey | undefined {
    const vietnameseName = MajorGroupCode[code];
    return Object.keys(MajorGroup).find(
        (key) => MajorGroup[key as MajorGroupKey] === vietnameseName,
    ) as MajorGroupKey | undefined;
}

// Helper function to get English key by Vietnamese name
export function getEnglishKeyByVietnameseName(
    vietnameseName: string,
): MajorGroupKey | undefined {
    const entries = Object.entries(MajorGroup) as [MajorGroupKey, string][];
    const found = entries.find(([, value]) => value === vietnameseName);
    return found?.[0];
}

export function getMajorGroupByCode(
    code: MajorGroupCodeKey,
): string | undefined {
    return MajorGroupCode[code];
}

// Helper function to get all major group keys (equivalent to Object.keys but typed)
export function getMajorGroupKeys(): MajorGroupKey[] {
    return Object.keys(MajorGroup) as MajorGroupKey[];
}

// Helper function to get all major group values (equivalent to Object.values but typed)
export function getMajorGroupValues(): MajorGroup[] {
    return Object.values(MajorGroup);
}

// Helper function to check if a string is a valid major group key
export function isMajorGroupKey(key: string): key is MajorGroupKey {
    return key in MajorGroup;
}

// Helper function to check if a string is a valid major group value
export function isMajorGroupValue(value: string): value is MajorGroup {
    return Object.values(MajorGroup).includes(value as MajorGroup);
}
