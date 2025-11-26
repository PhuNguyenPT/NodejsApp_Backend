import { Expose } from "class-transformer";
import { IsEnum, IsNumber, Max, Min } from "class-validator";

import { ToTwoDecimals } from "@/decorator/to-two-decimals.decorator.js";

import { L3NationalSubject } from "./l3-national-subject.enum.js";

export class THPTSubjectScore {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    score!: number;

    @Expose()
    @IsEnum(L3NationalSubject)
    subject_name!: L3NationalSubject;
}
