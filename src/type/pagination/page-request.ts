import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import type { Pageable } from "@/type/pagination/pageable.interface.js";

import { defaultPaginationConfig } from "@/config/pagination.config.js";
import { Order, Sort } from "@/type/pagination/sort.js";

/**
 * DTO for handling pagination and sorting query parameters.
 * Contains only primitive types for TSOA compatibility.
 * Provides automatic validation and transformation of query parameters for pagination operations.
 *
 * @example
 * ```typescript
 * // URL: /api/items?page=2&size=10&sort=name,ASC;createdAt,DESC
 * const query: PageableQuery = {
 *   page: 2,
 *   size: 10,
 *   sort: "name,ASC;createdAt,DESC"
 * };
 * ```
 */
export class PageableQuery {
    /**
     * Page number for pagination (1-based).
     * Automatically transforms and validates the page number from query parameters.
     * Invalid values are automatically corrected to the default page number.
     *
     * @type {number}
     * @optional
     * @default 1
     * @minimum 1
     * @example 1
     * @example 5
     * @example 10
     * @validation
     * - Must be an integer
     * - Must be greater than or equal to the configured default page
     * - Invalid or missing values default to defaultPaginationConfig.defaultPage
     * - Automatically transforms string values to numbers
     */
    @IsInt()
    @IsOptional()
    @Min(defaultPaginationConfig.defaultPage, {
        message: `Page number must be ${defaultPaginationConfig.defaultPage.toString()} or greater`,
    })
    @Transform(({ value }) => {
        const pageNumber = parseInt(String(value), 10);
        return isNaN(pageNumber) ||
            pageNumber < defaultPaginationConfig.defaultPage
            ? defaultPaginationConfig.defaultPage
            : pageNumber;
    })
    @Type(() => Number)
    page?: number = defaultPaginationConfig.defaultPage;

    /**
     * Number of items per page for pagination.
     * Automatically transforms and validates the page size from query parameters.
     * Invalid values are automatically corrected to the default page size.
     *
     * @type {number}
     * @optional
     * @default 20
     * @minimum 1
     * @maximum 2000
     * @example 10
     * @example 20
     * @example 50
     * @validation
     * - Must be an integer
     * - Must be between configured minimum and maximum page sizes
     * - Invalid or missing values default to defaultPaginationConfig.defaultSize
     * - Automatically transforms string values to numbers
     */
    @IsInt()
    @IsOptional()
    @Max(defaultPaginationConfig.maxPageSize, {
        message: `Page size cannot exceed ${defaultPaginationConfig.maxPageSize.toString()}`,
    })
    @Min(defaultPaginationConfig.minPageSize, {
        message: `Page size must be at least ${defaultPaginationConfig.minPageSize.toString()}`,
    })
    @Transform(({ value }) => {
        const size = parseInt(String(value), 10);
        return isNaN(size) ? defaultPaginationConfig.defaultSize : size;
    })
    @Type(() => Number)
    size?: number = defaultPaginationConfig.defaultSize;

    /**
     * Sorting specification for result ordering.
     * Defines how the results should be sorted using field names and directions.
     * Supports multiple sort criteria separated by semicolons.
     *
     * @type {string}
     * @optional
     * @format "field,direction" or "field1,direction1;field2,direction2"
     * @example "createdAt,DESC"
     * @example "name,ASC"
     * @example "name,ASC;createdAt,DESC"
     * @example "price,DESC;name,ASC;id,ASC"
     * @validation
     * - Must be a valid string
     * - Direction can be "ASC" or "DESC" (case insensitive)
     * - Multiple sort criteria separated by semicolons
     * - Field and direction separated by comma
     * - Missing direction defaults to "ASC"
     * - Invalid or missing values result in unsorted results
     *
     * @description
     * Format: "field,direction" where:
     * - field: The property name to sort by
     * - direction: "ASC" for ascending, "DESC" for descending
     * - Multiple criteria: "field1,ASC;field2,DESC"
     */
    @IsOptional()
    @IsString()
    sort?: string;
}

/**
 * Basic implementation of Pageable interface following Spring Data patterns.
 * Provides comprehensive pagination and sorting functionality with internal state management.
 * Converts between API-friendly 1-based page numbers and internal 0-based indexing.
 *
 * @example
 * ```typescript
 * // Create from query parameters
 * const pageRequest = PageRequest.fromQuery({
 *   page: 2,
 *   size: 10,
 *   sort: "name,ASC"
 * });
 *
 * // Use for database queries
 * const offset = pageRequest.getOffset(); // 10
 * const limit = pageRequest.getPageSize(); // 10
 * const orderBy = pageRequest.toTypeOrmOrder(); // { name: "ASC" }
 * ```
 */
export class PageRequest implements Pageable {
    private readonly page: number; // Internal 0-based page number
    private readonly size: number;
    private readonly sort: Sort;

