import { IsNotEmpty, IsNumber, Min } from "class-validator";

import {
    IsMinLessThanOrEqualMax,
    MinMaxRange,
} from "@/decorator/minx.max.range.decorator";

export class BudgetDTO implements MinMaxRange {
    @IsNotEmpty({ message: "Max budget is required" })
    @IsNumber({}, { message: "Max budget must be a number" })
    @Min(0, { message: "Max budget cannot be negative" })
    maxBudget!: number;

    @IsMinLessThanOrEqualMax({
        message: "Min budget must be less than or equal to max budget",
    })
    @IsNotEmpty({ message: "Min budget is required" })
    @IsNumber({}, { message: "Min budget must be a number" })
    @Min(0, { message: "Min budget cannot be negative" })
    minBudget!: number;
}
