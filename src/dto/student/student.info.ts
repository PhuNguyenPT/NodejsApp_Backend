// src/dto/student.info.ts
import { Expose, Type } from "class-transformer";
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from "class-validator";

import { AwardDTO } from "@/dto/student/award.js";
import { CertificationDTO } from "@/dto/student/certification.js";

/**
 * Data Transfer Object for creating or updating student profile information.
 * Contains all necessary data to establish a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 * @example
 * {
 *   "location": "Thành phố Hồ Chí Minh, Việt Nam",
 *   "major": "Khoa học Máy tính",
 *   "minBudget": 10000000,
 *   "maxBudget": 20000000,
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
 *       "issueDate": "2023-01-15"",
 *       "expirationDate": "2025-01-15",
 *       "level": "6.5",
 *       "name": "IELTS"
 *     }
 *   ]
 * }
 * @example
 * {
 *   "location": "Ho Chi Minh City, Vietnam",
 *   "major": "Computer Science",
 *   "minBudget": 5000000,
 *   "maxBudget": 20000000,
 *   "awards": [
 *     {
 *       "name": "Dean's List Award",
 *       "category": "Academic Excellence",
 *       "level": "University",
 *       "awardDate": "2023-12-15"
 *     }
 *   ],
 *   "certifications": [
 *     {
 *       "name": "AWS Solutions Architect",
 *       "issuingOrganization": "Amazon Web Services",
 *       "issueDate": "2023-06-01",
 *       "expirationDate": "2026-06-01"
 *     }
 *   ]
 * }
 */
export class StudentInfoDTO {
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
     * @example "Thành phố Hồ Chí Minh, Việt Nam"
     * @example "Ho Chi Minh City, Vietnam"
     * @example "Hanoi, Vietnam"
     * @example "Da Nang, Vietnam"
     * @example "Can Tho, Vietnam"
     * @example "Nha Trang, Khanh Hoa, Vietnam"
     */
    @Expose()
    @IsNotEmpty({ message: "Location is required" })
    @IsString({ message: "Location must be a string" })
    @MaxLength(500, { message: "Location cannot exceed 500 characters" })
    @MinLength(1, { message: "Location must be at least 1 character long" })
    location!: string;

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
    @IsNumber({}, { message: "Min budget must be a number" })
    @Min(1, { message: "Min budget must be greater than 0" })
    minBudget!: number;
}
