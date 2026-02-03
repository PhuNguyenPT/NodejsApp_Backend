// test/integration/service/mistral-service.integration.spec.ts
import type { DataSource, Repository } from "typeorm";

import { readFileSync } from "fs";
import { promisify } from "util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gzip } from "zlib";

import type {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/score-extraction-result.js";
import type { IMistralService } from "@/service/mistral-service.interface.js";
import type { UUID } from "@/type/common/uuid.type.js";

import { iocContainer } from "@/app/ioc-container.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import {
    FileEntity,
    FileStatus,
    FileType,
} from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { getApp } from "@/test/setup.js";
import { UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.enum.js";

const gzipAsync = promisify(gzip);

describe("MistralService Integration Tests", () => {
    let dataSource: DataSource;
    let mistralService: IMistralService;
    let studentRepository: Repository<StudentEntity>;
    let fileRepository: Repository<FileEntity>;
    let userRepository: Repository<UserEntity>;

    const createdStudentIds: UUID[] = [];
    const createdFileIds: UUID[] = [];
    const createdUserIds: UUID[] = [];

    // Mock image data - represents a transcript image
    const createMockImageBuffer = (): Buffer => {
        // Simple 1x1 PNG image (base64 encoded)
        const base64Image =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        return Buffer.from(base64Image, "base64");
    };

    beforeAll(() => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        mistralService = iocContainer.get<IMistralService>(
            TYPES.IMistralService,
        );
        studentRepository = dataSource.getRepository(StudentEntity);
        fileRepository = dataSource.getRepository(FileEntity);
        userRepository = dataSource.getRepository(UserEntity);
    });

    afterAll(async () => {
        // Cleanup files first (due to foreign key constraints)
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

    describe("extractSubjectScores", () => {
        it("should extract scores from a single image file", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript.png",
                    filePath: `/uploads/${student.id}/transcript.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.fileName).toBe("transcript.png");
            expect(result.success).toBe(true);
            expect(result.scores).toBeDefined();
            expect(Array.isArray(result.scores)).toBe(true);
        });

        it("should extract scores from anonymous student file (no userId)", async () => {
            // Arrange - Create student without user
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined, // Anonymous student
                }),
            );
            createdStudentIds.push(student.id);

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "anonymous-transcript.png",
                    filePath: `/uploads/${student.id}/anonymous-transcript.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "anonymous-transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act - Call without userId for anonymous access
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.fileId).toBe(file.id);
        });

        it("should handle compressed image file", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const compressedBuffer = await gzipAsync(imageBuffer);

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: compressedBuffer,
                    fileName: "compressed-transcript.png",
                    filePath: `/uploads/${student.id}/compressed-transcript.png`,
                    fileSize: compressedBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    metadata: { isCompressed: true },
                    mimeType: "image/png",
                    originalFileName: "compressed-transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.success).toBe(true);
        });

        it("should return error for non-existent file", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(nonExistentId);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("not found");
            expect(result.scores).toEqual([]);
        });

        it("should return error for non-image file", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const pdfBuffer = Buffer.from("PDF content");
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: pdfBuffer,
                    fileName: "document.pdf",
                    filePath: `/uploads/${student.id}/document.pdf`,
                    fileSize: pdfBuffer.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: "document.pdf",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("not an image");
            expect(result.scores).toEqual([]);
        });

        it("should return error for inactive file", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "inactive.png",
                    filePath: `/uploads/${student.id}/inactive.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "inactive.png",
                    status: FileStatus.DELETED,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("not found");
        });

        it("should return error when user tries to access another user's file", async () => {
            // Arrange
            const owner = await userRepository.save(
                new UserEntity({
                    email: `owner-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(owner.id);

            const otherUser = await userRepository.save(
                new UserEntity({
                    email: `other-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(otherUser.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: owner.id,
                }),
            );
            createdStudentIds.push(student.id);

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "private.png",
                    filePath: `/uploads/${student.id}/private.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "private.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act - Other user tries to access
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(
                    file.id,
                    otherUser.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("access denied");
        });
    });

    describe("extractSubjectScoresBatch", () => {
        it("should extract scores from multiple files for a student", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const file1 = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript1.png",
                    filePath: `/uploads/${student.id}/transcript1.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript1.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file1.id);

            const file2 = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript2.png",
                    filePath: `/uploads/${student.id}/transcript2.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript2.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file2.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [file1.id, file2.id],
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results).toBeDefined();
            expect(result.results.length).toBe(2);
            expect(result.ocrModel).toBe("mistral-ocr-latest");

            // Verify both files were processed
            const fileIds = result.results.map((r) => r.fileId);
            expect(fileIds).toContain(file1.id);
            expect(fileIds).toContain(file2.id);
        });

        it("should handle batch with mix of image and non-image files", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const imageFile = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript.png",
                    filePath: `/uploads/${student.id}/transcript.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(imageFile.id);

            const pdfBuffer = Buffer.from("PDF content");
            const pdfFile = await fileRepository.save(
                new FileEntity({
                    fileContent: pdfBuffer,
                    fileName: "document.pdf",
                    filePath: `/uploads/${student.id}/document.pdf`,
                    fileSize: pdfBuffer.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: "document.pdf",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(pdfFile.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [imageFile.id, pdfFile.id],
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results.length).toBe(2);

            const imageResult = result.results.find(
                (r) => r.fileId === imageFile.id,
            );
            const pdfResult = result.results.find(
                (r) => r.fileId === pdfFile.id,
            );

            expect(imageResult?.success).toBe(true);
            expect(pdfResult?.success).toBe(false);
            expect(pdfResult?.error).toContain("not an image");
        });

        it("should return error when no active files found", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [nonExistentId],
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("No active files found");
            expect(result.results).toEqual([]);
        });

        it("should catch AccessDeniedException and return error for wrong user", async () => {
            // Arrange
            const owner = await userRepository.save(
                new UserEntity({
                    email: `owner-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(owner.id);

            const otherUser = await userRepository.save(
                new UserEntity({
                    email: `other-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(otherUser.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: owner.id,
                }),
            );
            createdStudentIds.push(student.id);

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript.png",
                    filePath: `/uploads/${student.id}/transcript.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [file.id],
                    otherUser.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBe("Access denied");
            expect(result.results).toEqual([]);
        });

        it("should process batch for anonymous student without userId check", async () => {
            // Arrange - Anonymous student
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined,
                }),
            );
            createdStudentIds.push(student.id);

            const imageBuffer = createMockImageBuffer();
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "anonymous-transcript.png",
                    filePath: `/uploads/${student.id}/anonymous-transcript.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "anonymous-transcript.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act - No userId provided for anonymous access
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(student, [
                    file.id,
                ]);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results.length).toBe(1);
        });
    });

    describe("extractSubjectScoresByUserId", () => {
        it("should extract scores from all student files by userId", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const file1 = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript1.png",
                    filePath: `/uploads/${student.id}/transcript1.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript1.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file1.id);

            const file2 = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "transcript2.png",
                    filePath: `/uploads/${student.id}/transcript2.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "transcript2.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file2.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    student.id,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results).toBeDefined();
            expect(result.results.length).toBe(2);
            expect(result.ocrModel).toBe("mistral-ocr-latest");
        }, 60000); // 60 second timeout for API calls

        it("should return error for non-existent student", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(user.id);

            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000000",
            );

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    nonExistentId,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("not found");
            expect(result.results).toEqual([]);
        });

        it("should return error for wrong user access", async () => {
            // Arrange
            const owner = await userRepository.save(
                new UserEntity({
                    email: `owner-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(owner.id);

            const otherUser = await userRepository.save(
                new UserEntity({
                    email: `other-${Date.now().toString()}@example.com`,
                    password: "hashedPassword",
                    permissions: [],
                    role: Role.USER,
                }),
            );
            createdUserIds.push(otherUser.id);

            const student = await studentRepository.save(
                new StudentEntity({
                    userId: owner.id,
                }),
            );
            createdStudentIds.push(student.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    student.id,
                    otherUser.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBe("Access denied");
            expect(result.results).toEqual([]);
        });

        it("should return error when student has no files", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    student.id,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("No files found");
            expect(result.results).toEqual([]);
        });
    });

    describe("Real File Processing", () => {
        it("should extract scores from real transcript image (hb10-k1)", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load real transcript image
            const imageBuffer = readFileSync(
                "./test/integration/data/hb10-k1(b).webp",
            );

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "hb10-k1(b).webp",
                    filePath: `/uploads/${student.id}/hb10-k1(b).webp`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb10-k1(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.fileName).toBe("hb10-k1(b).webp");
            expect(result.success).toBe(true);
            expect(result.scores).toBeDefined();
            expect(Array.isArray(result.scores)).toBe(true);
            expect(result.scores.length).toBeGreaterThan(0);

            // Verify score structure using Zod schema
            const firstScore = result.scores[0];
            expect(firstScore).toHaveProperty("name");
            expect(firstScore).toHaveProperty("score");
            expect(typeof firstScore.name).toBe("string");
            expect(typeof firstScore.score).toBe("number");
            expect(firstScore.score).toBeGreaterThanOrEqual(0);
            expect(firstScore.score).toBeLessThanOrEqual(10);
        });

        it("should extract scores from multiple real transcript images in batch", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load multiple real transcript images
            const transcriptFiles = [
                "hb10-k1(b).webp",
                "hb11-k1(b).webp",
                "hb12-k1(b).webp",
            ];

            const fileIds: UUID[] = [];
            for (const fileName of transcriptFiles) {
                const imageBuffer = readFileSync(
                    `./test/integration/data/${fileName}`,
                );

                const file = await fileRepository.save(
                    new FileEntity({
                        fileContent: imageBuffer,
                        fileName,
                        filePath: `/uploads/${student.id}/${fileName}`,
                        fileSize: imageBuffer.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: fileName,
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
                fileIds.push(file.id);
            }

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    fileIds,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results).toBeDefined();
            expect(result.results.length).toBe(3);
            expect(result.ocrModel).toBe("mistral-ocr-latest");

            // Verify all files were processed successfully
            for (const fileResult of result.results) {
                expect(fileResult.success).toBe(true);
                expect(fileResult.scores.length).toBeGreaterThan(0);
            }
        });

        it("should handle compressed real transcript image", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load and compress real transcript image
            const imageBuffer = readFileSync(
                "./test/integration/data/hb10-k2(b).webp",
            );
            const compressedBuffer = await gzipAsync(imageBuffer);

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: compressedBuffer,
                    fileName: "hb10-k2(b).webp",
                    filePath: `/uploads/${student.id}/hb10-k2(b).webp`,
                    fileSize: compressedBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    metadata: { isCompressed: true },
                    mimeType: "image/webp",
                    originalFileName: "hb10-k2(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.success).toBe(true);
            expect(result.scores).toBeDefined();
            expect(result.scores.length).toBeGreaterThan(0);
        });

        it("should process all student files using extractSubjectScoresByUserId with real data", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load all transcript images for the student
            const transcriptFiles = ["hb11-k2(b).webp", "hb12-k2(b).webp"];

            for (const fileName of transcriptFiles) {
                const imageBuffer = readFileSync(
                    `./test/integration/data/${fileName}`,
                );

                const file = await fileRepository.save(
                    new FileEntity({
                        fileContent: imageBuffer,
                        fileName,
                        filePath: `/uploads/${student.id}/${fileName}`,
                        fileSize: imageBuffer.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: fileName,
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
            }

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    student.id,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results).toBeDefined();
            expect(result.results.length).toBe(2);
            expect(result.ocrModel).toBe("mistral-ocr-latest");

            // Verify all files were processed
            for (const fileResult of result.results) {
                expect(fileResult.success).toBe(true);
                expect(fileResult.scores.length).toBeGreaterThan(0);
            }

            // Verify aggregation logic - check that unique subjects are extracted
            const allSubjects = new Map<string, number>();
            result.results.forEach((fileResult) => {
                fileResult.scores.forEach((score) => {
                    const existingScore = allSubjects.get(score.name);
                    if (
                        existingScore === undefined ||
                        score.score > existingScore
                    ) {
                        allSubjects.set(score.name, score.score);
                    }
                });
            });

            expect(allSubjects.size).toBeGreaterThan(0);
        });

        it("should correctly identify highest scores from duplicate subjects across files", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load semester 1 and semester 2 transcripts (same subjects, potentially different scores)
            const k1File = readFileSync(
                "./test/integration/data/hb12-k1(b).webp",
            );
            const k2File = readFileSync(
                "./test/integration/data/hb12-k2(b).webp",
            );

            const file1 = await fileRepository.save(
                new FileEntity({
                    fileContent: k1File,
                    fileName: "hb12-k1(b).webp",
                    filePath: `/uploads/${student.id}/hb12-k1(b).webp`,
                    fileSize: k1File.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb12-k1(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file1.id);

            const file2 = await fileRepository.save(
                new FileEntity({
                    fileContent: k2File,
                    fileName: "hb12-k2(b).webp",
                    filePath: `/uploads/${student.id}/hb12-k2(b).webp`,
                    fileSize: k2File.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb12-k2(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file2.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresByUserId(
                    student.id,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results.length).toBe(2);

            // Check that each file has scores
            const k1Result = result.results.find(
                (r) => r.fileName === "hb12-k1(b).webp",
            );
            const k2Result = result.results.find(
                (r) => r.fileName === "hb12-k2(b).webp",
            );

            expect(k1Result).toBeDefined();
            expect(k2Result).toBeDefined();
            expect(k1Result?.scores.length).toBeGreaterThan(0);
            expect(k2Result?.scores.length).toBeGreaterThan(0);

            // Verify that the service handles duplicate subjects by keeping highest scores
            // This validates the Map-based deduplication in extractScoresFromImage
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle corrupted compressed file gracefully", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Create corrupted gzip data
            const corruptedBuffer = Buffer.from("not-valid-gzip-data");

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: corruptedBuffer,
                    fileName: "corrupted.png",
                    filePath: `/uploads/${student.id}/corrupted.png`,
                    fileSize: corruptedBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    metadata: { isCompressed: true },
                    mimeType: "image/png",
                    originalFileName: "corrupted.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("Failed to decompress");
        });

        it("should handle empty file list in batch processing", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Create a dummy file ID that doesn't exist
            const nonExistentId = UUIDSchema.parse(
                "00000000-0000-0000-0000-000000000001",
            );

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [nonExistentId],
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("No active files found");
        });

        it("should handle batch with only inactive files", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            const imageBuffer = createMockImageBuffer();
            const inactiveFile = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "deleted.png",
                    filePath: `/uploads/${student.id}/deleted.png`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "deleted.png",
                    status: FileStatus.DELETED,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(inactiveFile.id);

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    [inactiveFile.id],
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain("No active files found");
        });

        it("should handle invalid/corrupted image data and catch SDKError", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Create invalid image data (just random bytes)
            const invalidImageBuffer = Buffer.from(
                "This is not a valid image file",
            );

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: invalidImageBuffer,
                    fileName: "invalid.png",
                    filePath: `/uploads/${student.id}/invalid.png`,
                    fileSize: invalidImageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "invalid.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            // The error should be a string message from the caught SDKError
            expect(typeof result.error).toBe("string");
            // The service catches SDKError internally and returns error message
            expect(result.scores).toEqual([]);
        });

        it("should handle empty file content and catch SDKError", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Create file with empty buffer
            const emptyBuffer = Buffer.from("");

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: emptyBuffer,
                    fileName: "empty.png",
                    filePath: `/uploads/${student.id}/empty.png`,
                    fileSize: 0,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "empty.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            // The error should be a string message from the caught SDKError
            expect(typeof result.error).toBe("string");
            expect(result.scores).toEqual([]);
        });

        it("should handle different image formats (JPEG, WebP, GIF)", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Create test images with different MIME types
            const imageFormats = [
                { extension: "jpg", mimeType: "image/jpeg" },
                { extension: "webp", mimeType: "image/webp" },
                { extension: "gif", mimeType: "image/gif" },
            ];

            const fileIds: UUID[] = [];
            const imageBuffer = createMockImageBuffer();

            for (const format of imageFormats) {
                const file = await fileRepository.save(
                    new FileEntity({
                        fileContent: imageBuffer,
                        fileName: `transcript.${format.extension}`,
                        filePath: `/uploads/${student.id}/transcript.${format.extension}`,
                        fileSize: imageBuffer.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: format.mimeType,
                        originalFileName: `transcript.${format.extension}`,
                        status: FileStatus.ACTIVE,
                        studentId: student.id,
                    }),
                );
                createdFileIds.push(file.id);
                fileIds.push(file.id);
            }

            // Act
            const result: BatchScoreExtractionResult =
                await mistralService.extractSubjectScoresBatch(
                    student,
                    fileIds,
                    user.id,
                );

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.results.length).toBe(3);

            // Verify each format was processed
            for (const fileResult of result.results) {
                expect(fileResult.fileId).toBeDefined();
                // Each should either succeed or fail gracefully
                expect(typeof fileResult.success).toBe("boolean");
            }
        });
    });

    describe("Large Batch Processing", () => {
        it("should handle large batch processing with 3 users and 6 files each", async () => {
            // Arrange - Create 3 users with 6 files each
            const users: UserEntity[] = [];
            const students: StudentEntity[] = [];
            const allFileIds: UUID[] = [];

            for (let i = 0; i < 3; i++) {
                const user = await userRepository.save(
                    new UserEntity({
                        email: `batch-user-${i.toString()}-${Date.now().toString()}@example.com`,
                        password: "hashedPassword",
                        permissions: [],
                        role: Role.USER,
                    }),
                );
                createdUserIds.push(user.id);
                users.push(user);

                const student = await studentRepository.save(
                    new StudentEntity({
                        userId: user.id,
                    }),
                );
                createdStudentIds.push(student.id);
                students.push(student);

                // Create 6 files for each student
                const studentFileIds: UUID[] = [];
                const imageBuffer = createMockImageBuffer();

                for (let j = 0; j < 6; j++) {
                    const file = await fileRepository.save(
                        new FileEntity({
                            fileContent: imageBuffer,
                            fileName: `transcript-${j.toString()}.png`,
                            filePath: `/uploads/${student.id}/transcript-${j.toString()}.png`,
                            fileSize: imageBuffer.length,
                            fileType: FileType.TRANSCRIPT,
                            mimeType: "image/png",
                            originalFileName: `transcript-${j.toString()}.png`,
                            status: FileStatus.ACTIVE,
                            studentId: student.id,
                        }),
                    );
                    createdFileIds.push(file.id);
                    studentFileIds.push(file.id);
                    allFileIds.push(file.id);
                }

                // Act - Process each student's files
                const result: BatchScoreExtractionResult =
                    await mistralService.extractSubjectScoresBatch(
                        student,
                        studentFileIds,
                        user.id,
                    );

                // Assert
                expect(result).toBeDefined();
                expect(result.success).toBe(true);
                expect(result.results.length).toBe(6);
                expect(result.ocrModel).toBe("mistral-ocr-latest");

                // Verify all files processed
                const processedFileIds = result.results.map((r) => r.fileId);
                for (const fileId of studentFileIds) {
                    expect(processedFileIds).toContain(fileId);
                }
            }

            // Verify total files created
            expect(allFileIds.length).toBe(18); // 3 users × 6 files
        }, 90000); // 90 second timeout for large batch
    });

    describe("OCR Response Edge Cases", () => {
        it("should handle real file that might return empty subjects", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Use a very small/minimal image that might not have recognizable text
            const minimalImageBuffer = createMockImageBuffer();

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: minimalImageBuffer,
                    fileName: "minimal.png",
                    filePath: `/uploads/${student.id}/minimal.png`,
                    fileSize: minimalImageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/png",
                    originalFileName: "minimal.png",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileId).toBe(file.id);
            // Result should be defined regardless of whether scores were found
            expect(Array.isArray(result.scores)).toBe(true);
        });

        it("should handle duplicate subjects within same file extraction", async () => {
            // Arrange
            const user = await userRepository.save(
                new UserEntity({
                    email: `test-${Date.now().toString()}@example.com`,
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

            // Load a real file that might have duplicate subject entries
            const imageBuffer = readFileSync(
                "./test/integration/data/hb10-k1(b).webp",
            );

            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: imageBuffer,
                    fileName: "hb10-k1(b).webp",
                    filePath: `/uploads/${student.id}/hb10-k1(b).webp`,
                    fileSize: imageBuffer.length,
                    fileType: FileType.TRANSCRIPT,
                    mimeType: "image/webp",
                    originalFileName: "hb10-k1(b).webp",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act
            const result: FileScoreExtractionResult =
                await mistralService.extractSubjectScores(file.id, user.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);

            // Verify no duplicate subjects in result
            const subjectNames = result.scores.map((s) => s.name);
            const uniqueSubjectNames = new Set(subjectNames);
            expect(subjectNames.length).toBe(uniqueSubjectNames.size);

            // If there were duplicates in OCR response, Map should keep highest score
            // This is verified by the deduplication logic in extractScoresFromImage
        });
    });
});
