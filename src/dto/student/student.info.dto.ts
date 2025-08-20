// src/dto/student.info.dto.ts
import { Expose, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from "class-validator";

import { AcademicPerformanceDTO } from "@/dto/student/academic.performance.dto.js";
import { AptitudeTestDTO } from "@/dto/student/aptitude.test.dto.js";
import { AwardDTO } from "@/dto/student/award.dto.js";
import { CertificationDTO } from "@/dto/student/certification.dto.js";
import { ConductDTO } from "@/dto/student/conduct.dto.js";
import {
    ExamSubject,
    VsatExamSubject,
} from "@/dto/student/exam.profile.dto.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special.student.case.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese.provinces.js";

/**
 * Data Transfer Object for creating or updating student profile information.
 * Contains all necessary data to establish a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 * @example
 * {
 *   "academicPerformances": [
 *     {
 *       "academicPerformance": "Giỏi",
 *       "grade": 10
 *     },
 *     {
 *       "academicPerformance": "Khá",
 *       "grade": 11
 *     },
 *     {
 *       "academicPerformance": "Xuất sắc",
 *       "grade": 12
 *     }
 *   ],
 *   "aptitudeTestScore": {
 *     "examType": {
 *       "type": "DGNL",
 *       "value": "VNUHCM"
 *     },
 *     "score": 700
 *   },
 *   "awards": [
 *     {
 *       "category": "Tiếng Anh",
 *       "level": "Hạng Nhất",
 *       "name": "Học sinh giỏi cấp quốc gia"
 *     }
 *   ],
 *   "certifications": [
 *     {
 *       "examType": {
 *         "type": "CCNN",
 *         "value": "IELTS"
 *       },
 *       "level": "6.5",
 *     }
 *   ],
 *   "conducts": [
 *     {
 *       "conduct": "Tốt",
 *       "grade": 10
 *     },
 *     {
 *       "conduct": "Khá",
 *       "grade": 11
 *     },
 *     {
 *       "conduct": "Trung bình",
 *       "grade": 12
 *     }
 *   ],
 *   "majors": [
 *     "Kỹ thuật",
 *     "Máy tính và công nghệ thông tin",
 *     "Toán và thống kê"
 *   ],
 *   "maxBudget": 20000000,
 *   "minBudget": 10000000,
 *   "nationalExam": [
 *     { "name": "Toán", "score": 8.0 },
 *     { "name": "Ngữ Văn", "score": 7.0 },
 *     { "name": "Tiếng Anh", "score": 9.5 },
 *     { "name": "Vật Lý", "score": 8.75 }
 *   ],
 *   "province": "Hồ Chí Minh",
 *   "specialStudentCase": "Học sinh trường chuyên",
 *   "talentScore": 9.5,
 *   "vsatScore": [
 *     { "name": "Toán", "score": 120 },
 *     { "name": "Ngữ Văn", "score": 130 },
 *     { "name": "Tiếng Anh", "score": 125 }
 *   ]
 * }
 */
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
     *     "academicPerformance": "Giỏi",
     *     "grade": 10
     *   },
     *   {
     *     "academicPerformance": "Khá",
     *     "grade": 11
     *   },
     *   {
     *     "academicPerformance": "Xuất sắc",
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
     */
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
     *     "conduct": "Trung bình",
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
    /**
     * Geographic location or preferred study location of the student.
     * Can include city, state, country, or specific address information.
     * Used for matching with location-based opportunities or programs.
     *
     * @type {string}
     * @required
     * @minLength 1
     * @maxLength 500
     * @example "1 Lê Duẩn, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh, Việt Nam"
     * @example "Ho Chi Minh City, Vietnam"
     * @example "Hanoi, Vietnam"
     * @example "Da Nang, Vietnam"
     * @example "Can Tho, Vietnam"
     * @example "Nha Trang, Khanh Hoa, Vietnam"
     */
    @Expose()
    @IsOptional()
    @IsString({ message: "Location must be a string" })
    @MaxLength(500, { message: "Location cannot exceed 500 characters" })
    @MinLength(1, { message: "Location must be at least 1 character long" })
    location?: string;

    /**
     * Student's major group classifications using standardized Vietnamese categories.
     * Array of major group values that the student is interested in pursuing.
     * Must contain at least 1 and at most 3 valid MajorGroup enum values.
     *
     * @type {MajorGroup[]}
     * @required
     * @example ["Kỹ thuật", "Máy tính và công nghệ thông tin", "Toán và thống kê"]
     * @example ["Kinh doanh và quản lý"]
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be an array with 1-3 valid MajorGroup enum values
     * - Each value must correspond to official Vietnamese education major group classifications
     * - Array cannot be empty
     * - Maximum 3 major groups allowed
     * - Minimum 1 major group required
     */
    @ArrayMaxSize(3, { message: "Major groups must contain at most 3 records" })
    @ArrayMinSize(1, { message: "Major groups must contain at least 1 record" })
    @Expose()
    @IsArray({ message: "Major groups must be an array" })
    @IsEnum(MajorGroup, {
        each: true,
        message:
            "Each major group must be a valid value from the MajorGroup enum",
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
     * @example 20000000
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     */
    @Expose()
    @IsNotEmpty({ message: "Max budget is required" })
    @IsNumber({}, { message: "Max budget must be a number" })
    @Min(1, { message: "Max budget must be greater than 0" })
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     * @example 10000000
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
    minBudget!: number;

    /**
     * Array of exactly 4 exam subjects
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @ArrayMaxSize(4, {
        message: "Exam Subjects must contain exactly 4 subjects",
    })
    @ArrayMinSize(4, {
        message: "Exam Subjects must contain exactly 4 subjects",
    })
    @Expose()
    @IsArray()
    @Type(() => ExamSubject)
    @ValidateNested({ each: true })
    nationalExam!: ExamSubject[];

    /**
     * Province or city where the student is located
     * @example VietnamSouthernProvinces.HO_CHI_MINH
     */
    @Expose()
    @IsEnum(VietnamSouthernProvinces, {
        message: "Province must be a valid Vietnamese southern province",
    })
    @IsNotEmpty({ message: "Province is required" })
    province!: VietnamSouthernProvinces;

    /**
     * Special student case indicating unique circumstances or qualifications
     * Optional field that can be used to specify if the student falls under any special category
     * Valid values are defined in the SpecialStudentCase enum.
     * @type {SpecialStudentCase}
     * @optional
     * @see SpecialStudentCase for valid enum values
     * @example "Học sinh thuộc huyện nghèo, vùng đặc biệt khó khăn"
     * @example "Anh hùng Lao động, Anh hùng Lực lượng vũ trang Nhân dân, Chiến sĩ thi đua toàn quốc"
     * @example "Học sinh trường chuyên"
     * @example "Dân tộc thiểu số rất ít người (Mông, La Ha,...)"
     */
    @Expose()
    @IsEnum(SpecialStudentCase, {
        message: "Special student case must be a valid enum value",
    })
    @IsOptional()
    specialStudentCase?: SpecialStudentCase;

    /**
     * Talent score representing the student's aptitude or potential
     * Optional field that can be used to indicate the student's talent level
     * @example 9.5
     * @validation
     * - Must be a number
     * - Must be between 0 and 10 (inclusive)
     * - Optional field (can be null or undefined)
     * - Maximum of 2 decimal places
     * - Cannot exceed 10
     * - Cannot be less than 0
     */
    @Expose()
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(10, { message: "Talent score cannot exceed 10" })
    @Min(0, { message: "Talent score must be at least 0" })
    talentScore?: number;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of exactly 3 exam subjects with names and scores (0-150 each)
     * Each subject contains a name and score following the ExamSubject structure
     * @example [
     *     { "name": "Toán", "score": 120 },
     *     { "name": "Ngữ Văn", "score": 130 },
     *     { "name": "Tiếng Anh", "score": 125 }
     * ]
     * @validation
     * - Must be an array of exactly 3 ExamSubject objects
     * - Each ExamSubject must have a valid name (string) and score (number 0-150)
     * - Optional field (can be null or undefined)
     */
    @ArrayMaxSize(3, { message: "VSAT score must have exactly 3 subjects." })
    @ArrayMinSize(3, { message: "VSAT score must have exactly 3 subjects." })
    @Expose()
    @IsArray({ message: "VSAT score must be an array" })
    @IsOptional()
    @Type(() => VsatExamSubject)
    @ValidateNested({ each: true })
    vsatScore?: VsatExamSubject[];
}
