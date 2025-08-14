// Enum for Major Group names with English keys and Vietnamese values
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

// Const object for Major Group codes mapping to Vietnamese names
export const MajorGroupCode = {
    "714": "Khoa học giáo dục và đào tạo giáo viên",
    "721": "Nghệ thuật",
    "722": "Nhân văn",
    "731": "Khoa học xã hội và hành vi",
    "732": "Báo chí và thông tin",
    "734": "Kinh doanh và quản lý",
    "738": "Pháp luật",
    "742": "Khoa học sự sống",
    "744": "Khoa học tự nhiên",
    "746": "Toán và thống kê",
    "748": "Máy tính và công nghệ thông tin",
    "751": "Công nghệ kỹ thuật",
    "752": "Kỹ thuật",
    "754": "Sản xuất và chế biến",
    "758": "Kiến trúc và xây dựng",
    "762": "Nông, lâm nghiệp và thủy sản",
    "764": "Thú y",
    "772": "Sức khỏe",
    "776": "Dịch vụ xã hội",
    "781": "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
    "784": "Dịch vụ vận tải",
    "785": "Môi trường và bảo vệ môi trường",
    "786": "An ninh, Quốc phòng",
    "790": "Khác",
} as const;

// Type for major group codes
export type MajorGroupCodeKey = keyof typeof MajorGroupCode;

// Helper function to get code by English key
export function getCodeByEnglishKey(
    englishKey: keyof typeof MajorGroup,
): string | undefined {
    const vietnameseName = MajorGroup[englishKey];
    return Object.keys(MajorGroupCode).find(
        (key) => MajorGroupCode[key as MajorGroupCodeKey] === vietnameseName,
    );
}

// Helper function to get English key by code
export function getEnglishKeyByCode(code: string): string | undefined {
    const vietnameseName = MajorGroupCode[code as MajorGroupCodeKey];
    return Object.keys(MajorGroup).find(
        (key) => MajorGroup[key as keyof typeof MajorGroup] === vietnameseName,
    );
}

// Helper function to get major group name by code
export function getMajorGroupByCode(code: string): string | undefined {
    return MajorGroupCode[code as MajorGroupCodeKey];
}
