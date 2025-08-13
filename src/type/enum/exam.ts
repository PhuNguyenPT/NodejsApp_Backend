export enum CCNNType {
    IELTS = "IELTS",
    OTHER = "Other",
    TOEFL_CBT = "TOEFL CBT",
    TOEFL_iBT = "TOEFL iBT",
    TOEFL_Paper = "TOEFL Paper",
    TOEIC = "TOEIC",
}

export enum CCQTType {
    ACT = "ACT",
    ALevel = "A-Level",
    DoulingoEnglishTest = "DoulingoEnglishTest",
    IB = "IB",
    OSSD = "OSSD",
    OTHER = "Other",
    PTE = "PTE",
    SAT = "SAT",
}

export enum DGNLType {
    HSA = "HSA",
    OTHER = "Other",
    TSA = "TSA",
    VNUHCM = "VNUHCM",
}

export type ExamType =
    | { type: "CCNN"; value: CCNNType }
    | { type: "CCQT"; value: CCQTType }
    | { type: "DGNL"; value: DGNLType };
