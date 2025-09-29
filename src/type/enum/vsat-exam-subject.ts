import { VietnameseSubject } from "./subject.js";

const VsatExamSubjectsArray: VietnameseSubject[] = [
    VietnameseSubject.TOAN,
    VietnameseSubject.NGU_VAN,
    VietnameseSubject.TIENG_ANH,
    VietnameseSubject.VAT_LY,
    VietnameseSubject.HOA_HOC,
    VietnameseSubject.SINH_HOC,
    VietnameseSubject.LICH_SU,
    VietnameseSubject.DIA_LY,
] as const;

export const VsatExamSubjects = VsatExamSubjectsArray;

export type VsatExamSubject = (typeof VsatExamSubjectsArray)[number];

/**
 * Check if a subject is a national subject
 */
export function isVsatExamSubjects(subject: VietnameseSubject): boolean {
    return VsatExamSubjectsArray.includes(subject);
}
