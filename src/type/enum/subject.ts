/**
 * Vietnamese High School Subjects Enum
 * Based on Vietnam's national curriculum and university entrance exam subjects
 */
export enum VietnameseSubject {
    AM_NHAC = "Âm Nhạc",
    CONG_NGHE = "Công Nghệ",
    DIA_LY = "Địa Lý",
    GDCD = "Giáo Dục Công Dân",
    GDQP = "Giáo Dục Quốc Phòng An Ninh",
    HOA_HOC = "Hóa Học",
    KINH_TE = "Kinh Tế",
    KY_THUAT = "Kỹ Thuật",
    LICH_SU = "Lịch Sử",
    MY_THUAT = "Mỹ Thuật",
    PHAP_LUAT = "Pháp Luật",
    SINH_HOC = "Sinh Học",
    TAM_LY_HOC = "Tâm Lý Học",
    THE_DUC = "Thể Dục",
    TIENG_ANH = "Tiếng Anh",
    TIENG_DUC = "Tiếng Đức",
    TIENG_NGA = "Tiếng Nga",
    TIENG_NHAT = "Tiếng Nhật",
    TIENG_PHAP = "Tiếng Pháp",
    TIENG_TRUNG = "Tiếng Trung",
    TIN_HOC = "Tin Học",
    TOAN = "Toán",
    TRIET_HOC = "Triết Học",
    VAN = "Ngữ Văn",
    VAT_LY = "Vật Lý",
}

/**
 * Subject name variations mapping for better OCR recognition
 */
export const SUBJECT_VARIATIONS: Partial<Record<string, VietnameseSubject>> = {
    "âm nhạc": VietnameseSubject.AM_NHAC,
    anh: VietnameseSubject.TIENG_ANH,
    "anh văn": VietnameseSubject.TIENG_ANH,
    "an ninh": VietnameseSubject.GDQP,
    art: VietnameseSubject.MY_THUAT,
    biology: VietnameseSubject.SINH_HOC,
    chemistry: VietnameseSubject.HOA_HOC,
    chinese: VietnameseSubject.TIENG_TRUNG,
    "civic education": VietnameseSubject.GDCD,
    "computer science": VietnameseSubject.TIN_HOC,
    "công dân": VietnameseSubject.GDCD,
    "công nghệ": VietnameseSubject.CONG_NGHE,
    địa: VietnameseSubject.DIA_LY,
    "địa lí": VietnameseSubject.DIA_LY,
    "địa lý": VietnameseSubject.DIA_LY,
    đức: VietnameseSubject.TIENG_DUC,
    english: VietnameseSubject.TIENG_ANH,
    french: VietnameseSubject.TIENG_PHAP,
    gdcd: VietnameseSubject.GDCD,
    gdqp: VietnameseSubject.GDQP,
    geography: VietnameseSubject.DIA_LY,
    german: VietnameseSubject.TIENG_DUC,
    "giáo dục công dân": VietnameseSubject.GDCD,
    "giáo dục quốc phòng": VietnameseSubject.GDQP,
    history: VietnameseSubject.LICH_SU,
    hoá: VietnameseSubject.HOA_HOC,
    hóa: VietnameseSubject.HOA_HOC,
    "hoá học": VietnameseSubject.HOA_HOC,
    "hóa học": VietnameseSubject.HOA_HOC,
    it: VietnameseSubject.TIN_HOC,
    japanese: VietnameseSubject.TIENG_NHAT,
    "kỹ thuật": VietnameseSubject.KY_THUAT,
    "lịch sử": VietnameseSubject.LICH_SU,
    literature: VietnameseSubject.VAN,
    lý: VietnameseSubject.VAT_LY,
    mathematics: VietnameseSubject.TOAN,
    music: VietnameseSubject.AM_NHAC,
    "mỹ thuật": VietnameseSubject.MY_THUAT,
    nga: VietnameseSubject.TIENG_NGA,
    "ngữ văn": VietnameseSubject.VAN,
    nhạc: VietnameseSubject.AM_NHAC,
    nhật: VietnameseSubject.TIENG_NHAT,
    pe: VietnameseSubject.THE_DUC,
    pháp: VietnameseSubject.TIENG_PHAP,
    "physical education": VietnameseSubject.THE_DUC,
    physics: VietnameseSubject.VAT_LY,
    "quốc phòng": VietnameseSubject.GDQP,
    russian: VietnameseSubject.TIENG_NGA,
    sinh: VietnameseSubject.SINH_HOC,
    "sinh học": VietnameseSubject.SINH_HOC,
    sử: VietnameseSubject.LICH_SU,
    technology: VietnameseSubject.CONG_NGHE,
    "thể dục": VietnameseSubject.THE_DUC,
    "tiếng anh": VietnameseSubject.TIENG_ANH,
    "tiếng đức": VietnameseSubject.TIENG_DUC,
    "tiếng nga": VietnameseSubject.TIENG_NGA,
    "tiếng nhật": VietnameseSubject.TIENG_NHAT,
    "tiếng pháp": VietnameseSubject.TIENG_PHAP,
    "tiếng trung": VietnameseSubject.TIENG_TRUNG,
    tin: VietnameseSubject.TIN_HOC,
    "tin học": VietnameseSubject.TIN_HOC,
    toán: VietnameseSubject.TOAN,
    "toán học": VietnameseSubject.TOAN,
    trung: VietnameseSubject.TIENG_TRUNG,
    văn: VietnameseSubject.VAN,
    "văn học": VietnameseSubject.VAN,
    "vật lí": VietnameseSubject.VAT_LY,
    "vật lý": VietnameseSubject.VAT_LY,
    vẽ: VietnameseSubject.MY_THUAT,
};