    private constructor(
        page: number,
        size: number,
        sort: Sort = Sort.unsorted(),
    ) {
        // Convert API page number to 0-based internal representation
        this.page = Math.max(0, page - defaultPaginationConfig.defaultPage);
        this.size = Math.max(1, size);
        this.sort = sort;
    }

    /**
     * Creates a PageRequest from query parameters.
     * Automatically parses sort specifications and validates page/size values.
     *
     * @param query - The pageable query parameters from HTTP request
     * @returns A new PageRequest instance with validated and normalized values
     *
     * @example
     * ```typescript
     * const query = { page: 2, size: 10, sort: "name,ASC;date,DESC" };
     * const pageRequest = PageRequest.fromQuery(query);
     * ```
     */
    static fromQuery(query: PageableQuery): PageRequest {
        const sort = query.sort
            ? this.parseSortFromString(query.sort)
            : Sort.unsorted();
        return PageRequest.of(
            query.page ?? defaultPaginationConfig.defaultPage,
            query.size ?? defaultPaginationConfig.defaultSize,
            sort,
        );
    }

    /**
     * Creates a new PageRequest with specified parameters.
     * Accepts API page numbers (1-based) and converts to internal representation.
     *
     * @param page - The page number (1-based)
     * @param size - The page size
     * @param sort - Optional sort specification
     * @returns A new PageRequest instance
     *
     * @example
     * ```typescript
     * const pageRequest = PageRequest.of(1, 20, Sort.by("name").ascending());
     * ```
     */
    static of(page: number, size: number, sort?: Sort): PageRequest {
        return new PageRequest(page, size, sort ?? Sort.unsorted());
    }

    /**
     * Creates a new unsorted PageRequest with specified size.
     * Uses the default page number from configuration.
     *
     * @param size - The page size
     * @returns A new unsorted PageRequest instance
     *
     * @example
     * ```typescript
     * const pageRequest = PageRequest.ofSize(50);
     * ```
     */
    static ofSize(size: number): PageRequest {
        return PageRequest.of(defaultPaginationConfig.defaultPage, size);
    }

    /**
     * Creates an unpaged PageRequest that returns all results.
     * Uses maximum safe integer as page size to effectively disable pagination.
     *
     * @param sort - Optional sort specification
     * @returns A new unpaged PageRequest instance
     *
     * @example
     * ```typescript
     * const pageRequest = PageRequest.unpaged(Sort.by("createdAt").descending());
     * ```
     */
    static unpaged(sort?: Sort): PageRequest {
        return new PageRequest(
            defaultPaginationConfig.defaultPage,
            Number.MAX_SAFE_INTEGER,
            sort ?? Sort.unsorted(),
        );
    }

    /**
     * Parses a sort string into a Sort object.
     * Handles multiple sort criteria and direction specifications.
     *
     * @private
     * @param sortStr - The sort string to parse
     * @returns A Sort object representing the parsed criteria
     */
    private static parseSortFromString(sortStr: string): Sort {
        if (!sortStr) return Sort.unsorted();

        const orders = sortStr.split(";").map((sortPart) => {
            const [field, direction] = sortPart.split(",");
            const sortDirection =
                direction && direction.trim().toUpperCase() === "DESC"
                    ? "DESC"
                    : "ASC";
            return new Order(field.trim(), sortDirection);
        });

        return Sort.by(...orders);
    }

    /**
     * Returns a PageRequest for the first page with the same size and sort.
     *
     * @returns A new PageRequest instance for the first page
     *
     * @example
     * ```typescript
     * const firstPage = pageRequest.first();
     * console.log(firstPage.getApiPageNumber()); // 1
     * ```
     */
    first(): PageRequest {
        return new PageRequest(
            defaultPaginationConfig.defaultPage,
            this.size,
            this.sort,
        );
    }

    /**
     * Get the API-friendly page number (1-based).
     * Converts internal 0-based page number to API format.
     *
     * @returns The 1-based page number for API responses
     *
     * @example
     * ```typescript
     * const pageNumber = pageRequest.getApiPageNumber(); // 1, 2, 3, etc.
     * ```
     */
    getApiPageNumber(): number {
        return this.page + defaultPaginationConfig.defaultPage;
    }

    /**
     * Calculate the offset for database queries.
     * Returns the number of records to skip for the current page.
     *
     * @returns The offset value for database queries
     *
     * @example
     * ```typescript
     * // Page 2, Size 10
     * const offset = pageRequest.getOffset(); // 10
     * ```
     */
    getOffset(): number {
        return this.page * this.size;
    }

    /**
     * Get the internal 0-based page number.
     * Used for calculations and internal processing.
     *
     * @returns The 0-based page number
     *
     * @example
     * ```typescript
     * const internalPageNumber = pageRequest.getPageNumber(); // 0, 1, 2, etc.
     * ```
     */
    getPageNumber(): number {
        return this.page;
    }

