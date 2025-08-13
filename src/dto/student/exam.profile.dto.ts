import { Expose, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from "class-validator";

import { ExamType } from "@/type/enum/exam.js";

import { AptitudeTestDTO } from "./aptitude.test.dto";

/**
 * Represents a complete exam profile containing subject scores and optional test scores
 * @example
 * {
 *   "subjectCombination": [
 *     { "name": "Toán", "score": 8.0 },
 *     { "name": "Ngữ Văn", "score": 7.0 },
 *     { "name": "Tiếng Anh", "score": 9.5 },
 *     { "name": "Vật Lý", "score": 8.75 }
 *   ],
 *   "aptitudeTestScore": {
 *     "examType": {
 *       "type": "DGNL",
 *       "value": "VNUHCM"
 *     },
 *     "score": 700
 *   },
 *   "vsatScore": [
 *     { "name": "Toán", "score": 120 },
 *     { "name": "Ngữ Văn", "score": 130 },
 *     { "name": "Tiếng Anh", "score": 125 }
 *   ] * }
 */
export class ExamProfileDTO {
    /**
     * Aptitude test data including exam type and score
     * @example
     * {
     *  "examType": { "type": "DGNL", "value": "VNUHCM" },"score": 700 }
     */
    @IsOptional()
    @Type(() => AptitudeTestDTO)
    @ValidateNested()
    public aptitudeTestScore?: AptitudeTestDTO;

    /**
     * Array of exactly 4 exam subjects
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @ArrayMaxSize(4)
    @ArrayMinSize(4)
    @IsArray()
    @Type(() => ExamSubject)
    @ValidateNested({ each: true })
    public subjectCombination: ExamSubject[];

    /**
     * VSAT scores - array of exactly 3 scores (0-150 each)
     * @example [120, 135, 140]
     */
    @ArrayMaxSize(3)
    @ArrayMinSize(3)
    @IsArray()
    @IsOptional()
    @Max(150, { each: true })
    @Min(0, { each: true })
    public vsatScore?: VsatExamSubject[];

    /**
     * Calculates the total score of all 4 subjects
     * @example 33.25
     */
    get totalSubjectScore(): number {
        return this.subjectCombination.reduce((sum, s) => sum + s.score, 0);
    }

    /**
     * Calculates the total VSAT score (sum of all 3 scores)
     * @example 395
     */
    get totalVSATScore(): number {
        if (!this.vsatScore || !Array.isArray(this.vsatScore)) return 0;

        // Access the 'score' property of each object in the array
        return this.vsatScore.reduce((sum, subject) => sum + subject.score, 0);
    }

    /**
     * Creates a new ExamProfileDTO instance
     * @param subjects - Array of exactly 4 ExamSubject instances
     * @param aptitudeTestData - Optional aptitude test DTO with type and score
     * @param vsatScores - Optional array of 3 VSAT scores (0-150 each)
     * @example [new ExamSubject("Toán", 8.0), new ExamSubject("Ngữ Văn", 7.0), new ExamSubject("Tiếng Anh", 9.5), new ExamSubject("Vật Lý", 8.75)]
     * @example new AptitudeTestDTO()
     * @example [120, 135, 140]
     */
    constructor(
        subjects: ExamSubject[],
        aptitudeTestData?: AptitudeTestDTO,
        vsatScores?: VsatExamSubject[],
    ) {
        if (subjects.length !== 4) {
            throw new Error(
                "A subject combination must contain exactly 4 subjects.",
            );
        }
        if (vsatScores && vsatScores.length !== 3) {
            throw new Error(
                "VSAT scores must be an array of exactly 3 numbers.",
            );
        }
        this.subjectCombination = subjects;
        this.aptitudeTestScore = aptitudeTestData;
        this.vsatScore = vsatScores;
    }

    /**
     * Static factory method to create ExamProfileDTO from StudentEntity data
     * @param subjects - Array of ExamSubjectData from StudentEntity
     * @param aptitudeTestData - AptitudeTestData from StudentEntity
     * @param vsatScores - VSAT scores array from StudentEntity
     * @returns ExamProfileDTO instance
     */
    static fromStudentEntity(
        subjects: { name: string; score: number }[],
        aptitudeTestData?: { examType: ExamType; score: number },
        vsatScores?: VsatExamSubject[],
    ): ExamProfileDTO {
        const examSubjects = subjects.map(
            (s) => new ExamSubject(s.name, s.score),
        );

        let aptitudeDTO: AptitudeTestDTO | undefined;
        if (aptitudeTestData) {
            aptitudeDTO = new AptitudeTestDTO();
            aptitudeDTO.examType = aptitudeTestData.examType;
            aptitudeDTO.score = aptitudeTestData.score;
        }

        return new ExamProfileDTO(examSubjects, aptitudeDTO, vsatScores);
    }

    /**
     * Helper method to get VSAT score by index
     * @param index - Index of the VSAT score (0-2)
     * @returns VSAT score at the specified index
     */
    getVSATScore(index: number): undefined | VsatExamSubject {
        if (!this.vsatScore || !Array.isArray(this.vsatScore)) return undefined;
        return this.vsatScore[index];
    }

    /**
     * Helper method to check if VSAT scores are valid
     * @returns true if VSAT scores are valid (array of 3 numbers between 0-150)
     */
    hasValidVSATScores(): boolean {
        return (
            this.vsatScore !== undefined &&
            Array.isArray(this.vsatScore) &&
            this.vsatScore.length === 3 &&
            this.vsatScore.every(
                (score) =>
                    typeof score === "number" && score >= 0 && score <= 150,
            )
        );
    }

    /**
     * Helper method to set aptitude test with both type and score
     * @param examType - Type of exam
     * @param score - Test score
     */
    setAptitudeTest(examType: ExamType, score: number): void {
        const aptitudeTest = new AptitudeTestDTO();
        aptitudeTest.examType = examType;
        aptitudeTest.score = score;
        this.aptitudeTestScore = aptitudeTest;
    }

    /**
     * Helper method to set VSAT scores
     * @param scores - Array of exactly 3 VSAT scores
     */
    setVSATScores(scores: VsatExamSubject[]): void {
        if (scores.length !== 3) {
            throw new Error(
                "VSAT scores must be an array of exactly 3 numbers",
            );
        }
        this.vsatScore = scores;
    }

    /**
     * Convert ExamProfileDTO to StudentEntity compatible data
     * @returns Object with data compatible with StudentEntity
     */
    toStudentEntityData(): {
        aptitudeTestScore?: { examType: ExamType; score: number };
        subjectCombination: { name: string; score: number }[];
        vsatScore?: VsatExamSubject[];
    } {
        return {
            aptitudeTestScore: this.aptitudeTestScore
                ? {
                      examType: this.aptitudeTestScore.examType,
                      score: this.aptitudeTestScore.score,
                  }
                : undefined,
            subjectCombination: this.subjectCombination.map((s) => ({
                name: s.name,
                score: s.score,
            })),
            vsatScore: this.vsatScore,
        };
    }
}

/**
 * Represents a single exam subject and its score
 */
export class ExamSubject {
    /**
     * Subject name (e.g., "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý")
     * @example "Toán"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    public name: string;

    /**
     * Subject score (0.0 - 10.0)
     * @example 8.0
     */
    @Expose()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Max(10)
    @Min(0)
    public score: number;

    /**
     * Creates a new ExamSubject instance
     * @param name - The subject name
     * @param score - The subject score (0.0 - 10.0)
     * @example "Toán"
     * @example 8.0
     */
    constructor(name: string, score: number) {
        this.name = name;
        this.score = score;
    }
}

/**
 * Represents a single exam subject and its score
 */
export class VsatExamSubject {
    /**
     * Subject name (e.g., "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý")
     * @example "Toán"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    public name: string;

    /**
     * Subject score (0.0 - 10.0)
     * @example 8.0
     */
    @Expose()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Max(150)
    @Min(0)
    public score: number;

    /**
     * Creates a new ExamSubject instance
     * @param name - The subject name
     * @param score - The subject score (0.0 - 10.0)
     * @example "Toán"
     * @example 8.0
     */
    constructor(name: string, score: number) {
        this.name = name;
        this.score = score;
    }
}
