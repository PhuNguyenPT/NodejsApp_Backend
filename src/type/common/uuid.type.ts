import { type UUID as NodeUUID } from "node:crypto";
import { z } from "zod";

export type UUID = NodeUUID & z.BRAND<"UUID">;
export const UUIDSchema = z
    .string()
    .uuid("Invalid UUID format")
    .brand<"UUID">() as unknown as z.ZodType<UUID>;
