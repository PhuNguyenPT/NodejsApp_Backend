import { injectable } from "inversify";

import { HTTPValidationError } from "@/dto/prediction/validation-error.dto.js";
import { AptitudeExamDTO } from "@/dto/student/aptitude-exam-dto.js";
import { StudentInfoDTO } from "@/dto/student/student-dto.js";
import { ExamType } from "@/type/enum/exam.js";
import {
    getAllPossibleSubjectGroups,
    SUBJECT_GROUPS,
    SubjectGroupKey,
    VietnameseSubject,
} from "@/type/enum/subject.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VsatExamSubject } from "@/type/enum/vsat-exam-subject.js";

export interface ExamScenario {
    diem_chuan: number;
    to_hop_mon: string;
    type: "ccqt" | "dgnl" | "national" | "talent" | "vsat";
}

export interface SubjectGroupScore {
    groupName: string;
    scoreBreakdown: { score: number; subject: VietnameseSubject }[];
    subjects: VietnameseSubject[];
    totalScore: number;
}

@injectable()
export class PredictionUtil {
    public collectExamScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios = [
            ...this._createNationalScenarios(studentInfoDTO),
            ...this._createVsatScenarios(studentInfoDTO),
            ...this._createDgnlScenarios(studentInfoDTO),
            ...this._createCcqtScenarios(studentInfoDTO),
            ...this._createTalentScenarios(studentInfoDTO),
        ];