    /**
     * Get the page size (number of items per page).
     *
     * @returns The page size
     *
     * @example
     * ```typescript
     * const pageSize = pageRequest.getPageSize(); // 20
     * ```
     */
    getPageSize(): number {
        return this.size;
    }

    /**
     * Get the sort specification.
     *
     * @returns The Sort object containing sorting criteria
     *
     * @example
     * ```typescript
     * const sort = pageRequest.getSort();
     * const orderBy = sort.toTypeOrmOrder(); // { name: "ASC", date: "DESC" }
     * ```
     */
    getSort(): Sort {
        return this.sort;
    }

    /**
     * Get validation errors for the current PageRequest.
     * Checks page number and size against configuration limits.
     *
     * @returns A record of validation errors, empty if valid
     *
     * @example
     * ```typescript
     * const errors = pageRequest.getValidationErrors();
     * // { page: "Page number must be 1 or greater" }
     * ```
     */
    getValidationErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        const apiPageNumber = this.getApiPageNumber();

        if (apiPageNumber < defaultPaginationConfig.defaultPage) {
            errors.page = `Page number must be ${defaultPaginationConfig.defaultPage.toString()} or greater`;
        }

        if (this.size < defaultPaginationConfig.minPageSize && this.isPaged()) {
            errors.size = `Page size must be at least ${defaultPaginationConfig.minPageSize.toString()}`;
        }

        if (this.size > defaultPaginationConfig.maxPageSize && this.isPaged()) {
            errors.size = `Page size cannot exceed ${defaultPaginationConfig.maxPageSize.toString()}`;
        }

        return errors;
    }

    /**
     * Check if there is a previous page available.
     *
     * @returns True if a previous page exists
     *
     * @example
     * ```typescript
     * if (pageRequest.hasPrevious()) {
     *   const previousPage = pageRequest.previousOrFirst();
     * }
     * ```
     */
    hasPrevious(): boolean {
        return this.page > 0;
    }

    /**
     * Check if there are any validation errors.
     *
     * @returns True if validation errors exist
     *
     * @example
     * ```typescript
     * if (pageRequest.hasValidationErrors()) {
     *   throw new ValidationException(pageRequest.getValidationErrors());
     * }
     * ```
     */
    hasValidationErrors(): boolean {
        return Object.keys(this.getValidationErrors()).length > 0;
    }

    /**
     * Check if this PageRequest represents a paged query.
     * Returns false for unpaged queries that return all results.
     *
     * @returns True if the query is paged (limited)
     *
     * @example
     * ```typescript
     * if (pageRequest.isPaged()) {
     *   // Apply LIMIT and OFFSET to query
     * }
     * ```
     */
    isPaged(): boolean {
        return this.size < Number.MAX_SAFE_INTEGER;
    }

    /**
     * Check if this PageRequest represents an unpaged query.
     * Returns true for queries that should return all results.
     *
     * @returns True if the query is unpaged (unlimited)
     *
     * @example
     * ```typescript
     * if (pageRequest.isUnpaged()) {
     *   // Don't apply pagination to query
     * }
     * ```
     */
    isUnpaged(): boolean {
        return !this.isPaged();
    }

    /**
     * Get a PageRequest for the next page.
     * Maintains the same size and sort criteria.
     *
     * @returns A new PageRequest instance for the next page
     *
     * @example
     * ```typescript
     * const nextPage = pageRequest.next();
     * console.log(nextPage.getApiPageNumber()); // current + 1
     * ```
     */
    next(): PageRequest {
        return new PageRequest(
            this.getApiPageNumber() + 1,
            this.size,
            this.sort,
        );
    }

    /**
     * Get a PageRequest for the previous page, or first page if no previous exists.
     * Maintains the same size and sort criteria.
     *
     * @returns A new PageRequest instance for the previous page or first page
     *
     * @example
     * ```typescript
     * const previousPage = pageRequest.previousOrFirst();
     * // Always returns a valid page, never goes below page 1
     * ```
     */
    previousOrFirst(): PageRequest {
        return this.hasPrevious()
            ? new PageRequest(this.getApiPageNumber() - 1, this.size, this.sort)
            : this.first();
    }

    /**
     * Convert the sort specification to TypeORM FindOptions order format.
     * Transforms the internal Sort object to the format expected by TypeORM.
     *
     * @returns A record mapping field names to sort directions
     *
     * @example
     * ```typescript
     * const orderBy = pageRequest.toTypeOrmOrder();
     * // { name: "ASC", createdAt: "DESC", id: "ASC" }
     *
     * // Use with TypeORM
     * const entities = await repository.find({
     *   order: orderBy,
     *   skip: pageRequest.getOffset(),
     *   take: pageRequest.getPageSize()
     * });
     * ```
     */
    toTypeOrmOrder(): Record<string, "ASC" | "DESC"> {
        return this.sort.toTypeOrmOrder();
    }
}
