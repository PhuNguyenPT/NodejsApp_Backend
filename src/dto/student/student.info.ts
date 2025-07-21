// src/dto/student.info.ts
import { Type } from "class-transformer";
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";

import { AwardDTO } from "@/dto/student/award.js";
import { BudgetDTO } from "@/dto/student/budget.js"; // Assuming BudgetDTO is defined in a similar manner
import { CertificationDTO } from "@/dto/student/certification.js";
export class StudentInfoDTO {
    @IsArray({ message: "Awards must be an array" })
    @IsOptional()
    @Type(() => AwardDTO)
    @ValidateNested({ each: true })
    awards?: AwardDTO[];

    @IsNotEmpty({ message: "Budget is required" })
    @Type(() => BudgetDTO)
    @ValidateNested()
    budget!: BudgetDTO;

    @IsArray({ message: "Certifications must be an array" })
    @IsOptional()
    @Type(() => CertificationDTO)
    @ValidateNested({ each: true })
    certifications?: CertificationDTO[];

    @IsNotEmpty({ message: "Location is required" })
    @IsString({ message: "Location must be a string" })
    @MaxLength(500, { message: "Location cannot exceed 500 characters" })
    @MinLength(1, { message: "Location must be at least 1 character long" })
    location!: string;

    @IsNotEmpty({ message: "Major is required" })
    @IsString({ message: "Major must be a string" })
    @MaxLength(200, { message: "Major cannot exceed 200 characters" })
    @MinLength(1, { message: "Major must be at least 1 character long" })
    major!: string;
}
