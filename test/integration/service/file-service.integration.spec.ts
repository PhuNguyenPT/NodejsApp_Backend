// test/integration/service/file-service.integration.spec.ts
import type { DataSource, Repository } from "typeorm";

import { readFileSync } from "fs";
import { join } from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IFileService } from "@/service/file-service.interface.js";
import type { UUID } from "@/type/common/uuid.type.js";

import { iocContainer } from "@/app/ioc-container.js";
import { CreateFileDTO } from "@/dto/file/create-file.js";
import { UpdateFileRequest } from "@/dto/file/update-file.js";
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
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

describe("FileService Integration Tests", () => {
    let dataSource: DataSource;
    let fileService: IFileService;
    let studentRepository: Repository<StudentEntity>;
    let fileRepository: Repository<FileEntity>;
    let userRepository: Repository<UserEntity>;

    const createdStudentIds: UUID[] = [];
    const createdFileIds: UUID[] = [];
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

    // Helper to create compressible content (repeated text)
    const createCompressibleContent = (): Buffer => {
        return Buffer.from("This is highly compressible text. ".repeat(100));
    };

    // Helper to create incompressible content (random bytes)
    const createIncompressibleContent = (): Buffer => {
        return Buffer.from(
            Array.from({ length: 1000 }, () => Math.floor(Math.random() * 256)),
        );
    };

    beforeAll(() => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        fileService = iocContainer.get<IFileService>(TYPES.IFileService);
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

    describe("createFile", () => {
        it("should create a single file successfully", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "test-document.pdf",
                filePath: `/uploads/${student.id}/test-document.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "test-document.pdf",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileContent).toBeDefined();
            expect(result.fileName).toBe("test-document.pdf");
            expect(result.filePath).toBeDefined();
            expect(result.fileSize).toBe(fileContent.length);
            expect(result.fileType).toBe(FileType.DOCUMENT);
            expect(result.mimeType).toBeDefined();
            expect(result.originalFileName).toBe("test-document.pdf");
            expect(result.studentId).toBe(student.id);
            expect(result.id).toBeDefined();
            expect(result.status).toBe(FileStatus.ACTIVE);
        });

        it("should create file with compression when beneficial", async () => {
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

            const fileContent = createCompressibleContent();
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "compressible.txt",
                filePath: `/uploads/${student.id}/compressible.txt`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "text/plain",
                originalFileName: "compressible.txt",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.createdBy).not.toBe(Role.ANONYMOUS);
            expect(result.createdBy).toBe(user.email);
            expect(result.metadata?.isCompressed).toBe(true);
            expect(result.metadata?.originalSize).toBe(fileContent.length);
            expect(result.metadata?.compressionRatio).toBeDefined();
            expect(result.fileSize).toBeLessThan(fileContent.length);
        });

        it("should skip compression for already compressed MIME types", async () => {
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

            const fileContent = loadRealImageFile("hb10-k1(b).webp");
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "image.webp",
                filePath: `/uploads/${student.id}/image.webp`,
                fileSize: fileContent.length,
                fileType: FileType.TRANSCRIPT,
                mimeType: "image/webp",
                originalFileName: "hb10-k1(b).webp",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.metadata?.isCompressed).toBeUndefined();
            expect(result.fileSize).toBe(fileContent.length);
        });

        it("should skip compression when it would increase size", async () => {
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

            const fileContent = createIncompressibleContent();
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "random.bin",
                filePath: `/uploads/${student.id}/random.bin`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/octet-stream",
                originalFileName: "random.bin",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.metadata?.isCompressed).toBeUndefined();
            expect(result.fileSize).toBe(fileContent.length);
        });

        it("should create image file and trigger OCR event", async () => {
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

            // Use real WebP image file
            const fileContent = loadRealImageFile("hb10-k2(b).webp");
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "transcript.webp",
                filePath: `/uploads/${student.id}/transcript.webp`,
                fileSize: fileContent.length,
                fileType: FileType.TRANSCRIPT,
                mimeType: "image/webp",
                originalFileName: "hb10-k2(b).webp",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.createdBy).toBe(user.email);
            expect(result.mimeType).toBe("image/webp");
            expect(result.fileType).toBe(FileType.TRANSCRIPT);
            expect(result.fileContent).toBeDefined();
            // Give OCR event time to process file
            await new Promise((resolve) => setTimeout(resolve, 1500));
        });

        it("should create file for anonymous student without userId", async () => {
            // Arrange
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "anonymous-file.pdf",
                filePath: `/uploads/${student.id}/anonymous-file.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "anonymous-file.pdf",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.createdBy).toBe(Role.ANONYMOUS);
            expect(result.id).toBeDefined();
            expect(result.studentId).toBe(student.id);
        });

        it("should throw EntityNotFoundException for non-existent student", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "test.pdf",
                filePath: `/uploads/${nonExistentId}/test.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "test.pdf",
                studentId: nonExistentId,
            });

            // Act & Assert
            await expect(
                fileService.createFile(createFileDTO, user.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should throw AccessDeniedException when user tries to create file for another user's student", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "unauthorized.pdf",
                filePath: `/uploads/${student.id}/unauthorized.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "unauthorized.pdf",
                studentId: student.id,
            });

            // Act & Assert
            await expect(
                fileService.createFile(createFileDTO, otherUser.id),
            ).rejects.toThrow(AccessDeniedException);
        });

        it("should throw ValidationException when exceeding file limit (6 files)", async () => {
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

            // Create 6 files (at the limit)
            for (let i = 0; i < 6; i++) {
                const fileContent = createMockFileContent(100);
                const createFileDTO = new CreateFileDTO({
                    fileContent,
                    fileName: `file-${i.toString()}.pdf`,
                    filePath: `/uploads/${student.id}/file-${i.toString()}.pdf`,
                    fileSize: fileContent.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: `file-${i.toString()}.pdf`,
                    studentId: student.id,
                });
                const file = await fileService.createFile(
                    createFileDTO,
                    user.id,
                );
                createdFileIds.push(file.id);
            }

            // Try to create 7th file
            const fileContent = createMockFileContent(100);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "file-7.pdf",
                filePath: `/uploads/${student.id}/file-7.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "file-7.pdf",
                studentId: student.id,
            });

            // Act & Assert
            await expect(
                fileService.createFile(createFileDTO, user.id),
            ).rejects.toThrow(ValidationException);
        });
    });

    describe("createFiles (Batch)", () => {
        it("should create multiple image files and trigger batch OCR", async () => {
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

            const imageFiles = [
                "hb11-k1(b).webp",
                "hb11-k2(b).webp",
                "hb12-k1(b).webp",
            ];

            const createFileDTOs: CreateFileDTO[] = imageFiles.map(
                (filename, i) => {
                    const fileContent = loadRealImageFile(filename);
                    return new CreateFileDTO({
                        fileContent,
                        fileName: `batch-image-${i.toString()}.webp`,
                        filePath: `/uploads/${student.id}/batch-image-${i.toString()}.webp`,
                        fileSize: fileContent.length,
                        fileType: FileType.TRANSCRIPT,
                        mimeType: "image/webp",
                        originalFileName: filename,
                        studentId: student.id,
                    });
                },
            );

            // Act
            const results = await fileService.createFiles(
                createFileDTOs,
                student.id,
                user.id,
            );
            results.forEach((file) => createdFileIds.push(file.id));

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            results.forEach((file, index) => {
                expect(file.id).toBeDefined();
                expect(file.createdBy).toBe(user.email);
                expect(file.fileName).toBe(
                    `batch-image-${index.toString()}.webp`,
                );
                expect(file.studentId).toBe(student.id);
                expect(file.status).toBe(FileStatus.ACTIVE);
                expect(file.mimeType).toBe("image/webp");
            });

            // Give OCR batch event time to process files
            await new Promise((resolve) => setTimeout(resolve, 4500));
        });

        it("should create multiple files successfully", async () => {
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

            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 3; i++) {
                const fileContent = createMockFileContent(500);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `batch-file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/batch-file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `batch-file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );
            }

            // Act
            const results = await fileService.createFiles(
                createFileDTOs,
                student.id,
                user.id,
            );
            results.forEach((file) => createdFileIds.push(file.id));

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            results.forEach((file, index) => {
                expect(file.id).toBeDefined();
                expect(file.createdBy).toBe(user.email);
                expect(file.fileName).toBe(
                    `batch-file-${index.toString()}.pdf`,
                );
                expect(file.studentId).toBe(student.id);
                expect(file.status).toBe(FileStatus.ACTIVE);
            });
        });

        it("should return empty array when creating zero files", async () => {
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
            const results = await fileService.createFiles(
                [],
                student.id,
                user.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(0);
        });

        it("should compress files in batch when beneficial", async () => {
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

            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 2; i++) {
                const fileContent = createCompressibleContent();
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `compressible-${i.toString()}.txt`,
                        filePath: `/uploads/${student.id}/compressible-${i.toString()}.txt`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "text/plain",
                        originalFileName: `compressible-${i.toString()}.txt`,
                        studentId: student.id,
                    }),
                );
            }

            // Act
            const results = await fileService.createFiles(
                createFileDTOs,
                student.id,
                user.id,
            );
            results.forEach((file) => createdFileIds.push(file.id));

            // Assert
            expect(results.length).toBe(2);
            results.forEach((file) => {
                expect(file.createdBy).toBe(user.email);
                expect(file.metadata?.isCompressed).toBe(true);
                expect(file.metadata?.compressionRatio).toBeDefined();
            });
        });

        it("should throw ValidationException when files have different studentIds", async () => {
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

            const student1 = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student1.id);

            const student2 = await studentRepository.save(
                new StudentEntity({
                    userId: user.id,
                }),
            );
            createdStudentIds.push(student2.id);

            const fileContent = createMockFileContent(500);
            const createFileDTOs: CreateFileDTO[] = [
                new CreateFileDTO({
                    fileContent,
                    fileName: "file1.pdf",
                    filePath: `/uploads/${student1.id}/file1.pdf`,
                    fileSize: fileContent.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: "file1.pdf",
                    studentId: student1.id,
                }),
                new CreateFileDTO({
                    fileContent,
                    fileName: "file2.pdf",
                    filePath: `/uploads/${student2.id}/file2.pdf`,
                    fileSize: fileContent.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: "file2.pdf",
                    studentId: student2.id,
                }),
            ];

            // Act & Assert
            await expect(
                fileService.createFiles(createFileDTOs, student1.id, user.id),
            ).rejects.toThrow(ValidationException);
        });

        it("should throw ValidationException when batch exceeds file limit", async () => {
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

            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 7; i++) {
                const fileContent = createMockFileContent(100);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );
            }

            // Act & Assert
            await expect(
                fileService.createFiles(createFileDTOs, student.id, user.id),
            ).rejects.toThrow(ValidationException);
        });

        it("should create batch for anonymous student", async () => {
            // Arrange
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined,
                }),
            );
            createdStudentIds.push(student.id);

            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 2; i++) {
                const fileContent = createMockFileContent(500);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `anon-file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/anon-file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `anon-file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );
            }

            // Act
            const results = await fileService.createFiles(
                createFileDTOs,
                student.id,
            );
            results.forEach((file) => createdFileIds.push(file.id));

            // Assert
            expect(results.length).toBe(2);
            results.forEach((file) => {
                expect(file.createdBy).toBe(Role.ANONYMOUS);
                expect(file.studentId).toBe(student.id);
            });
        });
    });

    describe("getFileById", () => {
        it("should retrieve file successfully", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "retrieve-test.pdf",
                filePath: `/uploads/${student.id}/retrieve-test.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "retrieve-test.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            // Act
            const result = await fileService.getFileById(
                createdFile.id,
                user.id,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.createdBy).toBe(user.email);
            expect(result.id).toBe(createdFile.id);
            expect(result.fileName).toBe("retrieve-test.pdf");
            expect(result.fileContent).toBeDefined();
        });

        it("should decompress file content when retrieving compressed file", async () => {
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

            const originalContent = createCompressibleContent();
            const createFileDTO = new CreateFileDTO({
                fileContent: originalContent,
                fileName: "compressed-test.txt",
                filePath: `/uploads/${student.id}/compressed-test.txt`,
                fileSize: originalContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "text/plain",
                originalFileName: "compressed-test.txt",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            // Act
            const result = await fileService.getFileById(
                createdFile.id,
                user.id,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.fileContent.toString()).toBe(
                originalContent.toString(),
            );
        });

        it("should throw EntityNotFoundException for non-existent file", async () => {
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

            // Act & Assert
            await expect(
                fileService.getFileById(nonExistentId, user.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should throw EntityNotFoundException when accessing another user's file", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "private.pdf",
                filePath: `/uploads/${student.id}/private.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "private.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                owner.id,
            );
            createdFileIds.push(createdFile.id);

            // Act & Assert
            await expect(
                fileService.getFileById(createdFile.id, otherUser.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should throw EntityNotFoundException for deleted file", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "to-delete.pdf",
                filePath: `/uploads/${student.id}/to-delete.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "to-delete.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            // Delete the file
            await fileService.deleteFile(createdFile.id, user.id);

            // Act & Assert
            await expect(
                fileService.getFileById(createdFile.id, user.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should retrieve anonymous student file without userId", async () => {
            // Arrange
            const student = await studentRepository.save(
                new StudentEntity({
                    userId: undefined,
                }),
            );
            createdStudentIds.push(student.id);

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "anon.pdf",
                filePath: `/uploads/${student.id}/anon.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "anon.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(createFileDTO);
            createdFileIds.push(createdFile.id);

            // Act
            const result = await fileService.getFileById(createdFile.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.createdBy).toBe(Role.ANONYMOUS);
            expect(result.id).toBe(createdFile.id);
        });
    });

    describe("getFilesMetadataByStudentId", () => {
        it("should retrieve all files metadata for a student", async () => {
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

            // Create multiple files
            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 3; i++) {
                const fileContent = createMockFileContent(500);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `metadata-file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/metadata-file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `metadata-file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );
            }

            const files = await fileService.createFiles(
                createFileDTOs,
                student.id,
                user.id,
            );
            files.forEach((file) => createdFileIds.push(file.id));

            // Act
            const results = await fileService.getFilesMetadataByStudentId(
                student.id,
                user.id,
            );

            // Assert
            expect(results).toBeDefined();
            expect(results.length).toBe(3);
            results.forEach((file) => {
                expect(file.studentId).toBe(student.id);
                expect(file.createdBy).toBe(user.email);
                expect(file.status).toBe(FileStatus.ACTIVE);
            });
        });

        it("should return files ordered by createdAt DESC", async () => {
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

            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 3; i++) {
                const fileContent = createMockFileContent(500);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `ordered-file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/ordered-file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `ordered-file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );

                // Small delay to ensure different timestamps
                await new Promise((resolve) => setTimeout(resolve, 10));

                const file = await fileService.createFile(
                    createFileDTOs[i],
                    user.id,
                );
                createdFileIds.push(file.id);
            }

            // Act
            const results = await fileService.getFilesMetadataByStudentId(
                student.id,
                user.id,
            );

            // Assert
            expect(results.length).toBe(3);
            // Most recent file should be first
            expect(results[0].fileName).toBe("ordered-file-2.pdf");
            expect(results[2].fileName).toBe("ordered-file-0.pdf");
        });

        it("should throw EntityNotFoundException when no files found", async () => {
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

            // Act & Assert
            await expect(
                fileService.getFilesMetadataByStudentId(student.id, user.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should exclude deleted files from metadata", async () => {
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

            // Create 2 files
            const createFileDTOs: CreateFileDTO[] = [];
            for (let i = 0; i < 2; i++) {
                const fileContent = createMockFileContent(500);
                createFileDTOs.push(
                    new CreateFileDTO({
                        fileContent,
                        fileName: `file-${i.toString()}.pdf`,
                        filePath: `/uploads/${student.id}/file-${i.toString()}.pdf`,
                        fileSize: fileContent.length,
                        fileType: FileType.DOCUMENT,
                        mimeType: "application/pdf",
                        originalFileName: `file-${i.toString()}.pdf`,
                        studentId: student.id,
                    }),
                );
            }

            const files = await fileService.createFiles(
                createFileDTOs,
                student.id,
                user.id,
            );
            files.forEach((file) => createdFileIds.push(file.id));

            // Delete one file
            await fileService.deleteFile(files[0].id, user.id);

            // Act
            const results = await fileService.getFilesMetadataByStudentId(
                student.id,
                user.id,
            );

            // Assert
            expect(results.length).toBe(1);
            expect(results[0].id).toBe(files[1].id);
            expect(results).not.toContain(files[0]);
        });
    });

    describe("updateFile", () => {
        it("should update file description successfully", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                description: "Original description",
                fileContent,
                fileName: "update-test.pdf",
                filePath: `/uploads/${student.id}/update-test.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "update-test.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                description: "Updated description",
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.description).toBe("Updated description");
            expect(result.updatedBy).toBe(user.email);
            expect(result.updatedAt.getTime()).toBeGreaterThan(
                createdFile.updatedAt.getTime(),
            );
        });

        it("should update file name", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "old-name.pdf",
                filePath: `/uploads/${student.id}/old-name.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "old-name.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                fileName: "new-name.pdf",
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.fileName).toBe("new-name.pdf");
            expect(result.updatedAt.getTime()).toBeGreaterThan(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBe(user.email);
        });

        it("should update file type", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "document.pdf",
                filePath: `/uploads/${student.id}/document.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "document.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                fileType: FileType.TRANSCRIPT,
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.fileType).toBe(FileType.TRANSCRIPT);
            expect(result.updatedAt.getTime()).toBeGreaterThan(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBe(user.email);
        });

        it("should update tags", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "tagged.pdf",
                filePath: `/uploads/${student.id}/tagged.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "tagged.pdf",
                studentId: student.id,
                tags: "old,tags",
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                tags: "new,updated,tags",
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.tags).toBe("new,updated,tags");
            expect(result.updatedAt.getTime()).toBeGreaterThan(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBe(user.email);
        });

        it("should update metadata", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "metadata.pdf",
                filePath: `/uploads/${student.id}/metadata.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                metadata: { custom: "old value" },
                mimeType: "application/pdf",
                originalFileName: "metadata.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                metadata: { additional: "data", custom: "new value" },
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.metadata).toStrictEqual({
                additional: "data",
                custom: "new value",
            });
            expect(result.updatedAt.getTime()).toBeGreaterThan(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBe(user.email);
        });

        it("should return file unchanged when no changes detected", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                description: "Same description",
                fileContent,
                fileName: "no-change.pdf",
                filePath: `/uploads/${student.id}/no-change.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "no-change.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                description: "Same description",
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.id).toBe(createdFile.id);
            expect(result.description).toBe("Same description");
            expect(result.updatedAt.getTime()).toEqual(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBeNull();
        });

        it("should ignore empty string updates", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                description: "Original",
                fileContent,
                fileName: "original.pdf",
                filePath: `/uploads/${student.id}/original.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "original.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            const updateDTO: UpdateFileRequest = {
                description: "",
                fileName: "   ",
            };

            // Act
            const result = await fileService.updateFile(
                createdFile.id,
                updateDTO,
                user.id,
            );

            // Assert
            expect(result.description).toBe("Original");
            expect(result.fileName).toBe("original.pdf");
            expect(result.updatedAt.getTime()).toEqual(
                createdFile.updatedAt.getTime(),
            );
            expect(result.updatedBy).toBeNull();
        });
    });

    describe("deleteFile", () => {
        it("should soft delete file successfully", async () => {
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

            const fileContent = createMockFileContent(500);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "to-delete.pdf",
                filePath: `/uploads/${student.id}/to-delete.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "to-delete.pdf",
                studentId: student.id,
            });

            const createdFile = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(createdFile.id);

            // Act
            await fileService.deleteFile(createdFile.id, user.id);

            // Assert
            const deletedFile = await fileRepository.findOne({
                where: { id: createdFile.id },
            });
            expect(deletedFile).toBeDefined();
            expect(deletedFile?.status).toBe(FileStatus.DELETED);
        });

        it("should throw EntityNotFoundException when deleting non-existent file", async () => {
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

            // Act & Assert
            await expect(
                fileService.deleteFile(nonExistentId, user.id),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should allow creating new file after deletion (file limit check)", async () => {
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

            // Create 6 files (at limit)
            const fileIds: UUID[] = [];
            for (let i = 0; i < 6; i++) {
                const fileContent = createMockFileContent(100);
                const createFileDTO = new CreateFileDTO({
                    fileContent,
                    fileName: `file-${i.toString()}.pdf`,
                    filePath: `/uploads/${student.id}/file-${i.toString()}.pdf`,
                    fileSize: fileContent.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: `file-${i.toString()}.pdf`,
                    studentId: student.id,
                });
                const file = await fileService.createFile(
                    createFileDTO,
                    user.id,
                );
                createdFileIds.push(file.id);
                fileIds.push(file.id);
            }

            // Delete one file
            await fileService.deleteFile(fileIds[0], user.id);

            // Act - Create new file should now succeed
            const fileContent = createMockFileContent(100);
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "new-after-delete.pdf",
                filePath: `/uploads/${student.id}/new-after-delete.pdf`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/pdf",
                originalFileName: "new-after-delete.pdf",
                studentId: student.id,
            });

            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.fileName).toBe("new-after-delete.pdf");
            expect(result.createdBy).toBe(user.email);
        });
    });

    describe("Compression Edge Cases", () => {
        it("should handle very small files without compression", async () => {
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

            const fileContent = Buffer.from("tiny");
            const createFileDTO = new CreateFileDTO({
                fileContent,
                fileName: "tiny.txt",
                filePath: `/uploads/${student.id}/tiny.txt`,
                fileSize: fileContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "text/plain",
                originalFileName: "tiny.txt",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result.metadata?.isCompressed).toBeUndefined();
            expect(result.fileSize).toBe(fileContent.length);
        });

        it("should handle decompression errors gracefully", async () => {
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

            // Manually create corrupted compressed file
            const corruptedContent = Buffer.from("corrupted-gzip-data");
            const file = await fileRepository.save(
                new FileEntity({
                    fileContent: corruptedContent,
                    fileName: "corrupted.txt",
                    filePath: `/uploads/${student.id}/corrupted.txt`,
                    fileSize: corruptedContent.length,
                    fileType: FileType.DOCUMENT,
                    metadata: { isCompressed: true },
                    mimeType: "text/plain",
                    originalFileName: "corrupted.txt",
                    status: FileStatus.ACTIVE,
                    studentId: student.id,
                }),
            );
            createdFileIds.push(file.id);

            // Act & Assert
            await expect(
                fileService.getFileById(file.id, user.id),
            ).rejects.toThrow("Failed to decompress file content");
        });

        it("should verify compression metadata is accurate", async () => {
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

            const originalContent = createCompressibleContent();
            const createFileDTO = new CreateFileDTO({
                fileContent: originalContent,
                fileName: "verify-compression.txt",
                filePath: `/uploads/${student.id}/verify-compression.txt`,
                fileSize: originalContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "text/plain",
                originalFileName: "verify-compression.txt",
                studentId: student.id,
            });

            // Act
            const result = await fileService.createFile(createFileDTO, user.id);
            createdFileIds.push(result.id);

            // Assert
            expect(result.metadata?.isCompressed).toBe(true);
            expect(result.metadata?.originalSize).toBe(originalContent.length);
            expect(result.createdBy).toBe(user.email);
            const compressionRatioValue = result.metadata?.compressionRatio;
            const compressionRatio = parseFloat(
                typeof compressionRatioValue === "string"
                    ? compressionRatioValue
                    : "0",
            );
            expect(compressionRatio).toBeGreaterThan(0);
            expect(compressionRatio).toBeLessThan(100);

            // Verify actual size matches
            const expectedCompressedSize = result.fileSize;
            const actualReduction =
                ((originalContent.length - expectedCompressedSize) /
                    originalContent.length) *
                100;
            expect(Math.abs(actualReduction - compressionRatio)).toBeLessThan(
                1,
            );
        });
    });

    describe("Transaction and Concurrency", () => {
        it("should handle concurrent file creation within transaction", async () => {
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

            // Create multiple files concurrently
            const promises = Array.from({ length: 3 }, (_, i) => {
                const fileContent = createMockFileContent(100);
                const createFileDTO = new CreateFileDTO({
                    fileContent,
                    fileName: `concurrent-${i.toString()}.pdf`,
                    filePath: `/uploads/${student.id}/concurrent-${i.toString()}.pdf`,
                    fileSize: fileContent.length,
                    fileType: FileType.DOCUMENT,
                    mimeType: "application/pdf",
                    originalFileName: `concurrent-${i.toString()}.pdf`,
                    studentId: student.id,
                });
                return fileService.createFile(createFileDTO, user.id);
            });

            // Act
            const results = await Promise.all(promises);
            results.forEach((file) => createdFileIds.push(file.id));

            // Assert
            expect(results.length).toBe(3);
            results.forEach((file, index) => {
                expect(file.fileName).toBe(
                    `concurrent-${index.toString()}.pdf`,
                );
                expect(file.createdBy).toBe(user.email);
                expect(file.fileType).toBe(FileType.DOCUMENT);
                expect(file.studentId).toBe(student.id);
            });
        });
    });

    describe("File Content Integrity", () => {
        it("should preserve file content through create and retrieve cycle", async () => {
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

            const originalContent = Buffer.from(
                "This is important content that must be preserved exactly.",
            );
            const createFileDTO = new CreateFileDTO({
                fileContent: originalContent,
                fileName: "integrity-test.txt",
                filePath: `/uploads/${student.id}/integrity-test.txt`,
                fileSize: originalContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "text/plain",
                originalFileName: "integrity-test.txt",
                studentId: student.id,
            });

            // Act
            const created = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(created.id);

            const retrieved = await fileService.getFileById(
                created.id,
                user.id,
            );

            // Assert
            expect(retrieved.fileContent.toString()).toBe(
                originalContent.toString(),
            );
            expect(retrieved.createdBy).toBe(user.email);
            expect(retrieved.studentId).toBe(student.id);
            expect(retrieved.fileContent.equals(originalContent)).toBe(true);
            expect(retrieved.id).toBe(created.id);
        });

        it("should preserve binary file content", async () => {
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

            const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]);
            const createFileDTO = new CreateFileDTO({
                fileContent: binaryContent,
                fileName: "binary.bin",
                filePath: `/uploads/${student.id}/binary.bin`,
                fileSize: binaryContent.length,
                fileType: FileType.DOCUMENT,
                mimeType: "application/octet-stream",
                originalFileName: "binary.bin",
                studentId: student.id,
            });

            // Act
            const created = await fileService.createFile(
                createFileDTO,
                user.id,
            );
            createdFileIds.push(created.id);

            const retrieved = await fileService.getFileById(
                created.id,
                user.id,
            );

            // Assert
            expect(retrieved.fileContent.equals(binaryContent)).toBe(true);
        });
    });
});
