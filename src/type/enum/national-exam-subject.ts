import { VietnameseSubject } from "./subject.js";

/**
 * National exam subjects required for graduation
 */
const NationalExamSubjectsArray = [
    VietnameseSubject.TOAN,
    VietnameseSubject.NGU_VAN,
    VietnameseSubject.TIENG_ANH,
    VietnameseSubject.TIENG_DUC,
    VietnameseSubject.TIENG_HAN,
    VietnameseSubject.TIENG_NGA,
    VietnameseSubject.TIENG_NHAT,
    VietnameseSubject.TIENG_PHAP,
    VietnameseSubject.TIENG_TRUNG,
    VietnameseSubject.VAT_LY,
    VietnameseSubject.HOA_HOC,
    VietnameseSubject.SINH_HOC,
    VietnameseSubject.LICH_SU,
    VietnameseSubject.DIA_LY,
    VietnameseSubject.GDKTPL,
    VietnameseSubject.TIN_HOC,
    VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
    VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
] as const;

// Export the array for use in validation messages and loops
export const NationalExamSubjects = NationalExamSubjectsArray;

export type NationalExamSubject = (typeof NationalExamSubjectsArray)[number];

/**
 * Check if a subject is a national subject
 */
export function isNationalExamSubjects(
    subject: VietnameseSubject,
): subject is NationalExamSubject {
    return (NationalExamSubjects as readonly VietnameseSubject[]).includes(
        subject,
    );
}
