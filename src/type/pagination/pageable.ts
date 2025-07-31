import { Expose, Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { defaultPaginationConfig } from "@/config/pagination.config";

export class Pageable {
    /**
     * Page number (0-based)
     * @example 0
     */
    @Expose()
    @IsInt()
    @IsOptional()
    @Min(0)
    @Transform(({ value }) =>
        value !== undefined
            ? parseInt(String(value), 10)
            : defaultPaginationConfig.defaultPage,
    )
    @Type(() => Number)
    page?: number = defaultPaginationConfig.defaultPage;

    /**
     * Number of items per page
     * @example 20
     */
    @Expose()
    @IsInt()
    @IsOptional()
    @Max(2000) // Use config max
    @Min(1)
    @Transform(({ value }) =>
        value !== undefined
            ? parseInt(String(value), 10)
            : defaultPaginationConfig.defaultSize,
    )
    @Type(() => Number)
    size?: number = defaultPaginationConfig.defaultSize;

    /**
     * Sort specification in format "field,direction"
     * @example "createdAt,DESC"
     * @example "major,ASC"
     */
    @Expose()
    @IsOptional()
    @IsString()
    sort?: string = defaultPaginationConfig.defaultSort;

    // Helper method to get limit with configuration validation
    getLimit(): number {
        const requestedSize = this.size ?? defaultPaginationConfig.defaultSize;

        // Enforce max and min size limits
        return Math.min(
            Math.max(requestedSize, defaultPaginationConfig.minPageSize),
            defaultPaginationConfig.maxPageSize,
        );
    }

    // Helper method to get offset
    getOffset(): number {
        const currentPage = this.page ?? defaultPaginationConfig.defaultPage;
        return currentPage * this.getLimit();
    }

    // Helper method to parse sort with default fallback
    getParsedSort(): null | { direction: "ASC" | "DESC"; field: string } {
        const sortString = this.sort ?? defaultPaginationConfig.defaultSort;

        if (!sortString) return null;

        const [
            field,
            direction = defaultPaginationConfig.defaultSortDirection,
        ] = sortString.split(",");
        return {
            direction:
                direction.trim().toUpperCase() === "DESC" ? "DESC" : "ASC",
            field: field.trim(),
        };
    }

    /**
     * Parse multiple sort criteria (for advanced sorting)
     * @example "major,ASC;createdAt,DESC"
     */
    getParsedSorts(): { direction: "ASC" | "DESC"; field: string }[] {
        const sortString = this.sort ?? defaultPaginationConfig.defaultSort;

        if (!sortString) return [];

        return sortString.split(";").map((sortItem) => {
            const [
                field,
                direction = defaultPaginationConfig.defaultSortDirection,
            ] = sortItem.split(",");
            return {
                direction:
                    direction.trim().toUpperCase() === "DESC" ? "DESC" : "ASC",
                field: field.trim(),
            };
        });
    }

    // Get validation errors as key-value pairs for better API responses
    getValidationErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        const currentPage = this.page ?? defaultPaginationConfig.defaultPage;
        const currentSize = this.size ?? defaultPaginationConfig.defaultSize;

        if (currentPage < 0) {
            errors.page = "Page number must be 0 or greater";
        }

        if (currentSize < defaultPaginationConfig.minPageSize) {
            errors.size = `Page size must be at least ${defaultPaginationConfig.minPageSize.toString()}`;
        }

        if (currentSize > defaultPaginationConfig.maxPageSize) {
            errors.size = `Page size cannot exceed ${defaultPaginationConfig.maxPageSize.toString()}`;
        }

        return errors;
    }

    // Helper method to check if there are any validation errors
    hasValidationErrors(): boolean {
        return Object.keys(this.getValidationErrors()).length > 0;
    }

    // Validation method to check if the current configuration is valid
    isValid(): boolean {
        return !this.hasValidationErrors();
    }
}
