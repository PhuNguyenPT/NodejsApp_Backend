/**
 * Vietnamese High School Subjects Enum
 * Based on Vietnam's national curriculum and university entrance exam subjects
 */
export enum VietnameseSubject {
    BIEU_DIEN_NGHE_THUAT = "Biểu diễn nghệ thuật",
    CHI_HUY_TAI_CHO = "Chỉ huy tại chỗ",
    CHUNG_CHI_QUY_DOI_TIENG_ANH = "Chứng chỉ tiếng Anh (đã quy đổi điểm)",
    CHUYEN_MON_AM_NHAC = "Chuyên môn âm nhạc",
    CHUYEN_MON_AM_NHAC_1 = "Chuyên môn âm nhạc 1",
    CHUYEN_MON_AM_NHAC_2 = "Chuyên môn âm nhạc 2",
    CONG_NGHE = "Công Nghệ",
    CONG_NGHE_CONG_NGHIEP = "Công nghệ Công nghiệp",
    CONG_NGHE_NONG_NGHIEP = "Công nghệ Nông nghiệp",
    DIA_LY = "Địa Lý",
    DOC_DIEN_CAM = "Đọc diễn cảm",
    DOC_HIEU = "Đọc hiểu",
    GDKTPL = "Giáo dục Kinh tế và Pháp luật",
    GHI_AM_XUONG_AM = "Ghi âm - xướng âm",
    HAT = "Hát",
    HAT_BIEU_DIEN_NHAC_CU = "Hát hoặc biểu diễn nhạc cụ",
    HAT_MUA = "Hát - Múa",
    HAT_XUONG_AM = "Hát xướng âm",
    HOA_HOC = "Hóa Học",
    HOA_THANH = "Hòa thanh",
    KHOA_HOC_TU_NHIEN = "Khoa học tự nhiên",
    KHOA_HOC_XA_HOI = "Khoa học xã hội",
    KY_XUONG_AM = "Ký xướng âm",
    LICH_SU = "Lịch Sử",
    NANG_KHIEU = "Năng khiếu",
    NANG_KHIEU_1 = "Năng khiếu 1",
    NANG_KHIEU_2 = "Năng khiếu 2",
    NANG_KHIEU_AM_NHAC_1 = "Năng khiếu Âm nhạc 1 (Hát, xướng âm)",
    NANG_KHIEU_AM_NHAC_2 = "Năng khiếu Âm nhạc 2 (Thẩm âm, tiết tất)",
    NANG_KHIEU_ANH_BAO_CHI = "Năng khiếu ảnh báo chí",
    NANG_KHIEU_BAO_CHI = "Năng khiếu báo chí",
    NANG_KHIEU_BIEU_DIEN_NGHE_THUAT = "Năng khiếu Biểu diễn nghệ thuật",
    NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT = "Năng khiếu Kiến thức văn hóa - xã hội - nghệ thuật",
    NANG_KHIEU_MAM_NON = "Năng khiếu Mầm non",
    NANG_KHIEU_MAM_NON_1 = "Năng khiếu Mầm non 1(Kể chuyện, đọc, diễn cảm)",
    NANG_KHIEU_MAM_NON_2 = "Năng khiếu Mầm non 2 (Hát)",
    NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH = "Năng khiếu quay phim truyền hình",
    NANG_KHIEU_SKDA_1 = "Năng khiếu SKĐA 1",
    NANG_KHIEU_SKDA_2 = "Năng khiếu SKĐA 2",
    NANG_KHIEU_TDTT = "Năng khiếu TDTT",
    NANG_KHIEU_THUYET_TRINH = "Năng khiếu thuyết trình",
    NANG_KHIEU_VE_1 = "Năng khiếu Vẽ Nghệ thuật 1",
    NANG_KHIEU_VE_2 = "Năng khiếu Vẽ Nghệ thuật 2",
    NGU_VAN = "Ngữ Văn",
    PHAT_TRIEN_CHU_DE_PHO_THO = "Phát triển chủ đề và phổ thơ",
    SINH_HOC = "Sinh Học",
    TIENG_ANH = "Tiếng Anh",
    TIENG_DUC = "Tiếng Đức",
    TIENG_HAN = "Tiếng Hàn",
    TIENG_NGA = "Tiếng Nga",
    TIENG_NHAT = "Tiếng Nhật",
    TIENG_PHAP = "Tiếng Pháp",
    TIENG_TRUNG = "Tiếng Trung",
    TIN_HOC = "Tin Học",
    TOAN = "Toán",
    TU_DUY_GIAI_QUYET_NGU_VAN_DE = "Tư duy Khoa học Giải quyết vấn đề",
    VAT_LY = "Vật Lý",
    VE_HINH_HOA = "Vẽ Hình họa",
    VE_HINH_HOA_MY_THUAT = "Vẽ Hình họa mỹ thuật",
    VE_MY_THUAT = "Vẽ Mỹ thuật",
    VE_NANG_KHIEU = "Vẽ Năng Khiếu",
    VE_TRANG_TRI = "Vẽ trang trí",
    VE_TRANG_TRI_MAU = "Vẽ trang trí màu",
    XAY_DUNG_KICH_BAN_SU_KIEN = "Xây dựng kịch bản sự kiện",
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
    A12: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
    ],
    A14: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.DIA_LY,
    ],
    A15: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.GDKTPL,
    ],
    A16: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.NGU_VAN,
    ],
    A17: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.VAT_LY,
    ],
    A18: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.HOA_HOC,
    ],

    // Khối B
    B00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.SINH_HOC,
    ],
    B01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.LICH_SU,
    ],
    B02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.DIA_LY,
    ],
    B03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NGU_VAN,
    ],
    B04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.GDKTPL,
    ],
    B05: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.KHOA_HOC_XA_HOI,
    ],
    B08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_ANH,
    ],

    // Khối C
    C00: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.DIA_LY,
    ],
    C01: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
    ],
    C02: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
    ],
    C03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
    ],
    C04: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
    ],
    C05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.HOA_HOC,
    ],
    C06: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.SINH_HOC,
    ],
    C07: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.LICH_SU,
    ],
    C08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.SINH_HOC,
    ],
    C09: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.DIA_LY,
    ],
    C10: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.LICH_SU,
    ],
    C12: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.LICH_SU,
    ],
    C13: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.DIA_LY,
    ],
    C14: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
    ],
    C15: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
    ],
    C16: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.GDKTPL,
    ],
    C17: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.GDKTPL,
    ],
    C18: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.GDKTPL,
    ],
    C19: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.GDKTPL,
    ],
    C20: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.GDKTPL,
    ],

    // Khối D
    D01: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
    ],
    D02: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NGA,
    ],
    D03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D04: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_DUC,
    ],
    D06: [
        VietnameseSubject.NGU_VAN,
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
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    D12: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D13: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIENG_ANH,
    ],
    D14: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_ANH,
    ],
    D15: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_ANH,
    ],
    D16: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_DUC,
    ],
    D17: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NGA,
    ],
    D18: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NHAT,
    ],
    D19: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_PHAP,
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
    D41: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_DUC,
    ],
    D42: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NGA,
    ],
    D43: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_NHAT,
    ],
    D44: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_PHAP,
    ],
    D45: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D51: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_DUC,
    ],
    D52: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_NGA,
    ],
    D53: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_NHAT,
    ],
    D54: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_PHAP,
    ],
    D55: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D56: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_DUC,
    ],
    D57: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NGA,
    ],
    D58: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NHAT,
    ],
    D59: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D60: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D61: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_DUC,
    ],
    D62: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_NGA,
    ],
    D63: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_NHAT,
    ],
    D64: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_PHAP,
    ],
    D65: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D66: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_ANH,
    ],
    D68: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NGA,
    ],
    D70: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_PHAP,
    ],
    D71: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D72: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_ANH,
    ],
    D73: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_DUC,
    ],
    D74: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_NGA,
    ],
    D75: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_NHAT,
    ],
    D76: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D77: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D78: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_ANH,
    ],
    D79: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_DUC,
    ],
    D80: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_NGA,
    ],
    D81: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_NHAT,
    ],
    D82: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_PHAP,
    ],
    D83: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D84: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_ANH,
    ],
    D85: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_DUC,
    ],
    D86: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NGA,
    ],
    D87: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_PHAP,
    ],
    D88: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NHAT,
    ],
    D89: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D90: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_ANH,
    ],
    D91: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_PHAP,
    ],
    D92: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_DUC,
    ],
    D93: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_NGA,
    ],
    D94: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_NHAT,
    ],
    D95: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.TIENG_TRUNG,
    ],
    D96: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_ANH,
    ],
    D97: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_PHAP,
    ],
    D98: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_DUC,
    ],
    D99: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_NGA,
    ],
    DD0: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_NHAT,
    ],
    DD1: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.TIENG_TRUNG,
    ],
    DD2: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_HAN,
    ],
    DH1: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIENG_HAN,
    ],

    // Khối H
    H00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU_VE_1,
        VietnameseSubject.NANG_KHIEU_VE_2,
    ],
    H01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VE_MY_THUAT,
    ],
    H02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VE_HINH_HOA_MY_THUAT,
        VietnameseSubject.VE_TRANG_TRI_MAU,
    ],
    H03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.VE_TRANG_TRI_MAU,
    ],
    H04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.VE_NANG_KHIEU,
    ],
    H05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.VE_NANG_KHIEU,
    ],
    H06: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.VE_MY_THUAT,
    ],
    H07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VE_HINH_HOA,
        VietnameseSubject.VE_TRANG_TRI,
    ],
    H08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.VE_MY_THUAT,
    ],

    // Khối khác
    K00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_HIEU,
        VietnameseSubject.TU_DUY_GIAI_QUYET_NGU_VAN_DE,
    ],

    // Khối M
    M00: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_DIEN_CAM,
        VietnameseSubject.HAT,
    ],
    M01: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.NANG_KHIEU,
    ],
    M02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU_1,
        VietnameseSubject.NANG_KHIEU_2,
    ],
    M03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_1,
        VietnameseSubject.NANG_KHIEU_2,
    ],
    M04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DOC_DIEN_CAM,
        VietnameseSubject.HAT_MUA,
    ],
    M05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.NANG_KHIEU,
    ],
    M06: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU,
    ],
    M07: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU,
    ],
    M08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_1,
        VietnameseSubject.NANG_KHIEU_2,
    ],
    M09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NANG_KHIEU_MAM_NON_1,
        VietnameseSubject.NANG_KHIEU_MAM_NON_2,
    ],
    M10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_MAM_NON,
    ],
    M11: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_MAM_NON,
    ],
    M13: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NANG_KHIEU_MAM_NON,
    ],
    M14: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_MAM_NON,
    ],

    // Khối N
    N00: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_AM_NHAC_1,
        VietnameseSubject.NANG_KHIEU_AM_NHAC_2,
    ],
    N01: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HAT_XUONG_AM,
        VietnameseSubject.BIEU_DIEN_NGHE_THUAT,
    ],
    N02: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KY_XUONG_AM,
        VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU,
    ],
    N03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GHI_AM_XUONG_AM,
        VietnameseSubject.CHUYEN_MON_AM_NHAC,
    ],
    N04: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_THUYET_TRINH,
        VietnameseSubject.NANG_KHIEU,
    ],
    N05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN,
        VietnameseSubject.NANG_KHIEU,
    ],
    N06: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GHI_AM_XUONG_AM,
        VietnameseSubject.CHUYEN_MON_AM_NHAC_1,
    ],
    N07: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GHI_AM_XUONG_AM,
        VietnameseSubject.CHUYEN_MON_AM_NHAC_2,
    ],
    N08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_THANH,
        VietnameseSubject.PHAT_TRIEN_CHU_DE_PHO_THO,
    ],
    N09: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_THANH,
        VietnameseSubject.CHI_HUY_TAI_CHO,
    ],

    // Khối R
    R00: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R01: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT,
    ],
    R02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT,
    ],
    R03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT,
    ],
    R04: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT,
        VietnameseSubject.NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT,
    ],
    R05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R06: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    ],
    R08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    ],
    R09: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    ],
    R11: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    ],
    R12: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    ],
    R13: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    ],
    R15: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R16: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R17: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    ],
    R18: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    ],
    R19: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_BAO_CHI,
    ],
    R20: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    ],
    R21: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    ],
    R22: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
    ],
    R23: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
    ],
    R24: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
    ],
    R25: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_TU_NHIEN,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
    ],
    R26: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.KHOA_HOC_XA_HOI,
        VietnameseSubject.CHUNG_CHI_QUY_DOI_TIENG_ANH,
    ],

    // Khối S
    S00: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_SKDA_1,
        VietnameseSubject.NANG_KHIEU_SKDA_2,
    ],
    S01: [
        VietnameseSubject.TOAN,
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
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T02: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T03: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],

    T04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T06: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T07: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],
    T10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.NANG_KHIEU_TDTT,
    ],

    // Khối V
    V00: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V05: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V06: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_DUC,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NGA,
        VietnameseSubject.VE_MY_THUAT,
    ],
    V09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_NHAT,
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
    X01: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
    ],
    X02: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIN_HOC,
    ],
    X03: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X04: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X05: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.GDKTPL,
    ],
    X06: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIN_HOC,
    ],
    X07: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X08: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X09: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.GDKTPL,
    ],
    X10: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIN_HOC,
    ],
    X11: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X12: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X13: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.GDKTPL,
    ],
    X14: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIN_HOC,
    ],
    X15: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X16: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X17: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.GDKTPL,
    ],
    X18: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIN_HOC,
    ],
    X19: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X20: [
        VietnameseSubject.TOAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X21: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.GDKTPL,
    ],
    X22: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIN_HOC,
    ],
    X23: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X24: [
        VietnameseSubject.TOAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X25: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.GDKTPL,
    ],
    X26: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.TIN_HOC,
    ],
    X27: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X28: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X29: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NGA,
    ],
    X33: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_PHAP,
    ],
    X45: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NHAT,
    ],
    X46: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIN_HOC,
        VietnameseSubject.TIENG_NHAT,
    ],
    X53: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIN_HOC,
    ],
    X54: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X55: [
        VietnameseSubject.TOAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X56: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIN_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X57: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIN_HOC,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X58: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.GDKTPL,
    ],
    X59: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIN_HOC,
    ],
    X60: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X61: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X62: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.GDKTPL,
    ],
    X63: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.TIN_HOC,
    ],
    X64: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X65: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X66: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.GDKTPL,
    ],
    X67: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIN_HOC,
    ],
    X68: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X69: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X70: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.GDKTPL,
    ],
    X71: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.TIN_HOC,
    ],
    X72: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X73: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.LICH_SU,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X74: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.GDKTPL,
    ],
    X75: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.TIN_HOC,
    ],
    X76: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X77: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.DIA_LY,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X78: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_ANH,
    ],
    X79: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.TIN_HOC,
    ],
    X80: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    X81: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
    X86: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_PHAP,
    ],
    X90: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_TRUNG,
    ],
    X91: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIN_HOC,
        VietnameseSubject.TIENG_TRUNG,
    ],
    X98: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIENG_NHAT,
    ],
    Y07: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.TIN_HOC,
    ],
    Y08: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    Y09: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.GDKTPL,
        VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
    ],
} as const;

