import { Expose, Type } from "class-transformer";
import {
    IsDate,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

/**
 * Data Transfer Object for Certification information
 * @example
 * {
 *   "issueDate": "2023-01-15",
 *   "expirationDate": "2025-01-15",
 *   "level": "6.5",
 *   "name": "IELTS"
 * }
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
    @Expose()
    @IsOptional()
    @IsString({ message: "Credential ID must be a string" })
    @MaxLength(100, { message: "Credential ID cannot exceed 100 characters" })
    credentialId?: string;

    @Expose()
    @IsDate({ message: "Expiration date must be a valid date" })
    @IsNotEmpty({ message: "Expiration date is required" })
    @Type(() => Date)
    expirationDate!: Date;

    @Expose()
    @IsDate({ message: "Issue date must be a valid date" })
    @IsNotEmpty({ message: "Issue date is required" })
    @Type(() => Date)
    issueDate!: Date;

    @Expose()
    @IsOptional()
    @IsString({ message: "Issuing organization must be a string" })
    @MaxLength(200, {
        message: "Issuing organization cannot exceed 200 characters",
    })
    @MinLength(1, {
        message: "Issuing organization must be at least 1 character long",
    })
    issuingOrganization?: string;

    @Expose()
    @IsNotEmpty({ message: "Level is required" })
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    @MinLength(1, { message: "Level must be at least 1 character long" })
    level!: string;

    @Expose()
    @IsOptional()
    @IsString({ message: "Level description must be a string" })
    @MaxLength(100, {
        message: "Level description cannot exceed 100 characters",
    })
    levelDescription?: string;

    @Expose()
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
