import { Expose, Transform } from "class-transformer";

import { defaultPaginationConfig } from "@/config/pagination.config.js";

export class Page<T> {
    @Expose()
    content: T[];

    @Expose()
    @Transform(({ value }) => (typeof value === "number" ? value === 0 : false)) // first = true when page number is 0 (internal)
    first: boolean;

    @Expose()
    hasNext: boolean;

    @Expose()
    hasPrevious: boolean;

    @Expose()
    last: boolean;

    @Expose()
    numberOfElements: number;

    @Expose()
    @Transform(({ value }) =>
        typeof value === "number"
            ? value + defaultPaginationConfig.defaultPage
            : 0,
    ) // Convert to API page number
    page: number;

    @Expose()
    size: number;

    @Expose()
    totalElements: number;

    @Expose()
    totalPages: number;

    constructor(
        content: T[],
        page: number, // Expects 0-based page number (like Spring Boot)
        size: number,
        totalElements: number,
    ) {
        this.content = content;
        this.page = page; // Store 0-based internally
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

        // All calculations use 0-based page number (like Spring Boot)
        this.first = page === 0;
        this.last = page >= this.totalPages - 1 || this.totalPages === 0;
        this.numberOfElements = content.length;
        this.hasNext = !this.last && this.totalPages > 0;
        this.hasPrevious = !this.first;
    }

    /**
     * Create an empty page (expects 0-based page number)
     */
    static empty<T>(page: number, size: number): Page<T> {
        return new Page<T>([], page, size, 0);
    }

    /**
     * Create a new Page instance (expects 0-based page number)
     */
    static of<T>(
        content: T[],
        page: number, // 0-based like Spring Boot
        size: number,
        totalElements: number,
    ): Page<T> {
        return new Page<T>(content, page, size, totalElements);
    }

    /**
     * Get API-friendly page number for manual use
     */
    getApiPageNumber(): number {
        return this.page + defaultPaginationConfig.defaultPage;
    }

    /**
     * Get page metadata for API responses
     */
    getMetadata() {
        return {
            first: this.first,
            hasNext: this.hasNext,
            hasPrevious: this.hasPrevious,
            last: this.last,
            numberOfElements: this.numberOfElements,
            page: this.getApiPageNumber(), // API-friendly page number
            size: this.size,
            totalElements: this.totalElements,
            totalPages: this.totalPages,
        };
    }

    /**
     * Get the internal 0-based page number (like Spring Boot's getNumber())
     */
    getNumber(): number {
        return this.page;
    }

    /**
     * Check if page has content
     */
    hasContent(): boolean {
        return this.content.length > 0;
    }

    /**
     * Check if page is empty
     */
    isEmpty(): boolean {
        return !this.hasContent();
    }
}
