import { Expose } from "class-transformer";
import { IsEnum, IsNumber, Max, Min } from "class-validator";

import { L3NationalSubject } from "@/dto/prediction/l3-national-subject.enum.js";

import { ToTwoDecimals } from "../../transformer/to-two-decimals.decorator.js";

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
