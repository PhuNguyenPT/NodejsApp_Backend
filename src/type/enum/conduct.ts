export enum Conduct {
    GOOD = "Tốt",
    NOT_PASSED = "Chưa Đạt",
    PASSED = "Đạt",
    SATISFACTORY = "Khá",
}

export function getRankByConduct(conduct: Conduct): number {
    switch (conduct) {
        case Conduct.GOOD:
            return 1;
        case Conduct.NOT_PASSED:
            return 4;
        case Conduct.PASSED:
            return 3;
        case Conduct.SATISFACTORY:
            return 2;
    }
}
