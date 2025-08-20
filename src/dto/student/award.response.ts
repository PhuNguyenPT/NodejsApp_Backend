import { Expose, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

/**
 * Data Transfer Object for Award information
 * @example
 * {
 *   "category": "Tiếng Anh",
 *   "level": "Hạng Nhất",
 *   "name": "Học sinh giỏi cấp quốc gia"
 * }
 * @example
 * {
 *   "awardDate": "2023-12-15",
 *   "awardId": "AWD-2023-001",
 *   "awardingOrganization": "International Science Foundation",
 *   "category": "Academic Excellence",
 *   "description": "Outstanding performance in advanced mathematics and research methodology.",
 *   "level": "Gold Medal",
 *   "name": "Excellence in Mathematics Award"
 * }
 */
export class AwardResponse {
    @Expose()
    @IsNotEmpty()
    @Type(() => Date)
    awardDate?: Date;

    @Expose()
    @IsOptional()
    awardId?: string;

    @Expose()
    @IsOptional()
    awardingOrganization?: string;

    @Expose()
    @IsNotEmpty()
    category!: string;

    @Expose()
    @IsOptional()
    description?: string;

    @Expose()
    @IsNotEmpty()
    id!: string;

    @Expose()
    @IsNotEmpty()
    level!: string;

    @Expose()
    @IsNotEmpty()
    name!: string;
}
