import { Expose, Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";

import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national.excellent.exam.js";
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
    @Type(() => String)
    category!: NationalExcellentStudentExamSubject;

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
    @Type(() => String)
    name!: NationalExcellentExamType;
}
