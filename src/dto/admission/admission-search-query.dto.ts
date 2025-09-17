import { IsNumberString, IsOptional, IsString } from "class-validator";

import {
    AdmissionSearchField,
    ALLOWED_ADMISSION_SEARCH_FIELDS,
} from "@/entity/admission.entity.js";
import { PageableQuery } from "@/type/pagination/page-request.js";

/**
 * DTO for searching admissions with pagination support.
 * Extends PageableQuery to include pagination, sorting, and admission-specific search filters.
 * All search fields are optional and support partial matching for text fields and exact matching for numeric fields.
 */
export class AdmissionSearchQuery extends PageableQuery {
    /**
     * Admission code for filtering results.
     * Used to search for specific admission programs by their unique identifier.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "FUV-7460112-TUYỂN THẲNG"
     * @example "GTS748020101AĐGNL"
     */
    @IsOptional()
    @IsString()
    admissionCode?: string;

    /**
     * Type of admission method for filtering results.
     * Used to filter admissions by their admission methodology (e.g., direct admission, exam-based, etc.).
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "UTXT"
     * @example "ĐGNL"
     * @example "THPTQG"
     */
    @IsOptional()
    @IsString()
    admissionType?: string;

    /**
     * Full name/description of the admission type for filtering results.
     * Used to search by the detailed description of admission methods.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "Sử dụng phương thức tuyển thẳng"
     * @example "Sử dụng điểm thi Đánh giá Năng lực"
     */
    @IsOptional()
    @IsString()
    admissionTypeName?: string;

    /**
     * Major code for filtering results by academic program.
     * Must be a valid numeric string representing the major classification code.
     * Uses exact matching for precise program identification.
     *
     * @type {string}
     * @optional
     * @validation Must contain only numeric characters
     * @example "7480201"
     * @example "7460112"
     * @example "7520212"
     */
    @IsNumberString()
    @IsOptional()
    majorCode?: string;

    /**
     * Major name for filtering results by academic program name.
     * Used to search for specific fields of study or academic disciplines.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "Công nghệ thông tin"
     * @example "Kỹ thuật y sinh"
     * @example "Toán ứng dụng"
     */
    @IsOptional()
    @IsString()
    majorName?: string;

    /**
     * Province or city location for filtering results by geographic area.
     * Used to find admissions in specific Vietnamese provinces or cities.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "TP. Hồ Chí Minh"
     * @example "Cần Thơ"
     */
    @IsOptional()
    @IsString()
    province?: string;

    /**
     * Study program type for filtering results.
     * Used to filter by different types of academic programs or tracks.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "Đại trà"
     * @example "Chất lượng cao"
     */
    @IsOptional()
    @IsString()
    studyProgram?: string;

    /**
     * Subject combination for filtering results by exam subject requirements.
     * Used to search for admissions based on required subject combinations for entrance.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "VNUHCM"
     * @example "UTXT"
     * @example "A00"
     */
    @IsOptional()
    @IsString()
    subjectCombination?: string;

    /**
     * Tuition fee for filtering results by cost.
     * Must be a valid numeric string representing the tuition fee in Vietnamese Dong.
     * Uses exact matching for precise fee filtering.
     *
     * @type {string}
     * @optional
     * @validation Must contain only numeric characters
     * @example "50000000"
     * @example "467600000"
     * @example "35000000"
     */
    @IsNumberString()
    @IsOptional()
    tuitionFee?: string;

    /**
     * University code for filtering results by institution.
     * Used to search for admissions from specific universities or colleges.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "FUV"
     * @example "NTT"
     * @example "DVL"
     */
    @IsOptional()
    @IsString()
    uniCode?: string;

    /**
     * University name for filtering results by institution name.
     * Used to search for admissions from universities by their full name.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "TRƯỜNG ĐẠI HỌC FULBRIGHT VIỆT NAM"
     * @example "TRƯỜNG ĐẠI HỌC NGUYỄN TẤT THÀNH"
     */
    @IsOptional()
    @IsString()
    uniName?: string;

    /**
     * University type for filtering results by institution ownership.
     * Used to filter between public and private universities.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "Tư thục"
     * @example "Công lập"
     */
    @IsOptional()
    @IsString()
    uniType?: string;

    /**
     * University website URL for filtering results.
     * Used to search by university website links.
     * Supports partial matching with case-insensitive search.
     *
     * @type {string}
     * @optional
     * @example "https://fulbright.edu.vn/"
     * @example "https://ntt.edu.vn/"
     */
    @IsOptional()
    @IsString()
    uniWebLink?: string;
}

/**
 * Builds a search filters record from admission search query parameters.
 * Processes the query parameters to create a clean filter object with only non-empty values.
 * Automatically trims whitespace and filters out invalid entries.
 *
 * @param queryParams - The admission search query parameters from the HTTP request
 * @returns A record containing only valid, non-empty search filters
 *
 * @example
 * ```typescript
 * const queryParams = {
 *   uniCode: "FUV",
 *   majorName: "Công nghệ thông tin",
 *   tuitionFee: "50000000",
 *   page: 1,
 *   size: 20
 * };
 *
 * const filters = buildSearchFilters(queryParams);
 * // Result: {
 * //   uniCode: "FUV",
 * //   majorName: "Công nghệ thông tin",
 * //   tuitionFee: "50000000"
 * // }
 * ```
 *
 * @validation
 * - Filters out null, undefined, and empty string values
 * - Trims whitespace from all string values
 * - Only includes fields that are in the ALLOWED_ADMISSION_SEARCH_FIELDS whitelist
 * - Numeric fields (majorCode, tuitionFee) should be validated by class-validator decorators
 */
export function buildSearchFilters(
    queryParams: AdmissionSearchQuery,
): Record<AdmissionSearchField, string> {
    const searchFilters = {} as Record<AdmissionSearchField, string>;

    ALLOWED_ADMISSION_SEARCH_FIELDS.forEach((field) => {
        const value = queryParams[field];
        if (value && typeof value === "string" && value.trim()) {
            searchFilters[field] = value.trim();
        }
    });

    return searchFilters;
}
