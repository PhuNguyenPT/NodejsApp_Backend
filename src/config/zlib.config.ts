import type { ZlibOptions } from "zlib";

export const COMPRESSION_OPTIONS: ZlibOptions = {
    level: 6, // Balance between speed and compression ratio (0-9, default is 6)
    memLevel: 8, // Memory usage for compression (1-9, default is 8)
    strategy: 0, // Z_DEFAULT_STRATEGY - good for most data
} as const;

export const DECOMPRESSION_OPTIONS: ZlibOptions = {
    maxOutputLength: 10 * 1024 * 1024, // 10MB limit to prevent decompression bombs
};

// ### Archives ###
// These are already compressed archives.
const ARCHIVE_MIMES: Set<string> = new Set<string>([
    "application/gzip",
    "application/vnd.rar",
    "application/x-7z-compressed",
    "application/x-zip-compressed",
    "application/zip",
]);

// ### Documents ###
// Modern document formats are zip containers.
const DOCUMENT_MIMES: Set<string> = new Set<string>([
    "application/pdf", // PDFs often contain compressed streams
    "application/vnd.oasis.opendocument.presentation", // .odp
    "application/vnd.oasis.opendocument.spreadsheet", // .ods
    "application/vnd.oasis.opendocument.text", // .odt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

// ### Images ###
// These formats use internal compression.
const IMAGE_MIMES: Set<string> = new Set<string>([
    "image/avif",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/jpeg",
    "image/jpg",
    "image/png", // Uses DEFLATE (same as gzip)
    "image/webp",
]);

// ### Audio ###
// Most audio formats are heavily compressed.
const AUDIO_MIMES: Set<string> = new Set<string>([
    "audio/aac",
    "audio/flac", // Lossless, but still compressed
    "audio/mpeg", // .mp3
    "audio/opus",
]);

// ### Video ###
// Video codecs are highly specialized compression.
const VIDEO_MIMES: Set<string> = new Set<string>([
    "video/mkv",
    "video/mp4",
    "video/quicktime", // .mov
    "video/webm",
]);

// ### Combined Set ###
// Combine all subsets into the final exportable Set.
export const INCOMPRESSIBLE_MIME_TYPES: Set<string> = new Set<string>([
    ...ARCHIVE_MIMES,
    ...AUDIO_MIMES,
    ...DOCUMENT_MIMES,
    ...IMAGE_MIMES,
    ...VIDEO_MIMES,
]);
