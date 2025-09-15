// src/type/pagination/page.ts
import { Expose } from "class-transformer";

export class Page<T> {
    @Expose()
    content: T[];

    @Expose()
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
    page: number;

    @Expose()
    size: number;

    @Expose()
    totalElements: number;

    @Expose()
    totalPages: number;

    constructor(
        content: T[],
        page: number,
        size: number,
        totalElements: number,
    ) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
        this.first = page === 1;
        this.last = page >= this.totalPages || this.totalPages === 0;
        this.numberOfElements = content.length;
        this.hasNext = !this.last && this.totalPages > 0;
        this.hasPrevious = !this.first;
    }

    /**
     * Create an empty page
     */
    static empty<T>(page: number, size: number): Page<T> {
        return new Page<T>([], page, size, 0);
    }

    /**
     * Create a new Page instance
     */
    static of<T>(
        content: T[],
        page: number,
        size: number,
        totalElements: number,
    ): Page<T> {
        return new Page<T>(content, page, size, totalElements);
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
            page: this.page,
            size: this.size,
            totalElements: this.totalElements,
            totalPages: this.totalPages,
        };
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
