import { Expose } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

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
export class AwardDTO {
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
    @IsNotEmpty({ message: "Category is required" })
    @IsString({ message: "Category must be a string" })
    @MaxLength(100, { message: "Category cannot exceed 100 characters" })
    category!: string;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Description must be a string" })
    // @MaxLength(5000, { message: "Description cannot exceed 5000 characters" })
    // @MinLength(1, { message: "Description must be at least 1 character long" })
    // description?: string;

    @Expose()
    @IsNotEmpty({ message: "Level is required" })
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    level!: string;

    @Expose()
    @IsNotEmpty({ message: "Award name is required" })
    @IsString({ message: "Award name must be a string" })
    @MaxLength(200, { message: "Award name cannot exceed 200 characters" })
    @MinLength(1, { message: "Award name must be at least 1 character long" })
    name!: string;
}