// The rest of the helper functions remain the same as they operate on the data structures above.

/**
 * Type representing all possible subject group keys
 * This ensures type safety when working with subject group names
 */
export type SubjectGroupKey = keyof typeof SUBJECT_GROUPS;
/**
 * Type representing the subjects in any group
 */
export type SubjectGroupSubjects = (typeof SUBJECT_GROUPS)[SubjectGroupKey];

/**
 * Helper type to get subjects for a specific group
 */
export type SubjectsForGroup<T extends SubjectGroupKey> =
    (typeof SUBJECT_GROUPS)[T];
/**
 * User-defined subject group combinations
 * These are custom groups that don't follow the standard A/B/C/D/H/M/N/S/T/V naming convention
 */
export const USER_DEFINED_GROUPS: Partial<
    Record<string, readonly VietnameseSubject[]>
> = {
    // Note: TAC, THC, TLC have flexible 3rd subject (either Công nghiệp or Nông nghiệp)
    // This is handled in the matching logic
    TAC: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    TAT: [
        VietnameseSubject.TOAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.TIN_HOC,
    ],
    THC: [
        VietnameseSubject.TOAN,
        VietnameseSubject.HOA_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    TLC: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    TLT: [
        VietnameseSubject.TOAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIN_HOC,
    ],
    TSC: [
        VietnameseSubject.TOAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    TVC: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
    TVL: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.VAT_LY,
        VietnameseSubject.TIN_HOC,
    ],
    TVS: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.TIN_HOC,
    ],
    TVT: [
        VietnameseSubject.TOAN,
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIN_HOC,
    ],
    VAT: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.TIENG_ANH,
        VietnameseSubject.TIN_HOC,
    ],
    VSC: [
        VietnameseSubject.NGU_VAN,
        VietnameseSubject.SINH_HOC,
        VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    ],
} as const;

