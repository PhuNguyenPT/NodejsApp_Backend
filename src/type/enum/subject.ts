/**
 * Vietnamese High School Subjects Enum
 * Based on Vietnam's national curriculum and university entrance exam subjects
 */
export enum VietnameseSubject {
    BIEU_DIEN_NGHE_THUAT = "Biểu diễn nghệ thuật",
    DIA_LY = "Địa Lý",
    DOC_DIEN_CAM_HAT = "Đọc diễn cảm, Hát",
    DOC_HIEU = "Đọc hiểu",
    GDCD = "Giáo Dục Công Dân",
    GDKTPL = "Giáo dục Kinh tế và Pháp luật",
    HAT_BIEU_DIEN_NHAC_CU = "Hát hoặc biểu diễn nhạc cụ",
    HINH_HOA = "Hình họa",
    HOA_HOC = "Hóa Học",
    KY_XUONG_AM = "Ký xướng âm",
    LICH_SU = "Lịch Sử",
    NANG_KHIEU = "Năng khiếu",
    NANG_KHIEU_1 = "Năng khiếu 1",
    NANG_KHIEU_2 = "Năng khiếu 2",
    NANG_KHIEU_AM_NHAC_1 = "Năng khiếu Âm nhạc 1",
    NANG_KHIEU_AM_NHAC_2 = "Năng khiếu Âm nhạc 2",
    NANG_KHIEU_BAO_CHI = "Năng khiếu báo chí",
    NANG_KHIEU_MAM_NON_1 = "NK Mầm non 1( kể chuyện, đọc, diễn cảm)",
    NANG_KHIEU_MAM_NON_2 = "NK Mầm non 2 (Hát)",
    NANG_KHIEU_SKDA_1 = "Năng khiếu SKĐA 1",
    NANG_KHIEU_SKDA_2 = "Năng khiếu SKĐA 2",
    NANG_KHIEU_TDTT = "Năng khiếu TDTT",
    NANG_KHIEU_VE = "Vẽ Năng khiếu",
    SINH_HOC = "Sinh Học",
    TIENG_ANH = "Tiếng Anh",
    TIENG_DUC = "Tiếng Đức",
    TIENG_NGA = "Tiếng Nga",
    TIENG_NHAT = "Tiếng Nhật",
    TIENG_PHAP = "Tiếng Pháp",
    TIENG_TRUNG = "Tiếng Trung",
    TOAN = "Toán",
    TRANG_TRI = "Trang trí",
    TU_DUY_GIAI_QUYET_VAN_DE = "Tư duy Khoa học Giải quyết vấn đề",
    VAN = "Ngữ Văn",
    VAT_LY = "Vật Lý",
    VE_HINH_HOA_MY_THUAT = "Vẽ Hình họa mỹ thuật",
    VE_MY_THUAT = "Vẽ Mỹ thuật",
    VE_TRANG_TRI_MAU = "Vẽ trang trí màu",
    XAY_DUNG_KICH_BAN_SU_KIEN = "Xây dựng kịch bản sự kiện",
    XUONG_AM = "Xướng âm",
}

/**
 * Subject name variations mapping for better OCR recognition
 */
export const SUBJECT_VARIATIONS: Partial<Record<string, VietnameseSubject>> = {
    // ... (existing variations)
    "gdkdkt&pl": VietnameseSubject.GDKTPL,
    gdktpl: VietnameseSubject.GDKTPL,
    "giáo dục kinh tế và pháp luật": VietnameseSubject.GDKTPL,
    nktdtt: VietnameseSubject.NANG_KHIEU_TDTT,
    "vẽ mỹ thuật": VietnameseSubject.VE_MY_THUAT,
    // ... (add more variations as needed)
};

/**
 * Subject groups for Vietnamese national university entrance exam
 * Updated based on the provided comprehensive list
 */
