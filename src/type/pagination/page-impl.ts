import { Expose, Type } from "class-transformer";

import {
    defaultPaginationConfig,
    PaginationConfig,
} from "@/config/pagination.config.js";

import { PageRequest } from "./page-request.js";
import { Page } from "./page.interface.js";
import { Pageable } from "./pageable.interface.js";
import { Sort } from "./sort.js";

/**
 * The default concrete implementation of the Page interface, mimicking Spring Boot's Page object.
 */
export class PageImpl<T> implements Page<T> {
    @Expose()
    readonly content: T[];

    @Expose()
    readonly first: boolean;

    readonly hasNext: boolean;

    readonly hasPrevious: boolean;

    @Expose()
    readonly last: boolean;
    @Expose()
    readonly number: number;

    @Expose()
    readonly numberOfElements: number;

    @Expose()
    readonly size: number;

    @Expose()
    @Type(() => Sort)
    readonly sort: Sort;

    @Expose()
    readonly totalElements: number;

    @Expose()
    readonly totalPages: number;

    @Expose()
    get empty(): boolean {
        return this.numberOfElements === 0;
    }

    private readonly config: PaginationConfig;
    private readonly pageable: Pageable;

    constructor(
        content: T[],
        totalElements: number,
        pageable: Pageable,
        config: PaginationConfig = defaultPaginationConfig,
    ) {
        this.content = content;
        this.pageable = pageable;
        this.config = config;
        this.number = pageable.getPageNumber();
        this.size = pageable.getPageSize();
        this.totalElements = totalElements;
        this.sort = pageable.getSort();
        this.totalPages =
            pageable.getPageSize() > 0
                ? Math.ceil(totalElements / pageable.getPageSize())
                : 0;
        this.first = pageable.getPageNumber() === 0;
        this.last =
            pageable.getPageNumber() >= this.totalPages - 1 ||
            this.totalPages === 0;
        this.numberOfElements = content.length;
        this.hasNext = !this.last;
        this.hasPrevious = !this.first;
    }

    /**
     * Creates an empty page with the given pageable information.
     */
    static empty<T>(pageable: Pageable): Page<T> {
        return new PageImpl<T>([], 0, pageable);
    }

    /**
     * Creates a new PageImpl instance from a list of content, total elements, and pageable details.
     */
    static of<T>(
        content: T[],
        totalElements: number,
        pageable: Pageable,
        config: PaginationConfig = defaultPaginationConfig,
    ): Page<T> {
        return new PageImpl<T>(content, totalElements, pageable, config);
    }

    getPageNumber(): number {
        return this.number;
    }

    hasContent(): boolean {
        return this.content.length > 0;
    }

    nextPageable(): Pageable {
        return this.hasNext
            ? this.pageable.next()
            : PageRequest.unpaged(this.sort);
    }

    previousPageable(): Pageable {
        return this.hasPrevious
            ? this.pageable.previousOrFirst()
            : PageRequest.unpaged(this.sort);
    }
}