export type UserDefinedSubjectGroupKey = keyof typeof USER_DEFINED_GROUPS;

/**
 * Special matching rules for user-defined groups with flexible subject requirements
 * Maps group key to array of [required subjects, alternative subjects for specific positions]
 */

/**
 * Special matching rules for user-defined groups with flexible subject requirements
 * Maps group key to array of [required subjects, alternative subjects for specific positions]
 */
const USER_DEFINED_GROUP_FLEXIBLE_RULES: Partial<
    Record<
        string,
        {
            alternatives: Map<number, readonly VietnameseSubject[]>;
            required: readonly VietnameseSubject[];
        }
    >
> = {
    TAC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.TOAN,
            VietnameseSubject.TIENG_ANH,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
    THC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.TOAN,
            VietnameseSubject.HOA_HOC,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
    TLC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.TOAN,
            VietnameseSubject.VAT_LY,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
    TSC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.TOAN,
            VietnameseSubject.SINH_HOC,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
    TVC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.TOAN,
            VietnameseSubject.NGU_VAN,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
    VSC: {
        alternatives: new Map([
            [
                2,
                [
                    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                ],
            ],
        ]),
        required: [
            VietnameseSubject.NGU_VAN,
            VietnameseSubject.SINH_HOC,
            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
        ],
    },
};

