// src/dto/file/file.metadata.ts
import { z } from "zod";

import { FileType } from "@/entity/file.js";

export const FileMetadataSchema = z.object({
    description: z.string().optional(),
    fileName: z.string().optional(),
    fileType: z.nativeEnum(FileType), // Use z.nativeEnum() for TypeScript enums
    tags: z.string().optional(),
});

export const FilesMetadataSchema = z.array(FileMetadataSchema);

export type FileMetadata = z.infer<typeof FileMetadataSchema>;
