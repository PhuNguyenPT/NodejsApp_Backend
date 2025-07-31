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
 *   "aptitudeTestScore": 120,
 *   "vsatScore": 85
 * }
 */
export class ExamProfile {
    /**
     * Aptitude test score (Điểm ĐGNL - Đánh giá năng lực)
     * @example 700
     */
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(1200)
    @Min(0)
    public aptitudeTestScore?: number;

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
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * @example 85
     */
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(150)
    @Min(0)
    public vsatScore?: number;

    /**
     * Calculates the total score of all 4 subjects
     * @example 33.25
     */
    get totalSubjectScore(): number {
        return this.subjectCombination.reduce((sum, s) => sum + s.score, 0);
    }

    /**
     * Creates a new ExamProfile instance
     * @param subjects - Array of exactly 4 ExamSubject instances
     * @param aptitudeTestScore - Optional ĐGNL score (0-150)
     * @param vsatScore - Optional VSAT score (0-120)
     * @example [new ExamSubject("Toán", 8.0), new ExamSubject("Ngữ Văn", 7.0), new ExamSubject("Tiếng Anh", 9.5), new ExamSubject("Vật Lý", 8.75)]
     * @example 120
     * @example 85
     */
    constructor(
        subjects: ExamSubject[],
        aptitudeTestScore?: number,
        vsatScore?: number,
    ) {
        if (subjects.length !== 4) {
            throw new Error(
                "A subject combination must contain exactly 4 subjects.",
            );
        }
        this.subjectCombination = subjects;
        this.aptitudeTestScore = aptitudeTestScore;
        this.vsatScore = vsatScore;
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
