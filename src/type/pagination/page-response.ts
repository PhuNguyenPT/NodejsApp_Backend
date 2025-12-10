import { Page } from "@/type/pagination/page.interface.js";
import { Sort } from "@/type/pagination/sort.js";

/**
 * Clean DTO for paginated responses without internal implementation details
 */
export class PageResponse<T> {
    readonly content: T[];
    readonly first: boolean;
    readonly last: boolean;
    readonly number: number;
    readonly numberOfElements: number;
    readonly size: number;
    readonly sort: Sort;
    readonly totalElements: number;
    readonly totalPages: number;

    get empty(): boolean {
        return this.numberOfElements === 0;
    }

    constructor(
        content: T[],
        first: boolean,
        last: boolean,
        number: number,
        numberOfElements: number,
        size: number,
        sort: Sort,
        totalElements: number,
        totalPages: number,
    ) {
        this.content = content;
        this.first = first;
        this.last = last;
        this.number = number;
        this.numberOfElements = numberOfElements;
        this.size = size;
        this.sort = sort;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    static fromPage<T>(page: Page<T>): PageResponse<T> {
        return new PageResponse<T>(
            page.content,
            page.first,
            page.last,
            page.number,
            page.numberOfElements,
            page.size,
            page.sort,
            page.totalElements,
            page.totalPages,
        );
    }
}
