import { Expose } from "class-transformer";
import { IsEnum, IsNotEmpty } from "class-validator";

import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";

/**
 * Data Transfer Object for Award information
 * @example
 * {
 *   "category": "Tiếng Anh",
 *   "level": "Hạng Nhất",
 *   "name": "Học sinh giỏi cấp quốc gia"
 * }
 */
export class AwardDTO {
    @Expose()
    @IsEnum(NationalExcellentStudentExamSubject)
    @IsNotEmpty({ message: "Category is required" })
    category!: NationalExcellentStudentExamSubject;

    @Expose()
    @IsEnum(Rank)
    @IsNotEmpty({ message: "Level is required" })
    level!: Rank;

    @Expose()
    @IsEnum(NationalExcellentExamType)
    @IsNotEmpty({ message: "Award name is required" })
    name!: NationalExcellentExamType;
}
