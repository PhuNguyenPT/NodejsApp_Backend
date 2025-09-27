import { Transform, Type } from "class-transformer";
import { IsArray, IsNumberString, IsOptional, IsString } from "class-validator";

import {
    AdmissionField,
    ALLOWED_ADMISSION_FIELDS,
} from "@/entity/admission.entity.js";
import { PageableQuery } from "@/type/pagination/page-request.js";

/**
 * Helper function to transform comma-separated strings to arrays
 */
const transformToArray = ({
    value,
}: {
    value: unknown;
}): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === "string") {
        return value
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
    }
    if (typeof value === "number") {
        return [value.toString()];
    }
    // For other types, return undefined to avoid unexpected stringification
    return undefined;
};

/**
 * DTO for searching admissions with pagination support.
 * Extends PageableQuery to include pagination, sorting, and admission-specific search filters.
 * All search fields are optional and support multiple values for enhanced filtering.
 */
export class AdmissionSearchQuery extends PageableQuery {
    /**
     * Admission codes for filtering results.
     * Supports multiple admission codes for broader search capabilities.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    admissionCode?: string[];

    /**
     * Types of admission methods for filtering results.
     * Supports multiple admission types for comprehensive filtering.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    admissionType?: string[];

    /**
     * Full names/descriptions of admission types for filtering results.
     * Supports multiple admission type descriptions.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    admissionTypeName?: string[];

    /**
     * Major codes for filtering results by academic programs.
     * Supports multiple major codes for broader program search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsNumberString({}, { each: true })
    @IsOptional()
    @Transform(transformToArray)
    @Type(() => String)
    majorCode?: string[];

    /**
     * Major names for filtering results by academic program names.
     * Supports multiple major names for comprehensive program search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    majorName?: string[];

    /**
     * Provinces or cities for filtering results by geographic areas.
     * Supports multiple locations for broader geographic search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    province?: string[];

    /**
     * Study program types for filtering results.
     * Supports multiple program types for comprehensive filtering.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    studyProgram?: string[];

    /**
     * Subject combinations for filtering results.
     * Supports multiple subject combinations for broader search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    subjectCombination?: string[];

    /**
     * Tuition fees for filtering results by cost ranges.
     * Supports multiple tuition fee values for flexible cost filtering.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsNumberString({}, { each: true })
    @IsOptional()
    @Transform(transformToArray)
    @Type(() => String)
    tuitionFee?: string[];

    /**
     * University codes for filtering results by institutions.
     * Supports multiple university codes for broader institutional search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    uniCode?: string[];

    /**
     * University names for filtering results by institution names.
     * Supports multiple university names for comprehensive search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    uniName?: string[];

    /**
     * University types for filtering results by institution ownership.
     * Supports both public and private university filtering simultaneously.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    uniType?: string[];

    /**
     * University website URLs for filtering results.
     * Supports multiple university websites for comprehensive search.
     *
     * @type {string[]}
     * @optional
     */
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    @Transform(transformToArray)
    @Type(() => String)
    uniWebLink?: string[];
}

/**
 * Builds a search filters record from admission search query parameters.
 * Processes arrays of values for each field to create comprehensive filter objects.
 *
 * @param queryParams - The admission search query parameters from the HTTP request
 * @returns A record containing arrays of valid, non-empty search filters
 */
export function buildSearchFilters(
    queryParams: AdmissionSearchQuery,
): Record<AdmissionField, string[]> {
    const searchFilters = {} as Record<AdmissionField, string[]>;

    ALLOWED_ADMISSION_FIELDS.forEach((field) => {
        const values = queryParams[field];
        if (values && Array.isArray(values) && values.length > 0) {
            const filteredValues = values
                .filter(
                    (value): value is string =>
                        typeof value === "string" && value.trim().length > 0,
                )
                .map((value) => value.trim());

            if (filteredValues.length > 0) {
                searchFilters[field] = filteredValues;
            }
        }
    });

    return searchFilters;
}
