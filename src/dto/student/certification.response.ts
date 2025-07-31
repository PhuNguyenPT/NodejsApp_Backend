import { Expose, Type } from "class-transformer";
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
export class CertificationResponse {
    @Expose()
    credentialId?: string;

    @Expose()
    @Type(() => Date)
    expirationDate!: Date;

    @Expose()
    id!: string;

    @Expose()
    @Type(() => Date)
    issueDate!: Date;

    @Expose()
    issuingOrganization?: string;

    @Expose()
    level!: string;

    @Expose()
    levelDescription?: string;

    @Expose()
    name!: string;
}
