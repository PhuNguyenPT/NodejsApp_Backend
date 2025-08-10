import { FileType } from "@/entity/file";

/**
 * Response object containing file metadata
 * @description Standard response format for file information without binary content
 */
export class FileResponse {
    /**
     * File creation timestamp
     * @description When the file was first uploaded to the system
     * @example new Date("2024-01-15T10:30:00.000Z")
     */
    createdAt!: Date;

    /**
     * Optional file description
     * @description Additional context or details about the file
     * @example "Student transcript for Fall 2024 semester"
     */
    description?: string;

    /**
     * Optional download URL
     * @description Direct URL for downloading the file (if applicable)
     * @example "/api/files/123e4567-e89b-12d3-a456-426614174000/download"
     */
    downloadUrl?: string;

    /**
     * Display filename
     * @description The name used for display and download purposes
     * @example "john_doe_transcript.pdf"
     */
    fileName!: string;

    /**
     * Human-readable file size
     * @description File size formatted for display (e.g., "1.5 MB")
     * @example "1.5 MB"
     */
    fileSize!: string;

    /**
     * File type categorization
     * @description Category that this file belongs to
     * @example "transcript"
     */
    fileType!: FileType;

    /**
     * Unique file identifier
     * @description UUID that uniquely identifies this file
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    id!: string;

    /**
     * Optional metadata object
     * @description Additional structured data associated with the file
     * @example { "semester": "Fall 2024", "grade": "A" }
     */
    metadata?: Record<string, unknown>;

    /**
     * MIME type of the file
     * @description Content type as determined by the system
     * @example "application/pdf"
     */
    mimeType!: string;

    /**
     * Last modification timestamp
     * @description When the file metadata was last updated
     * @example new Date("2024-01-20T14:45:00.000Z")
     */
    modifiedAt!: Date;

    /**
     * Original filename from upload
     * @description The filename as it was when originally uploaded
     * @example "transcript_fall_2024.pdf"
     */
    originalFileName!: string;

    /**
     * Optional preview URL for images
     * @description Direct URL for previewing image files inline
     * @example "/api/files/123e4567-e89b-12d3-a456-426614174000/preview"
     */
    previewUrl?: string;

    /**
     * File status
     * @description Current status of the file (active, deleted, etc.)
     * @example "active"
     */
    status!: string;

    /**
     * Foreign key to student
     * @description UUID of the student associated with this file
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    studentId!: string;

    /**
     * Optional file tags
     * @description Comma-separated tags for categorization
     * @example "academic,transcript,fall2024"
     */
    tags?: string;

    /**
     * Optional uploader identifier
     * @description UUID of the user who uploaded the file
     * @example "456e7890-e89b-12d3-a456-426614174001"
     */
    uploadedBy?: string;
}

/**
 * Response object for successful file uploads
 * @description Confirmation response returned after a file is successfully uploaded
 */
export class FileUploadResponse {
    /**
     * Optional download URL
     * @description Direct URL for downloading the file (if applicable)
     * @example "/files/123e4567-e89b-12d3-a456-426614174000/download"
     */
    downloadUrl?: string;

    /**
     * Display filename
     * @description The filename that will be used for display and download
     * @example "john_doe_transcript.pdf"
     */
    fileName!: string;

    /**
     * Internal file path
     * @description System path where the file is stored (for internal use)
     * @example "/uploads/students/123e4567-e89b-12d3-a456-426614174000/john_doe_transcript.pdf"
     */
    filePath!: string;

    /**
     * Human-readable file size
     * @description File size formatted for display
     * @example "1.5 MB"
     */
    fileSize!: string;

    /**
     * File type categorization
     * @description The category assigned to this file
     * @example "transcript"
     */
    fileType!: FileType;

    /**
     * Unique file identifier
     * @description UUID assigned to the uploaded file
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    id!: string;

    /**
     * Success message
     * @description Confirmation message for the upload operation
     * @example "File uploaded successfully"
     */
    message!: string;

    /**
     * Original filename from upload
     * @description The filename as provided during upload
     * @example "transcript_fall_2024.pdf"
     */
    originalFileName!: string;

    /**
     * Optional preview URL for images
     * @description Direct URL for previewing image files inline
     * @example "/files/123e4567-e89b-12d3-a456-426614174000/preview"
     */
    previewUrl?: string;
}
