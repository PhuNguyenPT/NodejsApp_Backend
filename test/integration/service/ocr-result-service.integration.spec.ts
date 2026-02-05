// test/integration/service/ocr-result-service.integration.spec.ts
import type { DataSource, Repository } from "typeorm";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/score-extraction-result.js";
import type { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import type { UUID } from "@/type/common/uuid.type.js";

import { iocContainer } from "@/app/ioc-container.js";
import { SubjectScore } from "@/dto/ocr/subject-score.dto.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import {
    FileEntity,
    FileStatus,
    FileType,
} from "@/entity/uni_guide/file.entity.js";
import {
    OcrResultEntity,
    OcrStatus,
} from "@/entity/uni_guide/ocr-result.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.enum.js";
import { Role } from "@/type/enum/user.enum.js";

describe("OcrResultService Integration Tests", () => {
    let dataSource: DataSource;
    let ocrResultService: IOcrResultService;
    let studentRepository: Repository<StudentEntity>;
    let fileRepository: Repository<FileEntity>;
    let ocrResultRepository: Repository<OcrResultEntity>;
    let userRepository: Repository<UserEntity>;

    const createdStudentIds: UUID[] = [];
    const createdFileIds: UUID[] = [];
    const createdOcrResultIds: UUID[] = [];
    const createdUserIds: UUID[] = [];

    // Path to test data
    const TEST_DATA_DIR = join(__dirname, "../data");

    // Helper to load real image file
    const loadRealImageFile = (filename: string): Buffer => {
        return readFileSync(join(TEST_DATA_DIR, filename));
    };

    // Helper to create mock file content
    const createMockFileContent = (size = 1000): Buffer => {
        return Buffer.from("a".repeat(size));
    };

    beforeAll(() => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        ocrResultService = iocContainer.get<IOcrResultService>(
            TYPES.IOcrResultService,
        );
        studentRepository = dataSource.getRepository(StudentEntity);
        fileRepository = dataSource.getRepository(FileEntity);
        ocrResultRepository = dataSource.getRepository(OcrResultEntity);
        userRepository = dataSource.getRepository(UserEntity);
    });

    afterAll(async () => {
        // Cleanup OCR results first (due to foreign key constraints)
        for (const ocrResultId of createdOcrResultIds) {
            await ocrResultRepository.delete(ocrResultId);
        }

        // Cleanup files
        for (const fileId of createdFileIds) {
            await fileRepository.delete(fileId);
        }

        // Cleanup students
        for (const studentId of createdStudentIds) {
            await studentRepository.delete(studentId);
        }

        // Cleanup users
        for (const userId of createdUserIds) {
            await userRepository.delete(userId);
        }
    });

    describe("createInitialOcrResults", () => {
        it("should create initial OCR results for multiple files", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Create files with real images
            const imageFiles = [
                "hb10-k1(b).webp",
                "hb10-k2(b).webp",
                "hb11-k1(b).webp",
                "hb11-k2(b).webp",
                "hb12-k1(b).webp",
                "hb12-k2(b).webp",
            ];

            const files: FileEntity[] = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const fileContent = loadRealImageFile(imageFiles[i]);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `test-file-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/test-file-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: imageFiles[i],
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
                files.push(file);
            }

            // Act
            const results = await ocrResultService.createInitialOcrResults(
                student.id,
                user.email,
                files,
            );
            results.forEach((result) => createdOcrResultIds.push(result.id));

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(6);
            results.forEach((result, index) => {
                expect(result.id).toBeDefined();
                expect(result.studentId).toBe(student.id);
                expect(result.fileId).toBe(files[index].id);
                expect(result.status).toBe(OcrStatus.PROCESSING);
                expect(result.createdBy).toBe(user.email);
                expect(result.scores).toBeNull();
                expect(result.errorMessage).toBeNull();
            });
        });

        it("should return empty array when no files provided", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Act
            const results = await ocrResultService.createInitialOcrResults(
                student.id,
                user.email,
                [],
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(0);
        });

        it("should skip files that already have OCR results", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Create files with real images
            const imageFiles = ["hb11-k2(b).webp", "hb12-k1(b).webp"];
            const files: FileEntity[] = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const fileContent = loadRealImageFile(imageFiles[i]);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `duplicate-test-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/duplicate-test-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: imageFiles[i],
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
                files.push(file);
            }

            // Create initial OCR result for first file
            const existingOcrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: files[0].id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(existingOcrResult.id);

            // Act - Try to create OCR results for both files
            const results = await ocrResultService.createInitialOcrResults(
                student.id,
                user.email,
                files,
            );
            results.forEach((result) => createdOcrResultIds.push(result.id));

            // Assert - Should only create OCR result for the second file
            expect(results.length).toBe(1);
            expect(results[0].fileId).toBe(files[1].id);
            expect(results[0].status).toBe(OcrStatus.PROCESSING);
        });

        it("should handle concurrent creation attempts with pessimistic locking", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Create a file with real image
            const fileContent = loadRealImageFile("hb12-k2(b).webp");
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "concurrent-test.webp",
                    filePath: `/uploads/${student.id}/concurrent-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb12-k2(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act - Try to create OCR results concurrently
            const promises = [
                ocrResultService.createInitialOcrResults(
                    student.id,
                    user.email,
                    [file],
                ),
                ocrResultService.createInitialOcrResults(
                    student.id,
                    user.email,
                    [file],
                ),
            ];

            const results = await Promise.all(promises);
            results.forEach((resultArray) => {
                resultArray.forEach((result) =>
                    createdOcrResultIds.push(result.id),
                );
            });

            // Assert - Only one should succeed in creating the record
            const successfulResults = results.filter((r) => r.length > 0);
            expect(successfulResults.length).toBe(1);
            expect(successfulResults[0].length).toBe(1);
        });

        it("should create OCR results for anonymous student", async () => {
            // Arrange
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: Role.ANONYMOUS,
                    fileContent,
                    fileName: "anonymous-test.webp",
                    filePath: `/uploads/${student.id}/anonymous-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "anonymous-test.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const results = await ocrResultService.createInitialOcrResults(
                student.id,
                Role.ANONYMOUS,
                [file],
            );
            results.forEach((result) => createdOcrResultIds.push(result.id));

            // Assert
            expect(results.length).toBe(1);
            expect(results[0].createdBy).toBe(Role.ANONYMOUS);
            expect(results[0].studentId).toBe(student.id);
            expect(results[0].status).toBe(OcrStatus.PROCESSING);
        });

        it("should create OCR results for all 6 test image files concurrently", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Use all 6 test images
            const imageFiles = [
                "hb10-k1(b).webp",
                "hb10-k2(b).webp",
                "hb11-k1(b).webp",
                "hb11-k2(b).webp",
                "hb12-k1(b).webp",
                "hb12-k2(b).webp",
            ];

            const files: FileEntity[] = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const fileContent = loadRealImageFile(imageFiles[i]);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `batch-test-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/batch-test-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: imageFiles[i],
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
                files.push(file);
            }

            // Act
            const results = await ocrResultService.createInitialOcrResults(
                student.id,
                user.email,
                files,
            );
            results.forEach((result) => createdOcrResultIds.push(result.id));

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(6);
            results.forEach((result, index) => {
                expect(result.id).toBeDefined();
                expect(result.studentId).toBe(student.id);
                expect(result.fileId).toBe(files[index].id);
                expect(result.status).toBe(OcrStatus.PROCESSING);
                expect(result.createdBy).toBe(user.email);
                expect(result.scores).toBeNull();
                expect(result.errorMessage).toBeNull();
            });

            // Verify each file has a unique OCR result
            const fileIds = new Set(results.map((r) => r.fileId));
            expect(fileIds.size).toBe(6);
        });
    });

    describe("markAsFailed", () => {
        it("should mark OCR results as failed with error message", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "fail-test.webp",
                    filePath: `/uploads/${student.id}/fail-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "fail-test.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            const ocrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: file.id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(ocrResult.id);

            const startTime = performance.now();
            const errorMessage = "OCR processing failed due to API error";

            // Act
            await ocrResultService.markAsFailed(
                [ocrResult],
                errorMessage,
                startTime,
            );

            // Assert
            const updatedResult = await ocrResultRepository.findOne({
                where: { id: ocrResult.id },
            });
            expect(updatedResult).toBeDefined();
            expect(updatedResult?.status).toBe(OcrStatus.FAILED);
            expect(updatedResult?.errorMessage).toBe(errorMessage);
            expect(updatedResult?.metadata).toBeDefined();
            expect(updatedResult?.metadata?.successfulFiles).toBe(0);
            expect(updatedResult?.metadata?.failedFiles).toBe(1);
            expect(updatedResult?.metadata?.totalFilesProcessed).toBe(1);
            expect(updatedResult?.metadata?.ocrModel).toBe("unknown");
            expect(
                updatedResult?.metadata?.processingTimeMs,
            ).toBeGreaterThanOrEqual(0);
        });

        it("should handle empty array gracefully", async () => {
            // Arrange
            const startTime = performance.now();

            // Act & Assert - Should not throw
            await expect(
                ocrResultService.markAsFailed([], "Test error", startTime),
            ).resolves.toBeUndefined();
        });

        it("should mark multiple OCR results as failed", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const ocrResults: OcrResultEntity[] = [];
            for (let i = 0; i < 3; i++) {
                const fileContent = createMockFileContent(500);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `multi-fail-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/multi-fail-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: `multi-fail-${i.toString()}.webp`,
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);

                const ocrResult = await ocrResultRepository.save(
                    new OcrResultEntity({
                        createdBy: user.email,
                        fileId: file.id,
                        status: OcrStatus.PROCESSING,
                        studentId: student.id,
                    }),
                );
                createdOcrResultIds.push(ocrResult.id);
                ocrResults.push(ocrResult);
            }

            const startTime = performance.now();
            const errorMessage = "Batch processing failed";

            // Act
            await ocrResultService.markAsFailed(
                ocrResults,
                errorMessage,
                startTime,
            );

            // Assert
            for (const ocrResult of ocrResults) {
                const updated = await ocrResultRepository.findOne({
                    where: { id: ocrResult.id },
                });
                expect(updated?.status).toBe(OcrStatus.FAILED);
                expect(updated?.errorMessage).toBe(errorMessage);
                expect(updated?.metadata?.failedFiles).toBe(3);
            }
        });
    });

    describe("updateResults", () => {
        it("should update OCR results with successful extraction", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "success-test.webp",
                    filePath: `/uploads/${student.id}/success-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "success-test.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            const ocrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: file.id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(ocrResult.id);

            const processingStartTime = performance.now();
            const scores: SubjectScore[] = [
                new SubjectScore({ name: TranscriptSubject.TOAN, score: 8.5 }),
                new SubjectScore({
                    name: TranscriptSubject.NGU_VAN,
                    score: 7.0,
                }),
                new SubjectScore({
                    name: TranscriptSubject.TIENG_ANH,
                    score: 9.0,
                }),
            ];

            const fileResult: FileScoreExtractionResult = {
                documentAnnotation: "Grade 10 transcript",
                fileId: file.id,
                fileName: "success-test.webp",
                scores,
                success: true,
            };

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [fileResult],
                success: true,
            };

            // Act
            const results = await ocrResultService.updateResults(
                [ocrResult],
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results.length).toBe(1);
            const updated = results[0];
            expect(updated.status).toBe(OcrStatus.COMPLETED);
            expect(updated.scores).toBeDefined();
            expect(updated.scores?.length).toBe(3);
            expect(updated.documentAnnotation).toBe("Grade 10 transcript");
            expect(updated.errorMessage).toBeNull();
            expect(updated.metadata).toBeDefined();
            expect(updated.metadata?.ocrModel).toBe("mistral-pixtral-12b-2409");
            expect(updated.metadata?.successfulFiles).toBe(1);
            expect(updated.metadata?.failedFiles).toBe(0);
            expect(updated.metadata?.totalFilesProcessed).toBe(1);
            expect(updated.metadata?.processingTimeMs).toBeGreaterThanOrEqual(
                0,
            );
        });

        it("should update OCR results with failed extraction", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "failed-extraction.webp",
                    filePath: `/uploads/${student.id}/failed-extraction.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "failed-extraction.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            const ocrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: file.id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(ocrResult.id);

            const processingStartTime = performance.now();
            const fileResult: FileScoreExtractionResult = {
                error: "Failed to extract scores from image",
                fileId: file.id,
                fileName: "test-file.webp",
                scores: [],
                success: false,
            };

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [fileResult],
                success: false,
            };

            // Act
            const results = await ocrResultService.updateResults(
                [ocrResult],
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results.length).toBe(1);
            const updated = results[0];
            expect(updated.status).toBe(OcrStatus.FAILED);
            expect(updated.scores).toBeNull();
            expect(updated.errorMessage).toBe(
                "Failed to extract scores from image",
            );
            expect(updated.metadata?.successfulFiles).toBe(0);
            expect(updated.metadata?.failedFiles).toBe(1);
        });
        it("should handle batch with mixed success and failure results", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const ocrResults: OcrResultEntity[] = [];
            const fileResults: FileScoreExtractionResult[] = [];

            // Create 2 files - one will succeed, one will fail
            for (let i = 0; i < 2; i++) {
                const fileContent = createMockFileContent(500);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `mixed-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/mixed-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: `mixed-${i.toString()}.webp`,
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);

                const ocrResult = await ocrResultRepository.save(
                    new OcrResultEntity({
                        createdBy: user.email,
                        fileId: file.id,
                        status: OcrStatus.PROCESSING,
                        studentId: student.id,
                    }),
                );
                createdOcrResultIds.push(ocrResult.id);
                ocrResults.push(ocrResult);

                if (i === 0) {
                    // Success case
                    fileResults.push({
                        documentAnnotation: "Valid transcript",
                        fileId: file.id,
                        fileName: "test-file.webp",
                        scores: [
                            new SubjectScore({
                                name: TranscriptSubject.TOAN,
                                score: 8.0,
                            }),
                        ],
                        success: true,
                    });
                } else {
                    // Failure case
                    fileResults.push({
                        error: "Image quality too low",
                        fileId: file.id,
                        fileName: "test-file.webp",
                        scores: [],
                        success: false,
                    });
                }
            }

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: fileResults,
                success: true,
            };

            const processingStartTime = performance.now();

            // Act
            const results = await ocrResultService.updateResults(
                ocrResults,
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results.length).toBe(2);

            // Check successful result
            expect(results[0].status).toBe(OcrStatus.COMPLETED);
            expect(results[0].scores?.length).toBe(1);
            expect(results[0].errorMessage).toBeNull();

            // Check failed result
            expect(results[1].status).toBe(OcrStatus.FAILED);
            expect(results[1].scores).toBeNull();
            expect(results[1].errorMessage).toBe("Image quality too low");

            // Check metadata
            expect(results[0].metadata?.successfulFiles).toBe(1);
            expect(results[0].metadata?.failedFiles).toBe(1);
            expect(results[0].metadata?.totalFilesProcessed).toBe(2);
        });

        it("should update batch of 6 files with mixed success and failure results", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Use all 6 test images
            const imageFiles = [
                "hb10-k1(b).webp",
                "hb10-k2(b).webp",
                "hb11-k1(b).webp",
                "hb11-k2(b).webp",
                "hb12-k1(b).webp",
                "hb12-k2(b).webp",
            ];

            const ocrResults: OcrResultEntity[] = [];
            const fileResults: FileScoreExtractionResult[] = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const fileContent = loadRealImageFile(imageFiles[i]);
                const file = await fileRepository.save(
                    new FileEntity({
                        createdBy: user.email,
                        fileContent,
                        fileName: `batch-mixed-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/batch-mixed-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: imageFiles[i],
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);

                const ocrResult = await ocrResultRepository.save(
                    new OcrResultEntity({
                        createdBy: user.email,
                        fileId: file.id,
                        status: OcrStatus.PROCESSING,
                        studentId: student.id,
                    }),
                );
                createdOcrResultIds.push(ocrResult.id);
                ocrResults.push(ocrResult);

                // Simulate alternating success/failure
                if (i % 2 === 0) {
                    // Success cases (files 0, 2, 4)
                    fileResults.push({
                        documentAnnotation: `Grade ${String(10 + Math.floor(i / 2))} transcript`,
                        fileId: file.id,
                        fileName: "test-file.webp",
                        scores: [
                            new SubjectScore({
                                name: TranscriptSubject.TOAN,
                                score: 8.0 + i * 0.5,
                            }),
                            new SubjectScore({
                                name: TranscriptSubject.NGU_VAN,
                                score: 7.5 + i * 0.3,
                            }),
                            new SubjectScore({
                                name: TranscriptSubject.TIENG_ANH,
                                score: 9.0 - i * 0.2,
                            }),
                        ],
                        success: true,
                    });
                } else {
                    // Failure cases (files 1, 3, 5)
                    fileResults.push({
                        error: `Processing failed for ${imageFiles[i]}`,
                        fileId: file.id,
                        fileName: "test-file.webp",
                        scores: [],
                        success: false,
                    });
                }
            }

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: fileResults,
                success: true,
            };

            const processingStartTime = performance.now();

            // Act
            const results = await ocrResultService.updateResults(
                ocrResults,
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results.length).toBe(6);

            // Check successful results (indices 0, 2, 4)
            const successfulResults = results.filter((_r, i) => i % 2 === 0);
            expect(successfulResults.length).toBe(3);
            successfulResults.forEach((result) => {
                expect(result.status).toBe(OcrStatus.COMPLETED);
                expect(result.scores?.length).toBe(3);
                expect(result.errorMessage).toBeNull();
                expect(result.documentAnnotation).toContain("Grade");
            });

            // Check failed results (indices 1, 3, 5)
            const failedResults = results.filter((_r, i) => i % 2 === 1);
            expect(failedResults.length).toBe(3);
            failedResults.forEach((result) => {
                expect(result.status).toBe(OcrStatus.FAILED);
                expect(result.scores).toBeNull();
                expect(result.errorMessage).toContain("Processing failed");
            });

            // Check metadata (should be same for all results in batch)
            results.forEach((result) => {
                expect(result.metadata?.successfulFiles).toBe(3);
                expect(result.metadata?.failedFiles).toBe(3);
                expect(result.metadata?.totalFilesProcessed).toBe(6);
                expect(result.metadata?.ocrModel).toBe(
                    "mistral-pixtral-12b-2409",
                );
                expect(
                    result.metadata?.processingTimeMs,
                ).toBeGreaterThanOrEqual(0);
            });
        });

        it("should handle empty array gracefully", async () => {
            // Arrange
            const processingStartTime = performance.now();
            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [],
                success: true,
            };

            // Act
            const results = await ocrResultService.updateResults(
                [],
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(0);
        });

        it("should mark as failed when processing result not found", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "missing-result.webp",
                    filePath: `/uploads/${student.id}/missing-result.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "missing-result.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            const ocrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: file.id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(ocrResult.id);

            const processingStartTime = performance.now();
            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [],
                success: true, // Empty results - no match for our OCR result
            };

            // Act
            const results = await ocrResultService.updateResults(
                [ocrResult],
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(results.length).toBe(1);
            expect(results[0].status).toBe(OcrStatus.FAILED);
            expect(results[0].errorMessage).toBe(
                "Processing result not found for this file.",
            );
        });

        it("should calculate processing time correctly", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "timing-test.webp",
                    filePath: `/uploads/${student.id}/timing-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "timing-test.webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            const ocrResult = await ocrResultRepository.save(
                new OcrResultEntity({
                    createdBy: user.email,
                    fileId: file.id,
                    status: OcrStatus.PROCESSING,
                    studentId: student.id,
                }),
            );
            createdOcrResultIds.push(ocrResult.id);

            const processingStartTime = performance.now();
            // Simulate some processing time
            await new Promise((resolve) => setTimeout(resolve, 100));

            const fileResult: FileScoreExtractionResult = {
                fileId: file.id,
                fileName: "test-file.webp",
                scores: [
                    new SubjectScore({
                        name: TranscriptSubject.TOAN,
                        score: 8.0,
                    }),
                ],
                success: true,
            };

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [fileResult],
                success: true,
            };

            // Act
            const results = await ocrResultService.updateResults(
                [ocrResult],
                batchResult,
                processingStartTime,
            );

            // Assert
            expect(
                results[0].metadata?.processingTimeMs,
            ).toBeGreaterThanOrEqual(0);

            // Verify it matches the actual time difference
            const actualElapsed = Math.round(
                performance.now() - processingStartTime,
            );
            expect(results[0].metadata?.processingTimeMs).toBeLessThanOrEqual(
                actualElapsed,
            );
        });
    });

    describe("Integration Flow", () => {
        it("should handle complete OCR workflow from creation to completion", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = loadRealImageFile("hb10-k1(b).webp");
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "workflow-test.webp",
                    filePath: `/uploads/${student.id}/workflow-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb10-k1(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Step 1: Create initial OCR result
            const initialResults =
                await ocrResultService.createInitialOcrResults(
                    student.id,
                    user.email,
                    [file],
                );
            createdOcrResultIds.push(initialResults[0].id);

            expect(initialResults[0].status).toBe(OcrStatus.PROCESSING);

            // Step 2: Simulate OCR processing and update with results
            const processingStartTime = performance.now();
            const fileResult: FileScoreExtractionResult = {
                documentAnnotation: "High school transcript",
                fileId: file.id,
                fileName: "test-file.webp",
                scores: [
                    new SubjectScore({
                        name: TranscriptSubject.TOAN,
                        score: 9.0,
                    }),
                    new SubjectScore({
                        name: TranscriptSubject.NGU_VAN,
                        score: 8.5,
                    }),
                    new SubjectScore({
                        name: TranscriptSubject.TIENG_ANH,
                        score: 9.5,
                    }),
                ],
                success: true,
            };

            const batchResult: BatchScoreExtractionResult = {
                ocrModel: "mistral-pixtral-12b-2409",
                results: [fileResult],
                success: true,
            };

            const updatedResults = await ocrResultService.updateResults(
                initialResults,
                batchResult,
                processingStartTime,
            );

            // Step 3: Verify final state
            const finalResult = await ocrResultRepository.findOne({
                where: {
                    id: updatedResults[0].id,
                },
            });

            expect(finalResult).toBeDefined();
            expect(finalResult?.status).toBe(OcrStatus.COMPLETED);
            expect(finalResult?.scores?.length).toBe(3);
            expect(finalResult?.documentAnnotation).toBe(
                "High school transcript",
            );
            expect(finalResult?.metadata?.successfulFiles).toBe(1);
            expect(finalResult?.metadata?.ocrModel).toBe(
                "mistral-pixtral-12b-2409",
            );
        });

        it("should handle complete OCR workflow with failure", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-ocr-result-service-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = loadRealImageFile("hb10-k2(b).webp");
            const file = await fileRepository.save(
                new FileEntity({
                    createdBy: user.email,
                    fileContent,
                    fileName: "workflow-fail-test.webp",
                    filePath: `/uploads/${student.id}/workflow-fail-test.webp`,
                    fileSize: fileContent.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb10-k2(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Step 1: Create initial OCR result
            const initialResults =
                await ocrResultService.createInitialOcrResults(
                    student.id,
                    user.email,
                    [file],
                );
            createdOcrResultIds.push(initialResults[0].id);

            // Step 2: Simulate failure
            const startTime = performance.now();
            await ocrResultService.markAsFailed(
                initialResults,
                "API rate limit exceeded",
                startTime,
            );

            // Step 3: Verify final state
            const finalResult = await ocrResultRepository.findOne({
                where: {
                    id: initialResults[0].id,
                },
            });

            expect(finalResult).toBeDefined();
            expect(finalResult?.status).toBe(OcrStatus.FAILED);
            expect(finalResult?.errorMessage).toBe("API rate limit exceeded");
            expect(finalResult?.metadata?.failedFiles).toBe(1);
            expect(finalResult?.metadata?.successfulFiles).toBe(0);
        });
    });
});
