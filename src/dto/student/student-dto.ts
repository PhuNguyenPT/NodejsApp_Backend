// src/dto/student.info.dto.ts
import { Expose, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    ValidateNested,
} from "class-validator";

import { AcademicPerformanceDTO } from "@/dto/student/academic-performance-dto.js";
import { AptitudeTestDTO } from "@/dto/student/aptitude-test-dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { ConductDTO } from "@/dto/student/conduct-dto.js";
import {
    NationalExam,
    TalentExam,
    VsatExam,
} from "@/dto/student/exam-profile-dto.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { VietnameseSubject } from "@/type/enum/subject.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";
import { IsArrayUnique } from "@/validator/is-array-unique.validator.js";
import { IsValidNationalExamSubjects } from "@/validator/is-national-exam-subject.validator.js";
import { IsUniqueSubject } from "@/validator/is-unique-name.validator.js";

export class StudentInfoDTO {
    /**
     * Student academic performance assessment
     * Array of academic performance ratings that can include multiple evaluations for different grades/years.
     * Each entry contains an academic performance rating and the corresponding grade level.
     * Valid academic performance values are defined in the AcademicPerformance enum.
     *
     * @type {AcademicPerformanceDTO[]}
     * @required
     * @see AcademicPerformanceDTO for detailed structure and validation rules
     * @example [
     *   {
     *     "academicPerformance": "Tốt",
     *     "grade": 10
     *   },
     *   {
     *     "academicPerformance": "Khá",
     *     "grade": 11
     *   },
     *   {
     *     "academicPerformance": "Đạt",
     *     "grade": 12
     *   }
     * ]
     */
    @ArrayMaxSize(3, {
        message: "Academic performance must contain exactly 3 records",
    })
    @ArrayMinSize(3, {
        message: "Academic performance must contain exactly 3 records",
    })
    @Expose()
    @IsArray({ message: "Academic performance must be an array" })
    @IsNotEmpty({ message: "Academic performance is required" })
    @Type(() => AcademicPerformanceDTO)
    @ValidateNested({ each: true })
    academicPerformances!: AcademicPerformanceDTO[];

    /**
     * Aptitude test information including exam type and score
     * Contains the exam type (DGNL, CCNN, or CCQT) and the numeric score achieved
     * @example { "examType": { "type": "DGNL", "value": "VNUHCM" }, "score": 700 }
     */
    @Expose()
    @IsOptional()
    @Type(() => AptitudeTestDTO)
    @ValidateNested()
    aptitudeTestScore?: AptitudeTestDTO;

    /**
     * List of awards and recognitions received by the student.
     * Optional field that can contain multiple award entries.
     * Each award includes details like name, category, level, and award date.
     *
     * @type {AwardDTO[]}
     * @optional
     * @see AwardDTO for detailed structure and validation rules
     * @example
     * [
     *   {
     *     "category": "Tiếng Anh",
     *     "level": "Hạng Nhất",
     *     "name": "Học sinh giỏi cấp Quốc Gia"
     *     },
     *   {
     *     "category": "Tiếng Pháp",
     *     "level": "Hạng Nhì",
     *     "name": "Học sinh giỏi cấp Quốc Gia"
     *   }
     * ]
     */
    @ArrayMaxSize(3, {
        message: "Awards must contain at most 3 awards",
    })
    @Expose()
    @IsArray({ message: "Awards must be an array" })
    @IsOptional()
    @Type(() => AwardDTO)
    @ValidateNested({ each: true })
    awards?: AwardDTO[];

    /**
     * List of professional certifications earned by the student.
     * Optional field that can contain multiple certification entries.
     * Each certification includes details like name, issuing organization, and validity dates.
     *
     * @type {CertificationDTO[]}
     * @optional
     * @see CertificationDTO for detailed structure and validation rules
     */
    @ArrayMaxSize(3, {
        message: "Certifications must contain at most 3 certifications",
    })
    @Expose()
    @IsArray({ message: "Certifications must be an array" })
    @IsOptional()
    @Type(() => CertificationDTO)
    @ValidateNested({ each: true })
    certifications?: CertificationDTO[];