/**
 * Subject groups for Vietnamese national university entrance exam
 */
export const SUBJECT_GROUPS = {
    A: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.HOA_HOC,
    ],
    A1: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    B: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.SINH_HOC,
    ],
    C: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.DIA_LY,
    ],
    D: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
    ],
    D1: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D2: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NGA,
    ],
    D3: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D4: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NHAT,
    ],
    D5: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_DUC,
    ],
} as const;

/**
 * Core subjects required for graduation
 */
export const CORE_SUBJECTS = [
    VietnameseSubject.TOAN,
    VietnameseSubject.VAN,
    VietnameseSubject.TIENG_ANH,
    VietnameseSubject.VAT_LY,
    VietnameseSubject.HOA_HOC,
    VietnameseSubject.SINH_HOC,
    VietnameseSubject.LICH_SU,
    VietnameseSubject.DIA_LY,
    VietnameseSubject.GDCD,
] as const;

/**
 * Get subject group that contains the given subjects
 */
export function getSubjectGroup(subjects: VietnameseSubject[]): null | string {
    for (const [groupName, groupSubjects] of Object.entries(SUBJECT_GROUPS)) {
        if (
            groupSubjects.every((groupSubject) =>
                subjects.includes(groupSubject),
            )
        ) {
            return groupName;
        }
    }
    return null;
}

/**
 * Get all possible variations for a subject
 */
export function getSubjectVariations(subject: VietnameseSubject): string[] {
    const variations: string[] = [subject];

    for (const [variation, enumValue] of Object.entries(SUBJECT_VARIATIONS)) {
        if (enumValue === subject) {
            variations.push(variation);
        }
    }

    return variations;
}

/**
 * Check if a subject is a core subject
 */
export function isCoreSubject(subject: VietnameseSubject): boolean {
    return (CORE_SUBJECTS as readonly VietnameseSubject[]).includes(subject);
}

/**
 * Helper function to normalize and match subject names
 */
export function normalizeSubjectName(input: string): null | VietnameseSubject {
    const normalized = input.trim().toLowerCase();

    // Direct enum value match
    for (const subject of Object.values(VietnameseSubject)) {
        if (subject.toLowerCase() === normalized) {
            return subject;
        }
    }

    // Variation match
    const variation = SUBJECT_VARIATIONS[normalized];
    if (variation !== undefined) {
        return variation;
    }

    return null;
}
