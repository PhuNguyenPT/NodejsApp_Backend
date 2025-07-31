// src/dto/common/page.response.ts
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
        this.totalPages = Math.ceil(totalElements / size);
        this.first = page === 0;
        this.last = page >= this.totalPages - 1;
        this.numberOfElements = content.length;
    }
}
