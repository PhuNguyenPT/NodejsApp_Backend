// src/dto/student.info.ts
import { Expose, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
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

import { AptitudeTestDTO } from "@/dto/student/aptitude.test.dto";
import { AwardDTO } from "@/dto/student/award.js";
import { CertificationDTO } from "@/dto/student/certification.js";
import { ExamSubject } from "@/dto/student/exam";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese.provinces";

/**
 * Data Transfer Object for creating or updating student profile information.
 * Contains all necessary data to establish a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 * @example
 * {
 *   "aptitudeTestScore": {
 *     "examType": {
 *       "type": "DGNL",
 *       "value": "VNUHCM"
 *     },
 *     "score": 700
 *   },
 *   "awards": [
 *     {
 *       "awardDate": "2023-12-15",
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
 *       "issueDate": "2023-01-15",
 *       "expirationDate": "2025-01-15",
 *       "level": "6.5",
 *       "name": "IELTS Academic"
 *     }
 *   ],
 *   "province": "Hồ Chí Minh",
 *   "major": "Khoa học Máy tính",
 *   "maxBudget": 20000000,
 *   "minBudget": 10000000,
 *   "subjectCombination": [
 *     { "name": "Toán", "score": 8.0 },
 *     { "name": "Ngữ Văn", "score": 7.0 },
 *     { "name": "Tiếng Anh", "score": 9.5 },
 *     { "name": "Vật Lý", "score": 8.75 }
 *   ],
 *   "talentScore": 9.5,
 *   "vsatScore": [120, 130, 125]
 * }
 */
export class StudentInfoDTO {
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
     * Primary field of study or academic major of the student.
     * Represents the student's main area of academic focus or specialization.
     * Used for matching with relevant opportunities and programs.
     *
     * @type {string}
     * @required
     * @minLength 1
     * @maxLength 200
     * @example "Khoa học Máy tính"
     * @example "Computer Science"
     * @example "Software Engineering"
     * @example "Information Technology"
     * @example "Business Administration"
     * @example "International Business"
     * @example "Electrical Engineering"
     * @example "Mechanical Engineering"
     * @example "Civil Engineering"
     * @example "Economics"
     * @example "Finance and Banking"
     */
    @Expose()
    @IsNotEmpty({ message: "Major is required" })
    @IsString({ message: "Major must be a string" })
    @MaxLength(200, { message: "Major cannot exceed 200 characters" })
    @MinLength(1, { message: "Major must be at least 1 character long" })
    major!: string;

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
     * Array of exactly 4 exam subjects
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @ArrayMaxSize(4, {
        message: "Exam Subjects must contain at most 4 subjects",
    })
    @ArrayMinSize(4, {
        message: "Exam Subjects must contain at least 4 subjects",
    })
    @Expose()
    @IsArray()
    @Type(() => ExamSubject)
    @ValidateNested({ each: true })
    subjectCombination!: ExamSubject[];

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
     * Array of exactly 3 scores
     * @example [120, 130, 125]
     */
    @ArrayMaxSize(3, { message: "Vsat score must have exactly 3 scores." })
    @ArrayMinSize(3, { message: "Vsat score must have exactly 3 scores." })
    @Expose()
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Max(150, { each: true })
    @Min(0, { each: true })
    vsatScore?: number[];
}
