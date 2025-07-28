// src/dto/student.info.ts
import { Type } from "class-transformer";
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";

import { AwardDTO } from "@/dto/student/award.js";
import { BudgetDTO } from "@/dto/student/budget.js";
import { CertificationDTO } from "@/dto/student/certification.js";

/**
 * Data Transfer Object for creating or updating student profile information.
 * Contains all necessary data to establish a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 *
 * @example
 * ```json
 * {
 *   "location": "Ho Chi Minh City, Vietnam",
 *   "major": "Computer Science",
 *   "budget": {
 *     "minBudget": 5000000,
 *     "maxBudget": 20000000
 *   },
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
 * ```
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
    @IsArray({ message: "Awards must be an array" })
    @IsOptional()
    @Type(() => AwardDTO)
    @ValidateNested({ each: true })
    awards?: AwardDTO[];

    /**
     * Budget range preferences for the student in Vietnamese Dong (VND).
     * Defines the minimum and maximum budget constraints for various purposes
     * such as accommodation, study materials, or program costs.
     *
     * @type {BudgetDTO}
     * @required
     * @see BudgetDTO for detailed structure and validation rules
     */
    @IsNotEmpty({ message: "Budget is required" })
    @Type(() => BudgetDTO)
    @ValidateNested()
    budget!: BudgetDTO;

    /**
     * List of professional certifications earned by the student.
     * Optional field that can contain multiple certification entries.
     * Each certification includes details like name, issuing organization, and validity dates.
     *
     * @type {CertificationDTO[]}
     * @optional
     * @see CertificationDTO for detailed structure and validation rules
     */
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
     * @example "Ho Chi Minh City, Vietnam"
     * @example "Hanoi, Vietnam"
     * @example "Da Nang, Vietnam"
     * @example "Can Tho, Vietnam"
     * @example "Nha Trang, Khanh Hoa, Vietnam"
     */
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
    @IsNotEmpty({ message: "Major is required" })
    @IsString({ message: "Major must be a string" })
    @MaxLength(200, { message: "Major cannot exceed 200 characters" })
    @MinLength(1, { message: "Major must be at least 1 character long" })
    major!: string;
}
