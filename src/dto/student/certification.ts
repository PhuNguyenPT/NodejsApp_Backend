import { Type } from "class-transformer";
import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
} from "class-validator";

/**
 * Data Transfer Object for Certification information
 * @example
 * {
 *   "credentialId": "CERT-2023-XYZ789",
 *   "expirationDate": "2026-12-31",
 *   "issueDate": "2023-01-15",
 *   "issuingOrganization": "AWS Certification Authority",
 *   "level": 3,
 *   "levelDescription": "Professional Level",
 *   "name": "AWS Solutions Architect Professional"
 * }
 */
export class CertificationDTO {
    /**
     * Unique credential identifier (optional)
     * @example "CERT-2023-XYZ789"
     */
    @IsOptional()
    @IsString({ message: "Credential ID must be a string" })
    @MaxLength(100, { message: "Credential ID cannot exceed 100 characters" })
    credentialId?: string;

    /**
     * Date when the certification expires (optional)
     * @example "2026-12-31"
     */
    @IsDateString({}, { message: "Expiration date must be a valid date" })
    @IsOptional()
    @Type(() => Date)
    expirationDate?: Date;

    /**
     * Date when the certification was issued
     * @example "2023-01-15"
     */
    @IsDateString({}, { message: "Issue date must be a valid date" })
    @IsNotEmpty({ message: "Issue date is required" })
    @Type(() => Date)
    issueDate!: Date;

    /**
     * Organization that issued the certification
     * @example "AWS Certification Authority"
     */
    @IsNotEmpty({ message: "Issuing organization is required" })
    @IsString({ message: "Issuing organization must be a string" })
    @MaxLength(200, {
        message: "Issuing organization cannot exceed 200 characters",
    })
    @MinLength(1, {
        message: "Issuing organization must be at least 1 character long",
    })
    issuingOrganization!: string;

    /**
     * Numeric level or tier of the certification (optional)
     * @example 3
     */
    @IsNumber({}, { message: "Level must be a number" })
    @IsOptional()
    @Max(10000, { message: "Level cannot exceed 10000" })
    @Min(0, { message: "Level cannot be negative" })
    level?: number;

    /**
     * Textual description of the certification level (optional)
     * @example "Professional Level"
     */
    @IsOptional()
    @IsString({ message: "Level description must be a string" })
    @MaxLength(100, {
        message: "Level description cannot exceed 100 characters",
    })
    levelDescription?: string;

    /**
     * Name of the certification
     * @example "AWS Solutions Architect Professional"
     */
    @IsNotEmpty({ message: "Certification name is required" })
    @IsString({ message: "Certification name must be a string" })
    @MaxLength(200, {
        message: "Certification name cannot exceed 200 characters",
    })
    @MinLength(1, {
        message: "Certification name must be at least 1 character long",
    })
    name!: string;
}
