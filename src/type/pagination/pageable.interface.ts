// src/type/pagination/pageable.interface.ts
import { Sort } from "./sort.js";

/**
 * Interface for pagination information (Spring-like)
 */
export interface Pageable {
    /**
     * Returns the Pageable requesting the first page
     */
    first(): Pageable;

    /**
     * Returns the offset to be taken according to the underlying page and page size
     */
    getOffset(): number;

    /**
     * Returns the page to be returned (0-indexed for internal use, 1-indexed for API)
     */
    getPageNumber(): number;

    /**
     * Returns the size of the page to be returned
     */
    getPageSize(): number;

    /**
     * Returns the sorting parameters
     */
    getSort(): Sort;

    /**
     * Returns whether there's a previous Pageable we can access from the current one
     */
    hasPrevious(): boolean;

    /**
     * Returns whether the current Pageable is paged
     */
    isPaged(): boolean;

    /**
     * Returns whether the current Pageable is unpaged
     */
    isUnpaged(): boolean;

    /**
     * Returns the Pageable requesting the next page
     */
    next(): Pageable;

    /**
     * Returns the previous Pageable or the first Pageable if the current one already is the first one
     */
    previousOrFirst(): Pageable;
}
