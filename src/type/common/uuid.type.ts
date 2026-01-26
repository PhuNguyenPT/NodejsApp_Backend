import { type UUID as NodeUUID } from "node:crypto";
import { z } from "zod";

/**
 * @pattern ^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$
 * @format uuid
 */
export type UUID = NodeUUID & z.BRAND<"UUID">;
export const UUIDSchema = z
    .string()
    .uuid("Invalid UUID format")
    .brand<"UUID">() as unknown as z.ZodType<UUID>;
