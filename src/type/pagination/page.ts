// src/type/pagination/page.ts
import { Expose } from "class-transformer";

export class Page<T> {
    @Expose()
    content!: T[];

    @Expose()
    first!: boolean;

    @Expose()
    last!: boolean;

    @Expose()
    numberOfElements!: number;

    @Expose()
    page!: number;

    @Expose()
    size!: number;

    @Expose()
    totalElements!: number;

    @Expose()
    totalPages!: number;

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
        this.last = page >= this.totalPages;
        this.numberOfElements = content.length;
    }
}
