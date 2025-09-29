import { Expose } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

import {
    NationalExamSubject,
    NationalExamSubjects,
} from "@/type/enum/national-exam-subject.js";
import { VietnameseSubject } from "@/type/enum/subject.js"; // Import VietnameseSubject enum
import {
    TalentExamSubject,
    TalentExamSubjects,
} from "@/type/enum/talent-exam.js";
import {
    VsatExamSubject,
    VsatExamSubjects,
} from "@/type/enum/vsat-exam-subject.js";

/**
 * Represents a single exam subject and its score
 */
export class ExamSubject {
    /**
     * Subject name (e.g., "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý")
     * @example "Toán"
     */
    @Expose()
    @IsEnum(VietnameseSubject)
    @IsNotEmpty()
    public name: VietnameseSubject;

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
     * @example VietnameseSubject.TOAN
     * @example 8.0
     */
    constructor(name: VietnameseSubject, score: number) {
        this.name = name;
        this.score = score;
    }
}

/**
 * Represents a single national exam subject and its score
 * Only accepts subjects that are valid for national exams
 */
export class NationalExam {
    /**
     * National exam subject name - restricted to national exam subjects only
     * @example "Toán"
     */
    @Expose()
    @IsEnum(NationalExamSubjects, {
        message:
            "name must be one of the following national exam subjects: " +
            NationalExamSubjects.join(", "),
    })
    @IsNotEmpty()
    public name: NationalExamSubject;

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
     * Creates a new NationalExam instance
     * @param name - The national exam subject name
     * @param score - The subject score (0.0 - 10.0)
     */
    constructor(name: NationalExamSubject, score: number) {
        this.name = name;
        this.score = score;
    }
}

/**
 * Represents a single talent exam subject and its score
 * Only accepts talent-specific subjects
 */
export class TalentExam {
    /**
     * Talent subject name - restricted to talent subjects only
     * @example "Đọc kể diễn cảm"
     */
    @Expose()
    @IsEnum(TalentExamSubjects, {
        message:
            "name must be one of the following talent subjects: " +
            TalentExamSubjects.join(", "),
    })
    @IsNotEmpty()
    public name: TalentExamSubject;

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
     * Creates a new TalentExam instance
     * @param name - The talent subject name
     * @param score - The subject score (0.0 - 10.0)
     */
    constructor(name: TalentExamSubject, score: number) {
        this.name = name;
        this.score = score;
    }
}

/**
 * Represents a single VSAT exam subject and its score
 */
export class VsatExam {
    /**
     * Subject name (e.g., "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý")
     * @example "Toán"
     */
    @Expose()
    @IsEnum(VsatExamSubjects, {
        message:
            "name must be one of the following talent subjects: " +
            VsatExamSubjects.join(", "),
    })
    @IsNotEmpty()
    public name: VsatExamSubject;

    /**
     * Subject score (0.0 - 150.0)
     * @example 120
     */
    @Expose()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Max(150)
    @Min(0)
    public score: number;

    /**
     * Creates a new VsatExamSubject instance
     * @param name - The subject name
     * @param score - The subject score (0.0 - 150.0)
     * @example VietnameseSubject.TOAN
     * @example 120
     */
    constructor(name: VsatExamSubject, score: number) {
        this.name = name;
        this.score = score;
    }
}
