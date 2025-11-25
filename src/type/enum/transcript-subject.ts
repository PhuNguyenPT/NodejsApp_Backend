import { VietnameseSubject } from "./subject.js";

export enum TranscriptSubject {
    CONG_NGHE = "Công Nghệ",
    DIA_LY = "Địa Lý",
    GDKTPL = "GDKTPL",
    HOA_HOC = "Hóa Học",
    LICH_SU = "Lịch Sử",
    NGU_VAN = "Ngữ Văn",
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
    VAT_LY = "Vật Lý",
}

export function mapTranscriptSubjectsToVietnameseSubject(
    transcriptSubjects: TranscriptSubject[],
): VietnameseSubject[] {
    const mapping: Record<TranscriptSubject, VietnameseSubject> = {
        [TranscriptSubject.CONG_NGHE]: VietnameseSubject.CONG_NGHE,
        [TranscriptSubject.DIA_LY]: VietnameseSubject.DIA_LY,
        [TranscriptSubject.GDKTPL]: VietnameseSubject.GDKTPL,
        [TranscriptSubject.HOA_HOC]: VietnameseSubject.HOA_HOC,
        [TranscriptSubject.LICH_SU]: VietnameseSubject.LICH_SU,
        [TranscriptSubject.NGU_VAN]: VietnameseSubject.NGU_VAN,
        [TranscriptSubject.SINH_HOC]: VietnameseSubject.SINH_HOC,
        [TranscriptSubject.TIENG_ANH]: VietnameseSubject.TIENG_ANH,
        [TranscriptSubject.TIENG_DUC]: VietnameseSubject.TIENG_DUC,
        [TranscriptSubject.TIENG_HAN]: VietnameseSubject.TIENG_HAN,
        [TranscriptSubject.TIENG_NGA]: VietnameseSubject.TIENG_NGA,
        [TranscriptSubject.TIENG_NHAT]: VietnameseSubject.TIENG_NHAT,
        [TranscriptSubject.TIENG_PHAP]: VietnameseSubject.TIENG_PHAP,
        [TranscriptSubject.TIENG_TRUNG]: VietnameseSubject.TIENG_TRUNG,
        [TranscriptSubject.TIN_HOC]: VietnameseSubject.TIN_HOC,
        [TranscriptSubject.TOAN]: VietnameseSubject.TOAN,
        [TranscriptSubject.VAT_LY]: VietnameseSubject.VAT_LY,
    };

    return transcriptSubjects.map((subject) => mapping[subject]);
}
