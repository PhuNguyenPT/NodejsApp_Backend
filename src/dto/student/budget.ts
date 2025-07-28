import { IsNotEmpty, IsNumber, Min } from "class-validator";

/**
 * Data Transfer Object for budget range specification.
 * Defines the minimum and maximum budget constraints for a student's financial preferences.
 *
 * Note: This version uses only built-in validators to avoid TSOA compatibility issues.
 * The min/max budget relationship validation is handled at the service layer.
 *
 * @example
 * ```json
 * {
 *   "minBudget": 5000000,
 *   "maxBudget": 20000000
 * }
 * ```
 */
export class BudgetDTO {
    /**
     * Maximum budget amount that the student is willing or able to spend.
     * Represents the upper limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     *
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     */
    @IsNotEmpty({ message: "Max budget is required" })
    @IsNumber({}, { message: "Max budget must be a number" })
    @Min(1, { message: "Max budget must be greater than 0" })
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     *
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     *
     * Note: The relationship validation (minBudget <= maxBudget) is handled in the service layer
     */
    @IsNotEmpty({ message: "Min budget is required" })
    @IsNumber({}, { message: "Min budget must be a number" })
    @Min(1, { message: "Min budget must be greater than 0" })
    minBudget!: number;
}