    /**
     * Student conduct/behavior assessment
     * Array of conduct ratings that can include multiple evaluations for different grades/years.
     * Each entry contains a conduct rating and the corresponding grade level.
     * Valid conduct values are defined in the Conduct enum.
     *
     * @type {ConductDTO[]}
     * @required
     * @see ConductDTO for detailed structure and validation rules
     * @example [
     *   {
     *     "conduct": "Tốt",
     *     "grade": 10
     *   },
     *   {
     *     "conduct": "Khá",
     *     "grade": 11
     *   },
     *   {
     *     "conduct": "Chưa Đạt",
     *     "grade": 12
     *   }
     * ]
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be an array of ConductDTO objects
     * - Each ConductDTO must have valid conduct enum value and grade (1-12)
     * - Array cannot be empty
     */
    @ArrayMaxSize(3, {
        message: "Conduct must contain exactly 3 records",
    })
    @ArrayMinSize(3, {
        message: "Conduct must contain exactly 3 records",
    })
    @Expose()
    @IsArray({ message: "Conduct must be an array" })
    @IsNotEmpty({ message: "Conduct is required" })
    @Type(() => ConductDTO)
    @ValidateNested({ each: true })
    conducts!: ConductDTO[];

    // /**
    //  * Geographic location or preferred study location of the student.
    //  * Can include city, state, country, or specific address information.
    //  * Used for matching with location-based opportunities or programs.
    //  *
    //  * @type {string}
    //  * @required
    //  * @minLength 1
    //  * @maxLength 500
    //  * @example "1 Lê Duẩn, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam"
    //  * @example "Ho Chi Minh City, Vietnam"
    //  * @example "Hanoi, Vietnam"
    //  * @example "Da Nang, Vietnam"
    //  * @example "Can Tho, Vietnam"
    //  * @example "Nha Trang, Khanh Hoa, Vietnam"
    //  */
    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Location must be a string" })
    // @MaxLength(500, { message: "Location cannot exceed 500 characters" })
    // @MinLength(1, { message: "Location must be at least 1 character long" })
    // location?: string;

    /**
     * Student's major group classifications using standardized Vietnamese categories.
     * Array of major group values that the student is interested in pursuing.
     * Must contain at least 1 and at most 3 valid MajorGroup values.
     *
     * @type {MajorGroup[]}
     * @required
     * @example ["Kỹ thuật", "Máy tính và công nghệ thông tin", "Toán và thống kê"]
     * @example ["Kinh doanh và quản lý"]
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be an array with 1-3 valid MajorGroup values
     * - Each value must correspond to official Vietnamese education major group classifications
     * - Array cannot be empty
     * - Maximum 3 major groups allowed
     * - Minimum 1 major group required
     */
    @ArrayMaxSize(3, { message: "Major groups must contain at most 3 records" })
    @ArrayMinSize(1, { message: "Major groups must contain at least 1 record" })
    @Expose()
    @IsArray({ message: "Major groups must be an array" })
    @IsArrayUnique({ message: "Major groups must be unique" })
    @IsEnum(MajorGroup, {
        each: true,
    })
    @IsNotEmpty({ message: "Major groups are required" })
    majors!: MajorGroup[];

    /**
     * Maximum budget amount that the student is willing or able to spend.
     * Represents the upper limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     * @example 90000000
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     */
    @Expose()
    @IsNotEmpty({ message: "Max budget is required" })
    @IsNumber({}, { message: "Max budget must be a number" })
    @Min(1, { message: "Max budget must be greater than 0" })
    @Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     * @example 80000000
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     *
     * Note: The relationship validation (minBudget <= maxBudget) is handled in the service layer
     */
    @Expose()
    @IsNotEmpty({ message: "Min budget is required" })
    @IsNumber({}, { message: "Min budget must be greater than 0" })
    @Min(1, { message: "Min budget must be greater than 0" })
    @Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
    minBudget!: number;

    /**
     * Array of exactly 4 national exam subjects
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @Expose()
    @IsValidNationalExamSubjects()
    @Type(() => NationalExam) // Changed from ExamSubject to NationalExam
    @ValidateNested({ each: true })
    nationalExams!: NationalExam[];

    /**
     * Province or city where the student's university/college is located
     * @type {VietnamSouthernProvinces}
     * @see VietnamSouthernProvinces for valid enum values
     */
    @Expose()
    @IsEnum(VietnamSouthernProvinces)
    @IsNotEmpty({ message: "Province is required" })
    province!: VietnamSouthernProvinces;

