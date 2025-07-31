import { Expose, Type } from "class-transformer";

/**
 * Data Transfer Object for Award information
 * @example
 * {
 *   "awardDate": "2023-12-15",
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
    @Type(() => Date)
    awardDate!: Date;

    @Expose()
    awardId?: string;

    @Expose()
    awardingOrganization?: string;

    @Expose()
    category!: string;

    @Expose()
    description?: string;

    @Expose()
    id!: string;

    @Expose()
    level!: string;

    @Expose()
    name!: string;
}
