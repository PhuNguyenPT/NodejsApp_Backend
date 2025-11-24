import { VietnameseSubject } from "./subject.js";

const TalentExamSubjectsArray = [
    VietnameseSubject.BIEU_DIEN_NGHE_THUAT,
    VietnameseSubject.CHI_HUY_TAI_CHO,
    VietnameseSubject.CHUYEN_MON_AM_NHAC,
    VietnameseSubject.CHUYEN_MON_AM_NHAC_1,
    VietnameseSubject.CHUYEN_MON_AM_NHAC_2,
    VietnameseSubject.DOC_DIEN_CAM,
    VietnameseSubject.DOC_HIEU,
    VietnameseSubject.GHI_AM_XUONG_AM,
    VietnameseSubject.HAT,
    VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU,
    VietnameseSubject.HAT_MUA,
    VietnameseSubject.HAT_XUONG_AM,
    VietnameseSubject.HOA_THANH,
    VietnameseSubject.KY_XUONG_AM,
    VietnameseSubject.NANG_KHIEU,
    VietnameseSubject.NANG_KHIEU_1,
    VietnameseSubject.NANG_KHIEU_2,
    VietnameseSubject.NANG_KHIEU_AM_NHAC_1,
    VietnameseSubject.NANG_KHIEU_AM_NHAC_2,
    VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI,
    VietnameseSubject.NANG_KHIEU_BAO_CHI,
    VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT,
    VietnameseSubject.NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT,
    VietnameseSubject.NANG_KHIEU_MAM_NON,
    VietnameseSubject.NANG_KHIEU_MAM_NON_1,
    VietnameseSubject.NANG_KHIEU_MAM_NON_2,
    VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH,
    VietnameseSubject.NANG_KHIEU_SKDA_1,
    VietnameseSubject.NANG_KHIEU_SKDA_2,
    VietnameseSubject.NANG_KHIEU_TDTT,
    VietnameseSubject.NANG_KHIEU_THUYET_TRINH,
    VietnameseSubject.NANG_KHIEU_VE_1,
    VietnameseSubject.NANG_KHIEU_VE_2,
    VietnameseSubject.PHAT_TRIEN_CHU_DE_PHO_THO,
    VietnameseSubject.TU_DUY_GIAI_QUYET_NGU_VAN_DE,
    VietnameseSubject.VE_HINH_HOA,
    VietnameseSubject.VE_HINH_HOA_MY_THUAT,
    VietnameseSubject.VE_MY_THUAT,
    VietnameseSubject.VE_NANG_KHIEU,
    VietnameseSubject.VE_TRANG_TRI,
    VietnameseSubject.VE_TRANG_TRI_MAU,
    VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN,
] as const;

// Export the array for use in validation messages and loops
export const TalentExamSubjects = TalentExamSubjectsArray;

// Export the type for TypeScript type checking
export type TalentExamSubject = (typeof TalentExamSubjectsArray)[number];

/**
 * Check if a subject is a talent exam subject
 */
export function isTalentExamSubjects(
    subject: VietnameseSubject,
): subject is TalentExamSubject {
    return (TalentExamSubjectsArray as readonly VietnameseSubject[]).includes(
        subject,
    );
}