/**
 * Get all possible subject groups (both standard and user-defined) that can be formed from the given subjects
 * This function finds all groups where the group's subjects are a subset of the input subjects
 */
export function getAllPossibleSubjectGroups(
    subjects: VietnameseSubject[],
    options: {
        includeStandard?: boolean;
        includeUserDefined?: boolean;
    } = { includeStandard: true, includeUserDefined: true },
): string[] {
    const possibleGroups: string[] = [];

    // Check standard groups
    if (options.includeStandard !== false) {
        for (const [groupKey, groupSubjects] of Object.entries(
            SUBJECT_GROUPS,
        ) as [SubjectGroupKey, readonly VietnameseSubject[]][]) {
            if (
                groupSubjects.every((groupSubject) =>
                    subjects.includes(groupSubject),
                )
            ) {
                possibleGroups.push(groupKey);
            }
        }
    }

    // Check user-defined groups with flexible matching
    if (options.includeUserDefined !== false) {
        for (const [groupKey, groupSubjects] of Object.entries(
            USER_DEFINED_GROUPS,
        )) {
            if (
                groupSubjects &&
                matchesUserDefinedGroupWithFlexibleRules(
                    groupKey,
                    groupSubjects,
                    subjects,
                )
            ) {
                possibleGroups.push(groupKey);
            }
        }
    }

    return possibleGroups;
}