        return scenarios;
    }

    public isValidationError(data: unknown): data is HTTPValidationError {
        return (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            Array.isArray((data as HTTPValidationError).detail)
        );
    }

    public mapUniTypeToBinaryFlag(uniType: UniType): number {
        switch (uniType) {
            case UniType.PRIVATE:
                return 0;
            case UniType.PUBLIC:
                return 1;
        }
    }

    private _createCcqtScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (studentInfoDTO.hasCertificationExamType("CCQT")) {
            const ccqtCerts =
                studentInfoDTO.getCertificationsByExamType("CCQT");

            return ccqtCerts.reduce<ExamScenario[]>((acc, cert) => {
                const score = this.getAndValidateScoreByCCQT(
                    cert.examType,
                    cert.level,
                );

                if (score !== undefined) {
                    acc.push({
                        diem_chuan: score,
                        to_hop_mon: cert.examType,
                        type: "ccqt",
                    });
                }
                return acc;
            }, []);
        }
        return [];
    }

    private _createDgnlScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const dgnlTests: AptitudeExamDTO[] =
            studentInfoDTO.getAptitudeTestScoresByExamType("ĐGNL");

        return dgnlTests.map((test) => ({
            diem_chuan: test.score,
            to_hop_mon: test.examType,
            type: "dgnl",
        }));
    }

    private _createNationalScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        if (!studentInfoDTO.hasValidNationalExam()) {
            return scenarios;
        }

        const subjectGroupScores: SubjectGroupScore[] =
            this.calculateSubjectGroupScores(studentInfoDTO);

        // Filter to only groups that can be formed with national exam subjects only
        const nationalSubjects = new Set<VietnameseSubject>(
            studentInfoDTO.nationalExams.map((e) => e.name),
        );
        const nationalOnlyGroups = subjectGroupScores.filter((group) =>
            group.subjects.every((subject) => nationalSubjects.has(subject)),
        );

        scenarios.push(
            ...nationalOnlyGroups.map((group) => ({
                diem_chuan: group.totalScore,
                to_hop_mon: group.groupName,
                type: "national" as const,
            })),
        );

        return scenarios;
    }

    private _createTalentScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (
            !studentInfoDTO.talentExams ||
            studentInfoDTO.talentExams.length === 0
        ) {
            return [];
        }

        const subjectGroupScores =
            this.calculateSubjectGroupScores(studentInfoDTO);

        const talentSubjects = new Set<VietnameseSubject>(
            studentInfoDTO.talentExams.map((t) => t.name),
        );

        const talentScenarios = subjectGroupScores
            .filter((group) =>
                group.subjects.some((subject) => talentSubjects.has(subject)),
            )
            .map((group) => ({
                diem_chuan: group.totalScore,
                to_hop_mon: group.groupName,
                type: "talent" as const,
            }));

        return talentScenarios;
    }

    private _createVsatScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        if (!studentInfoDTO.hasValidVSATScores()) {
            return scenarios;
        }

        // Create a map of VSAT subject scores for quick lookup
        const vsatScoreMap = new Map<VsatExamSubject, number>();
        studentInfoDTO.vsatExams?.forEach((exam) => {
            vsatScoreMap.set(exam.name, exam.score);
        });

        // Get VSAT subjects and calculate possible subject groups from VSAT data
        const vsatSubjects: VietnameseSubject[] =
            studentInfoDTO.vsatExams?.map((exam) => exam.name) ?? [];
        const vsatPossibleGroups: SubjectGroupKey[] =
            getAllPossibleSubjectGroups(vsatSubjects);

        // Filter to only the specified groups
        const allowedVsatGroups: SubjectGroupKey[] = [
            "A00",
            "A01",
            "D01",
            "D07",
            "C01",
            "D10",
        ];

        for (const subjectGroup of vsatPossibleGroups) {
            if (!allowedVsatGroups.includes(subjectGroup)) {
                continue;
            }

            const groupSubjects = SUBJECT_GROUPS[subjectGroup];

            // Calculate the sum of scores for the 3 subjects in this group
            let totalScore = 0;
            let hasAllSubjects = true;

            for (const subject of groupSubjects) {
                const score = vsatScoreMap.get(subject as VsatExamSubject);
                if (score === undefined) {
                    hasAllSubjects = false;
                    break;
                }
                totalScore += score;
            }

            // Only include if all 3 subjects are available
            if (hasAllSubjects) {
                scenarios.push({
                    diem_chuan: totalScore,
                    to_hop_mon: subjectGroup,
                    type: "vsat" as const,
                });
            }
        }

        return scenarios;
    }

    private calculateSubjectGroupScores(
        studentInfoDTO: StudentInfoDTO,
    ): SubjectGroupScore[] {
        // Combine all available subjects from national exams and talent scores
        const subjectScoreMap = new Map<VietnameseSubject, number>();

        // Add national exam scores (higher priority)
        studentInfoDTO.nationalExams.forEach((exam) => {
            subjectScoreMap.set(exam.name, exam.score);
        });

        // Add talent scores (only if not already present from national exams)
        studentInfoDTO.talentExams?.forEach((talent) => {
            if (!subjectScoreMap.has(talent.name)) {
                subjectScoreMap.set(talent.name, talent.score);
            }
        });

        const availableSubjects = Array.from(subjectScoreMap.keys());
        const possibleSubjectGroups =
            getAllPossibleSubjectGroups(availableSubjects);

        const subjectGroupScores: SubjectGroupScore[] = [];

        for (const groupName of possibleSubjectGroups) {
            const groupSubjects = SUBJECT_GROUPS[groupName];

            const scoreBreakdown: {
                score: number;
                subject: VietnameseSubject;
            }[] = [];
            let totalScore = 0;
            let hasAllSubjects = true;

            for (const subject of groupSubjects) {
                const score = subjectScoreMap.get(subject);
                if (score === undefined) {
                    hasAllSubjects = false;
                    break;
                }
                scoreBreakdown.push({ score, subject });
                totalScore += score;
            }

            if (hasAllSubjects) {
                subjectGroupScores.push({
                    groupName,
                    scoreBreakdown,
                    subjects: [...groupSubjects],
                    totalScore,
                });
            }
        }

        return subjectGroupScores;
    }

    private getAndValidateScoreByCCQT(
        type: ExamType,
        validateScore: string,
    ): number | undefined {
        const parsedScore = parseInt(validateScore);

        if (isNaN(parsedScore) && type !== ExamType.A_Level) return undefined;

        switch (type) {
            case ExamType.A_Level:
                return this.getAndValidateScoreByCCQT_Type_A_Level(
                    validateScore,
                );
            case ExamType.ACT:
                return 1 <= parsedScore && parsedScore <= 36
                    ? parsedScore
                    : undefined;
            case ExamType.Duolingo_English_Test: // THIS IS THE FIX
                return 10 <= parsedScore && parsedScore <= 160
                    ? parsedScore
                    : undefined;
            case ExamType.IB:
                return 0 <= parsedScore && parsedScore <= 45
                    ? parsedScore
                    : undefined;
            case ExamType.OSSD:
                return 0 <= parsedScore && parsedScore <= 100
                    ? parsedScore
                    : undefined;
            case ExamType.PTE_Academic: // THIS IS THE FIX
                return 10 <= parsedScore && parsedScore <= 90
                    ? parsedScore
                    : undefined;
            case ExamType.SAT:
                return 400 <= parsedScore && parsedScore <= 1600
                    ? parsedScore
                    : undefined;
            default:
                return undefined;
        }
    }

    private getAndValidateScoreByCCQT_Type_A_Level(
        level: string,
    ): number | undefined {
        switch (level.toUpperCase()) {
            case "A":
                return 0.9;
            case "A*":
                return 1.0;
            case "B":
                return 0.8;
            case "C":
                return 0.7;
            case "D":
                return 0.6;
            case "E":
                return 0.5;
            case "F":
            case "N":
            case "O":
            case "U":
                return 0.0;
            default:
                return undefined;
        }
    }
}
