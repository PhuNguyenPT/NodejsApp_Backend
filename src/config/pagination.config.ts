import { config } from "@/util/validate.env";

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
    defaultPage: config.PAGINATION_DEFAULT_PAGE, // Set default page to 1
    defaultSize: config.PAGINATION_DEFAULT_SIZE, // Spring Boot default: size 20
    defaultSortDirection: "ASC", // Default sort direction
    maxPageSize: config.PAGINATION_MAX_SIZE, // Spring Boot default: max 2000
    minPageSize: config.PAGINATION_MIN_SIZE, // Minimum page size: 1
};

export const paginationConfigs = {
    default: defaultPaginationConfig,
} as const;

export type PaginationConfigType = keyof typeof paginationConfigs;