/**
 * Get all subject group keys as a typed array
 */
export function getAllSubjectGroupKeys(): SubjectGroupKey[] {
    return Object.keys(SUBJECT_GROUPS) as SubjectGroupKey[];
}

/**
 * Get subjects for a given group (works for both standard and user-defined groups)
 */
export function getGroupSubjects(
    groupKey: string,
): readonly VietnameseSubject[] | undefined {
    if (isStandardGroup(groupKey)) {
        return SUBJECT_GROUPS[groupKey];
    }
    if (isUserDefinedGroup(groupKey)) {
        return USER_DEFINED_GROUPS[groupKey];
    }
    return undefined;
}

/**
 * Get only standard subject groups that can be formed from the given subjects
 */
export function getStandardSubjectGroups(
    subjects: VietnameseSubject[],
): SubjectGroupKey[] {
    return getAllPossibleSubjectGroups(subjects, {
        includeStandard: true,
        includeUserDefined: false,
    }) as SubjectGroupKey[];
}

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
 * Get subject group key that contains the given subjects (checks both standard and user-defined)
 * Returns the first matching group found
 */
export function getSubjectGroupKey(
    subjects: VietnameseSubject[],
    options: {
        preferStandard?: boolean;
    } = { preferStandard: true },
): string | undefined {
    const checkStandard = () => {
        for (const [groupKey, groupSubjects] of Object.entries(
            SUBJECT_GROUPS,
        ) as [SubjectGroupKey, readonly VietnameseSubject[]][]) {
            if (
                groupSubjects.length === subjects.length &&
                groupSubjects.every((groupSubject) =>
                    subjects.includes(groupSubject),
                )
            ) {
                return groupKey;
            }
        }
        return undefined;
    };

    const checkUserDefined = () => {
        for (const [groupKey, groupSubjects] of Object.entries(
            USER_DEFINED_GROUPS,
        )) {
            if (!groupSubjects) continue;

            // Check if length matches
            if (groupSubjects.length !== subjects.length) continue;

            // Use flexible matching for groups with special rules
            if (
                matchesUserDefinedGroupWithFlexibleRules(
                    groupKey,
                    groupSubjects,
                    subjects,
                )
            ) {
                return groupKey;
            }
        }
        return undefined;
    };

    if (options.preferStandard) {
        return checkStandard() ?? checkUserDefined();
    } else {
        return checkUserDefined() ?? checkStandard();
    }
}

