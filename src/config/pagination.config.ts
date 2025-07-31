// src/config/pagination.config.ts
export interface PaginationConfig {
    defaultPage: number;
    defaultSize: number;
    defaultSort?: string;
    defaultSortDirection: "ASC" | "DESC";
    maxPageSize: number;
    minPageSize: number;
}

// Default pagination configuration (similar to Spring Boot defaults)
export const defaultPaginationConfig: PaginationConfig = {
    defaultPage: 0, // Spring Boot default: page 0
    defaultSize: 20, // Spring Boot default: size 20
    defaultSortDirection: "ASC", // Default sort direction
    maxPageSize: 2000, // Spring Boot default: max 2000
    minPageSize: 1, // Minimum page size
};

export const paginationConfigs = {
    default: defaultPaginationConfig,
} as const;

export type PaginationConfigType = keyof typeof paginationConfigs;
