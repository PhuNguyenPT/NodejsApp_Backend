import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class BudgetDTO {
  @IsNotEmpty({ message: "Max budget is required" })
  @IsNumber({}, { message: "Max budget must be a number" })
  @Min(0, { message: "Max budget cannot be negative" })
  maxBudget!: number;

  @IsNotEmpty({ message: "Min budget is required" })
  @IsNumber({}, { message: "Min budget must be a number" })
  @Min(0, { message: "Min budget cannot be negative" })
  minBudget!: number;
}
