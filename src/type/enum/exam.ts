export enum CCNNType {
    IELTS = "IELTS",
    OTHER = "Other",
    TOEFL_CBT = "TOEFL CBT",
    TOEFL_iBT = "TOEFL iBT",
    TOEFL_Paper = "TOEFL Paper",
    TOEIC = "TOEIC",
}

export enum CCQTType {
    "A-Level" = "Alevel",
    ACT = "ACT",
    "Duolingo English Test" = "DoulingoEnglishTest",
    IB = "IB",
    OSSD = "OSSD",
    OTHER = "Other",
    "PTE Academic" = "PTEAcademic",
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
