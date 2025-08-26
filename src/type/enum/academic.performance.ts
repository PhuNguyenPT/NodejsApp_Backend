export enum AcademicPerformance {
    GOOD = "Tốt",
    NOT_PASSED = "Chưa Đạt",
    PASSED = "Đạt",
    SATISFACTORY = "Khá",
}

export function getRankByAcademicPerformance(
    academicPerformance: AcademicPerformance,
): number {
    switch (academicPerformance) {
        case AcademicPerformance.GOOD:
            return 1;
        case AcademicPerformance.NOT_PASSED:
            return 4;
        case AcademicPerformance.PASSED:
            return 3;
        case AcademicPerformance.SATISFACTORY:
            return 2;
    }
}
