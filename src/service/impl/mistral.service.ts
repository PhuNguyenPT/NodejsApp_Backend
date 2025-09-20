import { responseFormatFromZodObject } from "@mistralai/mistralai/extra/structChat.js";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import { mistralClient } from "@/config/mistralai.config.js";
import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
    ScoreExtractionResult,
    TranscriptSchema,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { normalizeSubjectName } from "@/type/enum/subject.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";

@injectable()
export class MistralService {
    constructor(
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    /**
     * Extracts subject scores from a single file
     */
    public async extractSubjectScores(
        file: FileEntity,
        userId: string,
    ): Promise<FileScoreExtractionResult> {
        try {
            // Get the student to check access and get expected subjects
            const student = await this.studentRepository.findOne({
                where: { id: file.studentId },
            });

            if (!student) {
                return {
                    error: `Student not found for file ${file.id}`,
                    fileId: file.id,
                    fileName: file.originalFileName,
                    scores: [],
                    success: false,
                };
            }

            if (student.userId !== undefined && student.userId !== userId) {
                throw new AccessDeniedException("Access denied");
            }

            if (!file.isImage()) {
                return {
                    error: `File is not an image (MIME type: ${file.mimeType}).`,
                    fileId: file.id,
                    fileName: file.originalFileName,
                    scores: [],
                    success: false,
                };
            }

            const expectedSubjects =
                student.nationalExams?.map((exam) => exam.name) ?? [];
            const model = "mistral-ocr-latest";

            const result: ScoreExtractionResult =
                await this.extractScoresFromImage(
                    file,
                    expectedSubjects,
                    model,
                );

            return {
                documentAnnotation: result.documentAnnotation,
                error: result.error,
                fileId: file.id,
                fileName: file.originalFileName,
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
                fileId: file.id,
                fileName: file.originalFileName,
                scores: [],
                success: false,
            };
        }
    }

    /**
     * Extracts subject scores from a single file
     */
    public async extractSubjectScoresAnonymously(
        file: FileEntity,
    ): Promise<FileScoreExtractionResult> {
        try {
            // Get the student to check access and get expected subjects
            const student = await this.studentRepository.findOne({
                where: { id: file.studentId },
            });

            if (!student) {
                return {
                    error: `Student not found for file ${file.id}`,
                    fileId: file.id,
                    fileName: file.originalFileName,
                    scores: [],
                    success: false,
                };
            }

            if (!file.isImage()) {
                return {
                    error: `File is not an image (MIME type: ${file.mimeType}).`,
                    fileId: file.id,
                    fileName: file.originalFileName,
                    scores: [],
                    success: false,
                };
            }

            const expectedSubjects =
                student.nationalExams?.map((exam) => exam.name) ?? [];
            const model = "mistral-ocr-latest";

            const result: ScoreExtractionResult =
                await this.extractScoresFromImage(
                    file,
                    expectedSubjects,
                    model,
                );

            return {
                documentAnnotation: result.documentAnnotation,
                error: result.error,
                fileId: file.id,
                fileName: file.originalFileName,
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
                fileId: file.id,
                fileName: file.originalFileName,
                scores: [],
                success: false,
            };
        }
    }
    /**
     * Extracts subject scores from all files of a student (batch processing)
     */
    public async extractSubjectScoresBatch(
        student: StudentEntity,
        userId: string,
        fileIds: string[],
    ): Promise<BatchScoreExtractionResult> {
        try {
            if (student.userId !== undefined && student.userId !== userId) {
                throw new AccessDeniedException("Access denied");
            }
            if (!student.files || student.files.length === 0) {
                return {
                    error: `No files found for student ${student.id}`,
                    results: [],
                    success: false,
                };
            }

            // Filter to only the requested files
            const filesToProcess = student.files.filter((file) =>
                fileIds.includes(file.id),
            );

            if (filesToProcess.length === 0) {
                return {
                    error: `None of the requested files found for student ${student.id}`,
                    results: [],
                    success: false,
                };
            }

            const expectedSubjects =
                student.nationalExams?.map((exam) => exam.name) ?? [];
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
                        await this.extractScoresFromImage(
                            fileEntity,
                            expectedSubjects,
                            model,
                        );

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

            // Wait for all the parallel requests to complete
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
     * Extracts subject scores from all files of a student (batch processing)
     */
    public async extractSubjectScoresBatchAnonymously(
        student: StudentEntity,
        fileIds: string[],
    ): Promise<BatchScoreExtractionResult> {
        try {
            if (!student.files || student.files.length === 0) {
                return {
                    error: `No files found for student ${student.id}`,
                    results: [],
                    success: false,
                };
            }

            const filesToProcess = student.files.filter((file) =>
                fileIds.includes(file.id),
            );

            if (filesToProcess.length === 0) {
                return {
                    error: `None of the requested files found for student ${student.id}`,
                    results: [],
                    success: false,
                };
            }

            const expectedSubjects =
                student.nationalExams?.map((exam) => exam.name) ?? [];
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
                        await this.extractScoresFromImage(
                            fileEntity,
                            expectedSubjects,
                            model,
                        );

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

            // Wait for all the parallel requests to complete
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
            const student: null | StudentEntity =
                await this.studentRepository.findOne({
                    relations: ["files"],
                    select: ["id", "nationalExams", "userId", "files"],
                    where: { id: studentId },
                });

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

            const expectedSubjects =
                student.nationalExams?.map((exam) => exam.name) ?? [];
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
                        await this.extractScoresFromImage(
                            fileEntity,
                            expectedSubjects,
                            model,
                        );

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
        expectedSubjects: string[],
        modelName: string,
    ): Promise<ScoreExtractionResult> {
        try {
            const base64Image = fileEntity.fileContent.toString("base64");
            const imageDataUrl = `data:${fileEntity.mimeType};base64,${base64Image}`;

            const response = await mistralClient.ocr.process({
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

                const filteredScores = validated.subjects.filter((subject) =>
                    expectedSubjects.some((expected) => {
                        const normalizedScore = normalizeSubjectName(
                            subject.name,
                        );
                        const normalizedExpected =
                            normalizeSubjectName(expected);
                        return normalizedScore === normalizedExpected;
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
