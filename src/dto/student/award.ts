import {
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

export class AwardDTO {
    @IsDateString({}, { message: "Award date must be a valid date" })
    @IsNotEmpty({ message: "Award date is required" })
    awardDate!: Date;

    @IsOptional()
    @IsString({ message: "Award ID must be a string" })
    @MaxLength(100, { message: "Award ID cannot exceed 100 characters" })
    awardId?: string;

    @IsOptional()
    @IsString({ message: "Awarding organization must be a string" })
    @MaxLength(200, {
        message: "Awarding organization cannot exceed 200 characters",
    })
    awardingOrganization?: string;

    @IsOptional()
    @IsString({ message: "Category must be a string" })
    @MaxLength(100, { message: "Category cannot exceed 100 characters" })
    category!: string;

    @IsNotEmpty({ message: "Description is required" })
    @IsString({ message: "Description must be a string" })
    @MaxLength(5000, { message: "Description cannot exceed 5000 characters" })
    @MinLength(1, { message: "Description must be at least 1 character long" })
    description?: string;

    @IsOptional()
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    level?: string;

    @IsNotEmpty({ message: "Award name is required" })
    @IsString({ message: "Award name must be a string" })
    @MaxLength(200, { message: "Award name cannot exceed 200 characters" })
    @MinLength(1, { message: "Award name must be at least 1 character long" })
    name!: string;
}
