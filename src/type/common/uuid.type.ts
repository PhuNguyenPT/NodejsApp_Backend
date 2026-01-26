import { type UUID as NodeUUID } from "node:crypto";
import { z } from "zod";

/**
 * RFC 4122 UUID string (any version).
 * See RFC 4122: https://datatracker.ietf.org/doc/html/rfc4122
 * @pattern ^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$
 * @format uuid
 */
export type TsoaUUID = string;

/**
 * RFC 4122 UUID string (any version).
 * See RFC 4122: https://datatracker.ietf.org/doc/html/rfc4122
 * @pattern ^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$
 * @format uuid
 */
export type UUID = NodeUUID & z.BRAND<"UUID">;
export const UUIDSchema = z
    .string()
    .uuid("Invalid UUID format")
    .transform((val) => val as UUID);
