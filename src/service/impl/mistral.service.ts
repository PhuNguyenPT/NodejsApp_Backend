import { responseFormatFromZodObject } from "@mistralai/mistralai/extra/structChat.js";
import { OCRResponse } from "@mistralai/mistralai/models/components/ocrresponse.js";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { promisify } from "util";
import { Logger } from "winston";
import { gunzip, ZlibOptions } from "zlib";

import { mistralClient } from "@/config/mistralai.config.js";
import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
    ScoreExtractionResult,
} from "@/dto/ocr/score-extraction-result.js";
import {
    ISubjectScore,
    TranscriptSchema,
} from "@/dto/ocr/subject-score.interface.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";

const gunzipAsync = promisify(gunzip);
@injectable()
export class MistralService implements IMistralService {
    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
        @inject(TYPES.DecompressionOptions)
        private readonly DECOMPRESSION_OPTIONS: ZlibOptions,
    ) {}

    /**
     * Extracts subject scores from a single file
     * @param fileId - The ID of the file to extract scores from
     * @param userId - Optional user ID for access control (omit for anonymous access)
     */
    public async extractSubjectScores(
        fileId: string,
        userId?: string,
    ): Promise<FileScoreExtractionResult> {
        try {
            const query = this.fileRepository
                .createQueryBuilder("files")
                .leftJoinAndSelect("files.student", "student")
                .addSelect("files.fileContent")
                .where("files.id = :fileId", { fileId })
                .andWhere("files.status = :status", { status: "active" });

            if (userId) {
                query.andWhere("student.userId = :userId", { userId });
            } else {
                query.andWhere("student.userId IS NULL");
            }

            const fileEntity = await query.getOne();

            // Set the file name now that we know if fileEntity exists
            const originalFileName = fileEntity?.originalFileName;

            if (!fileEntity) {
                return {
                    error: `File ${fileId} not found, inactive, or access denied.`,
                    fileId: fileId,
                    fileName: originalFileName ?? `Unknown File (${fileId})`,
                    scores: [],
                    success: false,
                };
            }

            if (!fileEntity.isImage()) {
                return {
                    error: `File is not an image (MIME type: ${fileEntity.mimeType}).`,
                    fileId: fileEntity.id,
                    fileName: fileEntity.originalFileName,
                    scores: [],
                    success: false,
                };
            }

            const model = "mistral-ocr-latest";

            const result: ScoreExtractionResult =
                await this.extractScoresFromImage(fileEntity, model);

            return {
                documentAnnotation: result.documentAnnotation,
                error: result.error,
                fileId: fileEntity.id,
                fileName: fileEntity.originalFileName,
                scores: result.scores,
                success: result.success,
            };
        } catch (error) {
            this.logger.error(
                `Error during extractSubjectScores for single file: `,
                { error },
            );
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error during score extraction";
            return {
                error: errorMessage,
                fileId: fileId,
                fileName: `Unknown File (${fileId})`,
                scores: [],
                success: false,
            };
        }
    }

    /**
     * Extracts subject scores from all files of a student (batch processing)
     * @param student - The student entity
     * @param fileIds - Array of file IDs to process
     * @param userId - Optional user ID for access control (omit for anonymous access)
     */
    public async extractSubjectScoresBatch(
        student: StudentEntity,
        fileIds: string[],
        userId?: string,
    ): Promise<BatchScoreExtractionResult> {
        try {
            const filesToProcess = await this.fileRepository
                .createQueryBuilder("files")
                .addSelect("files.fileContent")
                .where("files.studentId = :studentId", {
                    studentId: student.id,
                })
                .andWhere("files.id IN (:...fileIds)", { fileIds })
                .andWhere("files.status = :status", { status: "active" })
                .getMany();

            if (filesToProcess.length === 0) {
                return {
                    error: `No active files found for student ${student.id} among the requested IDs`,
                    results: [],
                    success: false,
                };
            }

            if (
                userId &&
                student.userId !== undefined &&
                student.userId !== userId
            ) {
                throw new AccessDeniedException("Access denied");
            }

            const model = "mistral-ocr-latest";

            const extractionPromises = filesToProcess.map(
                async (fileEntity): Promise<FileScoreExtractionResult> => {
                    if (!fileEntity.isImage()) {
                        return {
                            error: `File is not an image (MIME type: ${fileEntity.mimeType}).`,
                            fileId: fileEntity.id,
                            fileName: fileEntity.originalFileName,
                            scores: [],
                            success: false,
                        };
                    }

                    const result: ScoreExtractionResult =
                        await this.extractScoresFromImage(fileEntity, model);

                    return {
                        documentAnnotation: result.documentAnnotation,
                        error: result.error,
                        fileId: fileEntity.id,
                        fileName: fileEntity.originalFileName,
                        scores: result.scores,
                        success: result.success,
                    };
                },
            );

            const extractionResults = await Promise.all(extractionPromises);

            return {
                ocrModel: model,
                results: extractionResults,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Error during extractSubjectScoresBatch: `, {
                error,
            });
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error during score extraction";
            return {
                error: errorMessage,
                results: [],
                success: false,
            };
        }
    }

    /**
     * Extracts subject scores from transcript images for a given student.
     * It processes each file associated with the student and returns a structured result per file.
     * @param studentId The ID of the student.
     * @param userId The ID of the authenticated user.
     * @returns A Promise that resolves to BatchScoreExtractionResult, containing a list of results for each file.
     */
    public async extractSubjectScoresByUserId(
        studentId: string,
        userId: string,
    ): Promise<BatchScoreExtractionResult> {
        try {
            const student: null | StudentEntity = await this.studentRepository
                .createQueryBuilder("student")
                .select([
                    "student.id",
                    "student.userId",
                    "student.nationalExams",
                    "files",
                ])
                .leftJoinAndSelect("student.files", "files")
                .addSelect("files.fileContent")
                .where("student.id = :studentId", { studentId })
                .getOne();

            if (!student) {
                return {
                    error: `Student ${studentId} not found`,
                    results: [],
                    success: false,
                };
            }

            if (student.userId !== undefined && student.userId !== userId) {
                throw new AccessDeniedException("Access denied");
            }

            if (!student.files || student.files.length === 0) {
                return {
                    error: `No files found for student ${studentId}`,
                    results: [],
                    success: false,
                };
            }

            const model = "mistral-ocr-latest";

            const extractionPromises = student.files.map(
                async (fileEntity): Promise<FileScoreExtractionResult> => {
                    if (!fileEntity.isImage()) {
                        return {
                            error: `File is not an image (MIME type: ${fileEntity.mimeType}).`,
                            fileId: fileEntity.id,
                            fileName: fileEntity.originalFileName,
                            scores: [],
                            success: false,
                        };
                    }

                    const result: ScoreExtractionResult =
                        await this.extractScoresFromImage(fileEntity, model);

                    return {
                        documentAnnotation: result.documentAnnotation,
                        error: result.error,
                        fileId: fileEntity.id,
                        fileName: fileEntity.originalFileName,
                        scores: result.scores,
                        success: result.success,
                    };
                },
            );

            const extractionResults = await Promise.all(extractionPromises);

            return {
                ocrModel: model,
                results: extractionResults,
                success: true,
            };
        } catch (error) {
            this.logger.error(`Error during extractSubjectScoresByUserId: `, {
                error,
            });
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error during score extraction";
            return {
                error: errorMessage,
                results: [],
                success: false,
            };
        }
    }

    /**
     * Extracts scores from a single image FileEntity.
     * @param fileEntity The FileEntity object of the image to process.
     * @param expectedSubjects An array of expected subject names for filtering.
     * @returns A Promise that resolves to ScoreExtractionResult.
     */
    private async extractScoresFromImage(
        fileEntity: FileEntity,
        modelName: string,
    ): Promise<ScoreExtractionResult> {
        try {
            // Decompress file content if it's compressed
            let fileContent = fileEntity.fileContent;
            if (fileEntity.metadata?.isCompressed) {
                try {
                    fileContent = await gunzipAsync(
                        fileEntity.fileContent,
                        this.DECOMPRESSION_OPTIONS,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to decompress file ${fileEntity.id} for OCR processing`,
                        { error },
                    );
                    return {
                        error: "Failed to decompress file content",
                        scores: [],
                        success: false,
                    };
                }
            }

            // Now use the decompressed content
            const base64Image = fileContent.toString("base64");

            // Now use the decompressed content
            const imageDataUrl = `data:${fileEntity.mimeType};base64,${base64Image}`;

            const response: OCRResponse = await mistralClient.ocr.process({
                document: {
                    imageUrl: imageDataUrl,
                    type: "image_url",
                },
                documentAnnotationFormat:
                    responseFormatFromZodObject(TranscriptSchema),
                includeImageBase64: false,
                model: modelName,
            });

            if (response.documentAnnotation) {
                const validated = TranscriptSchema.parse(
                    JSON.parse(response.documentAnnotation),
                );

                // Use a Map to store the highest score for each subject.
                const highestScores = new Map<TranscriptSubject, number>();

                for (const subject of validated.subjects) {
                    const existingScore = highestScores.get(subject.name);
                    // If the subject isn't in the map or the new score is higher, update it.
                    if (
                        existingScore === undefined ||
                        subject.score > existingScore
                    ) {
                        highestScores.set(subject.name, subject.score);
                    }
                }

                // Convert the map back to an array of objects.
                const filteredScores: ISubjectScore[] = Array.from(
                    highestScores,
                    ([name, score]) => ({
                        name: name,
                        score,
                    }),
                );

                return {
                    documentAnnotation: response.documentAnnotation,
                    scores: filteredScores,
                    success: true,
                };
            }

            return {
                error: "No document annotation found in OCR response",
                scores: [],
                success: false,
            };
        } catch (error) {
            this.logger.error(
                `Error extracting scores from image ${fileEntity.id}: `,
                { error },
            );
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : `Extraction failed for file ${fileEntity.id}`,
                scores: [],
                success: false,
            };
        }
    }
}
