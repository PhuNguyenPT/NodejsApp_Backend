import { Expose, Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";

import { Rank } from "@/type/enum/rank.js";

/**
 * Data Transfer Object for Award information
 * @example
 * {
 *   "id": "3b9fb604-f40f-4253-b188-b2fe8c78bc54",
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
    // @Expose()
    // @IsOptional()
    // @Type(() => Date)
    // awardDate?: Date;

    // @Expose()
    // @IsOptional()
    // awardId?: string;

    // @Expose()
    // @IsOptional()
    // awardingOrganization?: string;

    @Expose()
    @IsNotEmpty()
    category!: string;

    // @Expose()
    // @IsOptional()
    // description?: string;

    @Expose()
    @IsNotEmpty()
    id!: string;

    @Expose()
    @IsNotEmpty()
    @Type(() => String)
    level!: Rank;

    @Expose()
    @IsNotEmpty()
    name!: string;
}
