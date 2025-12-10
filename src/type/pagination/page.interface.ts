import type { Pageable } from "@/type/pagination/pageable.interface.js";
import type { Sort } from "@/type/pagination/sort.js";

/**
 * An interface representing a paginated chunk of data, matching Spring Data's Page.
 */
export interface Page<T> {
    /** The page content. */
    readonly content: T[];

    /** Whether this is the first page. */
    readonly first: boolean;

    /** Returns the 0-based page number for internal use. */
    getPageNumber(): number;

    /** Whether the page has content. */
    hasContent(): boolean;

    /** Whether this is the last page. */
    readonly last: boolean;

    /** Returns the Pageable for the next page. */
    nextPageable(): Pageable;

    /** The 0-based page number. */
    readonly number: number;

    /** The number of elements on the current page. */
    readonly numberOfElements: number;

    /** Returns the Pageable for the previous page. */
    previousPageable(): Pageable;

    /** The current page size. */
    readonly size: number;

    /** The sorting parameters for the page. */
    readonly sort: Sort;

    /** The total number of elements across all pages. */
    readonly totalElements: number;

    /** The total number of pages available. */
    readonly totalPages: number;
}