export const SUBJECT_GROUPS = {
    // Khối A
    A00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.HOA_HOC,
    ],
    A01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    A02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.SINH_HOC,
    ],
    A03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.LICH_SU,
    ],
    A04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.DIA_LY,
    ],
    A05: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.LICH_SU,
    ],
    A06: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.DIA_LY,
    ],
    A07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.DIA_LY,
    ],
    A08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.GDKTPL,
    ],
    A09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.GDKTPL,
    ],
    A10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.GDKTPL,
    ],
    A11: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.GDKTPL,
    ],

    // Khối B
    B00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.SINH_HOC,
    ],
    B02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.DIA_LY,
    ],
    B03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.VAN,
    ],
    B04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.GDKTPL,
    ],
    B08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_ANH,
    ],

    // Khối C
    C00: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.DIA_LY,
    ],
    C01: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
    ],
    C02: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
    ],
    C03: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
    ],
    C04: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
    ],
    C05: [
        VietnameseSubject.VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.HOA_HOC,
    ],
    C08: [
        VietnameseSubject.VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.SINH_HOC,
    ],
    C12: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.SINH_HOC,
    ],
    C13: [
        VietnameseSubject.VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.DIA_LY,
    ],
    C14: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
    ],
    C17: [
        VietnameseSubject.VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.GDKTPL,
    ],
    C19: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.GDKTPL,
    ],
    C20: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.GDKTPL,
    ],

    // Khối D
    D01: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
    ],
    D02: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NGA,
    ],
    D03: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D04: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D05: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_DUC,
    ],
    D06: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NHAT,
    ],
    D07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_ANH,
    ],
    D10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    D11: [
        VietnameseSubject.VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    D12: [
        VietnameseSubject.VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D13: [
        VietnameseSubject.VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D14: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_ANH,
    ],
    D15: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    D20: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D21: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_DUC,
    ],
    D22: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_NGA,
    ],
    D23: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_NHAT,
    ],
    D24: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_PHAP,
    ],
    D25: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D26: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_DUC,
    ],
    D27: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_NGA,
    ],
    D28: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_NHAT,
    ],
    D29: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_PHAP,
    ],
    D30: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D31: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_DUC,
    ],
    D32: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_NGA,
    ],
    D33: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_NHAT,
    ],
    D34: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_PHAP,
    ],
    D35: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D42: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NGA,
    ],
    D43: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NHAT,
    ],
    D44: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_PHAP,
    ],
    D45: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D55: [
        VietnameseSubject.VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D63: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_NHAT,
    ],
    D64: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_PHAP,
    ],
    D65: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D66: [
        VietnameseSubject.VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_ANH,
    ],
    D68: [
        VietnameseSubject.VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NGA,
    ],
    D70: [
        VietnameseSubject.VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_PHAP,
    ],
    D71: [
        VietnameseSubject.VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D84: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_ANH,
    ],

    // Khối H
    H01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAN,
        VietnameseSubject.VE_MY_THUAT,
    ],
    H02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VE_HINH_HOA_MY_THUAT,
        VietnameseSubject.VE_TRANG_TRI_MAU,
    ],
    H04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_VE,
    ],
    H06: [
        VietnameseSubject.VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.VE_MY_THUAT,
    ],
    H07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HINH_HOA,
        VietnameseSubject.TRANG_TRI,
    ],
    H08: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.VE_MY_THUAT,
    ],

    // Khối khác
    K00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_HIEU,
        VietnameseSubject.TU_DUY_GIAI_QUYET_VAN_DE,
    ],
    // Khối M
    M00: [
        VietnameseSubject.VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_DIEN_CAM_HAT,
    ],
    M01: [
        VietnameseSubject.VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.NANG_KHIEU,
    ],
    M02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU_1,
        VietnameseSubject.NANG_KHIEU_2,
    ],
    M03: [
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_1,
        VietnameseSubject.NANG_KHIEU_2,
    ],
    M04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_DIEN_CAM_HAT,
        VietnameseSubject.DOC_DIEN_CAM_HAT,
    ], // Note: Hát-Múa combined under one for simplicity, can be split
    M09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU_MAM_NON_1,
        VietnameseSubject.NANG_KHIEU_MAM_NON_2,
    ],
    M10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_1,
    ],
    M11: [
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
        VietnameseSubject.TIENG_ANH,
    ],
    M13: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NANG_KHIEU,
    ],

    M14: [
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
        VietnameseSubject.TOAN,
    ],
    // Khối N
    N00: [
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_AM_NHAC_1,
        VietnameseSubject.NANG_KHIEU_AM_NHAC_2,
    ],
    N01: [
        VietnameseSubject.VAN,
        VietnameseSubject.XUONG_AM,
        VietnameseSubject.BIEU_DIEN_NGHE_THUAT,
    ],
    N02: [
        VietnameseSubject.VAN,
        VietnameseSubject.KY_XUONG_AM,
        VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU,
    ],

    N05: [
        VietnameseSubject.VAN,
        VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN,
        VietnameseSubject.NANG_KHIEU,
    ],
    S00: [
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_SKDA_1,
        VietnameseSubject.NANG_KHIEU_SKDA_2,
    ],
    // Khối T
    T00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAN,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T02: [
        VietnameseSubject.VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T03: [
        VietnameseSubject.VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],

    T04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T05: [
        VietnameseSubject.VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    // Khối V
    V02: [
        VietnameseSubject.VE_MY_THUAT,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
    ],
    V03: [
        VietnameseSubject.VE_MY_THUAT,
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
    ],
    V05: [
        VietnameseSubject.VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V06: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.VE_MY_THUAT,
    ],

    V10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_PHAP,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V11: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_TRUNG,
        VietnameseSubject.VE_MY_THUAT,
    ],
} as const;

// The rest of the helper functions remain the same as they operate on the data structures above.

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
export function getSubjectGroup(
    subjects: VietnameseSubject[],
): string | undefined {
    for (const [groupName, groupSubjects] of Object.entries(SUBJECT_GROUPS)) {
        if (
            (groupSubjects as readonly VietnameseSubject[]).every(
                (groupSubject) => subjects.includes(groupSubject),
            )
        ) {
            return groupName;
        }
    }
    return undefined;
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
export function normalizeSubjectName(
    input: string,
): undefined | VietnameseSubject {
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

    return undefined;
}
