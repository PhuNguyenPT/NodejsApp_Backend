import { Expose, Type } from "class-transformer";
import { IsArray, IsString, ValidateNested } from "class-validator";

/**
 * HTTP validation error that wraps multiple validation issues.
 */
export class HTTPValidationError {
    @Expose()
    @IsArray()
    @Type(() => ValidationError)
    @ValidateNested({ each: true })
    detail!: ValidationError[];
}

/**
 * Represents a single validation error from the API.
 */
export class ValidationError {
    /**
     * Location path of the validation error in the request
     * @example ["body", "fieldName"] or ["query", 0]
     */
    @Expose()
    @IsArray()
    loc!: (number | string)[];

    /**
     * Human-readable error message describing the validation issue
     */
    @Expose()
    @IsString()
    msg!: string;

    /**
     * Type/category of the validation error
     * @example "value_error", "type_error", "missing"
     */
    @Expose()
    @IsString()
    type!: string;
}
