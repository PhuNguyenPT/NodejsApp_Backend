import { VietnameseSubject } from "./subject.js";

const TalentExamSubjectsArray: VietnameseSubject[] = [
    VietnameseSubject.BIEU_DIEN_NGHE_THUAT,
    VietnameseSubject.DOC_HIEU,
    VietnameseSubject.DOC_KE_DIEN_CAM,
    VietnameseSubject.HAT,
    VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU,
    VietnameseSubject.HAT_MUA,
    VietnameseSubject.HINH_HOA,
    VietnameseSubject.KY_XUONG_AM,
    VietnameseSubject.NANG_KHIEU,
    VietnameseSubject.NANG_KHIEU_1,
    VietnameseSubject.NANG_KHIEU_2,
    VietnameseSubject.NANG_KHIEU_AM_NHAC_1,
    VietnameseSubject.NANG_KHIEU_AM_NHAC_2,
    VietnameseSubject.NANG_KHIEU_BAO_CHI,
    VietnameseSubject.NANG_KHIEU_MAM_NON_1,
    VietnameseSubject.NANG_KHIEU_MAM_NON_2,
    VietnameseSubject.NANG_KHIEU_SKDA_1,
    VietnameseSubject.NANG_KHIEU_SKDA_2,
    VietnameseSubject.NANG_KHIEU_TDTT,
    VietnameseSubject.NANG_KHIEU_VE,
    VietnameseSubject.TRANG_TRI,
    VietnameseSubject.TU_DUY_GIAI_QUYET_NGU_VAN_DE,
    VietnameseSubject.VE_HINH_HOA_MY_THUAT,
    VietnameseSubject.VE_MY_THUAT,
    VietnameseSubject.VE_TRANG_TRI_MAU,
    VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN,
    VietnameseSubject.XUONG_AM,
] as const;

// Export the array for use in validation messages and loops
export const TalentExamSubjects = TalentExamSubjectsArray;

// Export the type for TypeScript type checking
export type TalentExamSubject = (typeof TalentExamSubjectsArray)[number];

/**
 * Check if a subject is a talent exam subject
 */
export function isTalentExamSubjects(subject: VietnameseSubject): boolean {
    return TalentExamSubjectsArray.includes(subject);
}
