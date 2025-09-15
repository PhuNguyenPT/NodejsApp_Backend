import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { defaultPaginationConfig } from "@/config/pagination.config.js";

import { Pageable } from "./pageable.interface.js";
import { Order, Sort } from "./sort.js";

/**
 * DTO for handling query parameters - only contains primitive types for TSOA
 */
export class PageableQuery {
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

    @IsOptional()
    @IsString()
    sort?: string;
}

/**
 * Basic implementation of Pageable interface (Spring-like PageRequest)
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
     * Creates a PageRequest from query parameters
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
     * Creates a new PageRequest - accepts API page numbers (config-based)
     */
    static of(page: number, size: number, sort?: Sort): PageRequest {
        return new PageRequest(page, size, sort ?? Sort.unsorted());
    }

    /**
     * Creates a new unsorted PageRequest
     */
    static ofSize(size: number): PageRequest {
        return PageRequest.of(defaultPaginationConfig.defaultPage, size);
    }

    /**
     * Creates an unpaged PageRequest
     */
    static unpaged(sort?: Sort): PageRequest {
        return new PageRequest(
            defaultPaginationConfig.defaultPage,
            Number.MAX_SAFE_INTEGER,
            sort ?? Sort.unsorted(),
        );
    }

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

    first(): PageRequest {
        return new PageRequest(
            defaultPaginationConfig.defaultPage,
            this.size,
            this.sort,
        );
    }

    /**
     * Get API-friendly page number (config-based)
     */
    getApiPageNumber(): number {
        return this.page + defaultPaginationConfig.defaultPage;
    }

    getOffset(): number {
        return this.page * this.size;
    }

    /**
     * Get internal 0-based page number
     */
    getPageNumber(): number {
        return this.page;
    }

    getPageSize(): number {
        return this.size;
    }

    getSort(): Sort {
        return this.sort;
    }

    /**
     * Get validation errors
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

    hasPrevious(): boolean {
        return this.page > 0;
    }

    /**
     * Check if there are validation errors
     */
    hasValidationErrors(): boolean {
        return Object.keys(this.getValidationErrors()).length > 0;
    }

    isPaged(): boolean {
        return this.size < Number.MAX_SAFE_INTEGER;
    }

    isUnpaged(): boolean {
        return !this.isPaged();
    }

    next(): PageRequest {
        return new PageRequest(
            this.getApiPageNumber() + 1,
            this.size,
            this.sort,
        );
    }

    previousOrFirst(): PageRequest {
        return this.hasPrevious()
            ? new PageRequest(this.getApiPageNumber() - 1, this.size, this.sort)
            : this.first();
    }

    /**
     * Convert to TypeORM FindOptions order format
     */
    toTypeOrmOrder(): Record<string, "ASC" | "DESC"> {
        return this.sort.toTypeOrmOrder();
    }
}