    /**
     * Special student cases indicating unique circumstances or qualifications
     * Optional array field that can be used to specify if the student falls under any special categories
     * Valid values are defined in the SpecialStudentCase enum.
     * Students can have multiple special cases applied simultaneously.
     *
     * @type {SpecialStudentCase[]}
     * @optional
     * @see SpecialStudentCase for valid enum values
     * @example ["Học sinh thuộc huyện nghèo, vùng đặc biệt khó khăn", "Dân tộc thiểu số rất ít người (Mông, La Ha,...)"]
     */
    @Expose()
    @IsArray({ message: "Special student cases must be an array" })
    @IsArrayUnique({ message: "Special student cases must be unique" })
    @IsEnum(SpecialStudentCase, {
        each: true,
    })
    @IsOptional()
    specialStudentCases?: SpecialStudentCase[];

    /**
     * Talent score representing the student's aptitude or potential
     * Optional field that can be used to indicate the student's talent level
     * Only accepts subjects that are valid talent exam subjects
     * @example [{ "name": "Đọc kể diễn cảm", "score": 8.0 }, { "name": "Hát", "score": 7.0 }]
     */
    @Expose()
    @IsArray()
    @IsOptional()
    @IsUniqueSubject({ message: "Talent scores must have unique names" })
    @Type(() => TalentExam)
    @ValidateNested({ each: true })
    talentScores?: TalentExam[];

    /**
     * @example "Công lập"
     * @description The type of university (public or private).
     * @type {UniType}
     * @see UniType For the list of possible university types.
     */
    @Expose()
    @IsEnum(UniType)
    @IsNotEmpty({ message: "University Type is required" })
    uniType!: UniType;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of at lease 3 exam subjects, at most 8 subjects, with names and scores (0-150 each)
     * Each subject contains a name and score following the ExamSubject structure
     * @example [
     *     { "name": "Toán", "score": 120 },
     *     { "name": "Ngữ Văn", "score": 130 },
     *     { "name": "Tiếng Anh", "score": 125 }
     * ]
     * @validation
     * - Must be an array of at lease 3 exam subjects, at most 8 subjects,
     * - Each ExamSubject must have a valid name (string) and score (number 0-150)
     * - Optional field (can be null or undefined)
     * @type {VsatExam[]}
     * @see VsatExam for detailed structure and validation rules
     */
    @ArrayMaxSize(8)
    @ArrayMinSize(3)
    @Expose()
    @IsArray({ message: "VSAT scores must be an array" })
    @IsOptional()
    @IsUniqueSubject({ message: "VSAT scores must have unique names" })
    @Type(() => VsatExam)
    @ValidateNested({ each: true })
    vsatScores?: VsatExam[];

    getAptitudeTestScore(): number | undefined {
        if (
            this.aptitudeTestScore &&
            typeof this.aptitudeTestScore.score === "number" &&
            this.aptitudeTestScore.score > 0
        ) {
            return this.aptitudeTestScore.score;
        }
        return undefined;
    }
    getCertificationsByExamType(
        type: "CCNN" | "CCQT" | "ĐGNL",
    ): CertificationDTO[] {
        if (!this.certifications) return [];
        return this.certifications.filter(
            (cert) =>
                typeof cert.examType === "object" &&
                cert.examType.type === type,
        );
    }

    getTotalVSATScore(): number {
        if (!this.vsatScores || !Array.isArray(this.vsatScores)) return 0;
        return this.vsatScores.reduce(
            (sum, examSubject) => sum + examSubject.score,
            0,
        );
    }

    hasAptitudeTestScore(): boolean {
        return !!(
            this.aptitudeTestScore &&
            typeof this.aptitudeTestScore.score === "number" &&
            this.aptitudeTestScore.score > 0
        );
    }

    hasCertificationExamType(type: "CCNN" | "CCQT" | "ĐGNL"): boolean {
        return this.getCertificationsByExamType(type).length > 0;
    }

    hasValidNationalExam(): boolean {
        return this.nationalExams.length === 4;
    }

    hasValidVSATScores(): boolean {
        return (
            this.vsatScores !== undefined &&
            Array.isArray(this.vsatScores) &&
            this.vsatScores.length >= 3 &&
            this.vsatScores.length <= 8 &&
            this.vsatScores.every(
                (examSubject) =>
                    typeof examSubject === "object" &&
                    Object.values(VietnameseSubject).includes(
                        examSubject.name,
                    ) &&
                    typeof examSubject.score === "number" &&
                    examSubject.score >= 0 &&
                    examSubject.score <= 150,
            )
        );
    }
}
