import { Expose } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

import { NationalExcellentStudentExamSubject } from "@/type/enum/national.excellent.student.subject.js";
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
export class AwardRequest {
    // @Expose()
    // @IsDate({ message: "Award date must be a valid date" })
    // @IsOptional()
    // @Type(() => Date)
    // awardDate?: Date;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Award ID must be a string" })
    // @MaxLength(100, { message: "Award ID cannot exceed 100 characters" })
    // awardId?: string;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Awarding organization must be a string" })
    // @MaxLength(200, {
    //     message: "Awarding organization cannot exceed 200 characters",
    // })
    // awardingOrganization?: string;

    @Expose()
    @IsEnum(NationalExcellentStudentExamSubject)
    @IsNotEmpty({ message: "Category is required" })
    category!: NationalExcellentStudentExamSubject;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Description must be a string" })
    // @MaxLength(5000, { message: "Description cannot exceed 5000 characters" })
    // @MinLength(1, { message: "Description must be at least 1 character long" })
    // description?: string;

    @Expose()
    @IsEnum(Rank)
    @IsNotEmpty({ message: "Level is required" })
    level!: Rank;

    @Expose()
    @IsNotEmpty({ message: "Award name is required" })
    @IsString({ message: "Award name must be a string" })
    @MaxLength(200, { message: "Award name cannot exceed 200 characters" })
    @MinLength(1, { message: "Award name must be at least 1 character long" })
    name!: string;
}