/**
 * Type-safe subject group lookup
 */
export function getSubjectGroupSubjects(
    groupKey: SubjectGroupKey,
): readonly VietnameseSubject[] {
    return SUBJECT_GROUPS[groupKey];
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
 * Get only user-defined subject groups that can be formed from the given subjects
 */
export function getUserDefinedSubjectGroups(
    subjects: VietnameseSubject[],
): string[] {
    return getAllPossibleSubjectGroups(subjects, {
        includeStandard: false,
        includeUserDefined: true,
    });
}

/**
 * Check if a group key belongs to standard subject groups
 */
export function isStandardGroup(groupKey: string): groupKey is SubjectGroupKey {
    return groupKey in SUBJECT_GROUPS;
}

/**
 * Check if a group key belongs to user-defined groups
 */
export function isUserDefinedGroup(
    groupKey: string,
): groupKey is UserDefinedSubjectGroupKey {
    return groupKey in USER_DEFINED_GROUPS;
}

/**
 * Type guard to check if a group key is valid (either standard or user-defined)
 */
export function isValidSubjectGroupKey(key: string): boolean {
    return isStandardGroup(key) || isUserDefinedGroup(key);
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

/**
 * Check if a user-defined group matches the given subjects with flexible rules
 */
function matchesUserDefinedGroupWithFlexibleRules(
    groupKey: string,
    groupSubjects: readonly VietnameseSubject[],
    availableSubjects: VietnameseSubject[],
): boolean {
    // Check if this group has flexible matching rules
    const flexibleRule = USER_DEFINED_GROUP_FLEXIBLE_RULES[groupKey];

    if (!flexibleRule) {
        // No flexible rules, use standard matching
        return groupSubjects.every((subject) =>
            availableSubjects.includes(subject),
        );
    }

    // Apply flexible matching
    for (let i = 0; i < flexibleRule.required.length; i++) {
        const requiredSubject = flexibleRule.required[i];
        const alternatives = flexibleRule.alternatives.get(i);

        if (alternatives) {
            // This position accepts alternatives - check if ANY alternative is present
            const hasAlternative = alternatives.some((alt) =>
                availableSubjects.includes(alt),
            );
            if (!hasAlternative) {
                return false;
            }
        } else {
            // This position requires exact match
            if (!availableSubjects.includes(requiredSubject)) {
                return false;
            }
        }
    }

    return true;
}
