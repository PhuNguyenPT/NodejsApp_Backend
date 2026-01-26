// test/integration/service/award-service.integration.spec.ts
import { type DataSource, Repository } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IAwardService } from "@/service/award-service.interface.js";
import type { UUID } from "@/type/common/uuid.type.js";

import { iocContainer } from "@/app/ioc-container.js";
import { AwardRequest } from "@/dto/student/award-request.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.enum.js";
import { Rank } from "@/type/enum/rank.enum.js";
import { Role } from "@/type/enum/user.enum.js";

describe("AwardService Integration Tests", () => {
    let dataSource: DataSource;
    let awardService: IAwardService;
    let awardRepository: Repository<AwardEntity>;
    let studentRepository: Repository<StudentEntity>;
    const createdStudentIds: UUID[] = [];
    const createdAwardIds: UUID[] = [];

    beforeAll(async () => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        awardService = iocContainer.get<IAwardService>(TYPES.IAwardService);
        studentRepository = dataSource.getRepository(StudentEntity);

        // Clean up database - preserve system-created awards
        awardRepository = dataSource.getRepository(AwardEntity);
        await awardRepository
            .createQueryBuilder()
            .delete()
            .where("created_by != :systemCreator", { systemCreator: "system" })
            .execute();
    });

    afterAll(async () => {
        for (const awardId of createdAwardIds) {
            await awardRepository.delete(awardId);
        }

        // Delete students created in tests
        for (const studentId of createdStudentIds) {
            await studentRepository.delete(studentId);
        }
    });

    describe("createAwardEntity", () => {
        it("should create a single award entity with all required fields", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(AwardEntity);
            expect(result.category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(result.level).toBe(Rank.FIRST);
            expect(result.name).toBe(NationalExcellentExamType.NATIONAL);
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should set createdBy to ANONYMOUS when not provided", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.PHYSICS,
                level: Rank.SECOND,
                name: NationalExcellentExamType.NATIONAL,
            };

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should create award with different categories", () => {
            // Arrange
            const categories = [
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.CHEMISTRY,
                NationalExcellentStudentExamSubject.BIOLOGY,
            ];

            // Act & Assert
            categories.forEach((category) => {
                const awardRequest: AwardRequest = {
                    category,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const result = awardService.createAwardEntity(awardRequest);

                expect(result.category).toBe(category);
                expect(result.level).toBe(Rank.FIRST);
            });
        });

        it("should create award with different levels", () => {
            // Arrange
            const levels = [
                Rank.FIRST,
                Rank.SECOND,
                Rank.THIRD,
                Rank.CONSOLATION,
            ];

            // Act & Assert
            levels.forEach((level) => {
                const awardRequest: AwardRequest = {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const result = awardService.createAwardEntity(awardRequest);

                expect(result.level).toBe(level);
            });
        });
    });

    describe("createAwardEntities", () => {
        it("should create multiple award entities from array", () => {
            // Arrange
            const awardRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.PHYSICS,
                    level: Rank.SECOND,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.CHEMISTRY,
                    level: Rank.THIRD,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(results).toBeDefined();
            expect(results).toHaveLength(3);
            expect(results[0].category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(results[0].level).toBe(Rank.FIRST);

            expect(results[1].category).toBe(
                NationalExcellentStudentExamSubject.PHYSICS,
            );
            expect(results[1].level).toBe(Rank.SECOND);

            expect(results[2].category).toBe(
                NationalExcellentStudentExamSubject.CHEMISTRY,
            );
            expect(results[2].level).toBe(Rank.THIRD);

            // All should have createdBy set to ANONYMOUS
            results.forEach((result) => {
                expect(result.createdBy).toBe(Role.ANONYMOUS);
            });
        });

        it("should return empty array when given empty array", () => {
            // Arrange
            const awardRequests: AwardRequest[] = [];

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(results).toBeDefined();
            expect(results).toEqual([]);
            expect(results).toHaveLength(0);
        });

        it("should handle single award in array", () => {
            // Arrange
            const awardRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.LITERATURE,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].category).toBe(
                NationalExcellentStudentExamSubject.LITERATURE,
            );
        });

        it("should create multiple awards with different subjects", () => {
            // Arrange
            const subjects = [
                NationalExcellentStudentExamSubject.MATHEMATICS,
                NationalExcellentStudentExamSubject.PHYSICS,
                NationalExcellentStudentExamSubject.CHEMISTRY,
                NationalExcellentStudentExamSubject.BIOLOGY,
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.LITERATURE,
            ];

            const awardRequests: AwardRequest[] = subjects.map((subject) => ({
                category: subject,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            }));

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(results).toHaveLength(subjects.length);
            subjects.forEach((subject, index) => {
                expect(results[index].category).toBe(subject);
            });
        });

        it("should handle language subjects", () => {
            // Arrange
            const languageSubjects = [
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.FRENCH,
                NationalExcellentStudentExamSubject.CHINESE,
                NationalExcellentStudentExamSubject.JAPANESE,
                NationalExcellentStudentExamSubject.RUSSIAN,
            ];

            const awardRequests: AwardRequest[] = languageSubjects.map(
                (subject) => ({
                    category: subject,
                    level: Rank.SECOND,
                    name: NationalExcellentExamType.NATIONAL,
                }),
            );

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(results).toHaveLength(languageSubjects.length);
            results.forEach((result, index) => {
                expect(result.category).toBe(languageSubjects[index]);
                expect(result.level).toBe(Rank.SECOND);
            });
        });
    });

    describe("Database Integration", () => {
        it("should persist award entity to database", async () => {
            // Create a student first
            const student = studentRepository.create();
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const awardEntity = awardService.createAwardEntity(awardRequest);
            awardEntity.studentId = savedStudent.id;

            // Act
            const savedAward = await awardRepository.save(awardEntity);
            createdAwardIds.push(savedAward.id);

            // Assert
            expect(savedAward.id).toBeDefined();
            expect(savedAward.createdAt).toBeDefined();
            expect(savedAward.updatedAt).toBeDefined();
            expect(savedAward.category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(savedAward.level).toBe(Rank.FIRST);
            expect(savedAward.studentId).toBe(savedStudent.id);
        });

        it("should persist multiple awards to database", async () => {
            // Create a student
            const student = studentRepository.create({});
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.PHYSICS,
                    level: Rank.SECOND,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.CHEMISTRY,
                    level: Rank.THIRD,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            const awardEntities =
                awardService.createAwardEntities(awardRequests);
            awardEntities.forEach((award) => {
                award.studentId = savedStudent.id;
            });

            // Act
            const savedAwards = await awardRepository.save(awardEntities);
            savedAwards.forEach((award) => createdAwardIds.push(award.id));

            // Assert
            expect(savedAwards).toHaveLength(3);
            savedAwards.forEach((award, index) => {
                expect(award.id).toBeDefined();
                expect(award.studentId).toBe(savedStudent.id);
                expect(award.category).toBe(awardRequests[index].category);
                expect(award.level).toBe(awardRequests[index].level);
            });
        });

        it("should retrieve saved award from database", async () => {
            // Arrange
            const awardRepository = dataSource.getRepository(AwardEntity);
            const studentRepository = dataSource.getRepository(StudentEntity);

            const student = studentRepository.create({});
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.ENGLISH,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const awardEntity = awardService.createAwardEntity(awardRequest);
            awardEntity.studentId = savedStudent.id;
            const savedAward = await awardRepository.save(awardEntity);
            createdAwardIds.push(savedAward.id);

            // Act
            const retrievedAward = await awardRepository.findOne({
                where: { id: savedAward.id },
            });

            // Assert
            expect(retrievedAward).toBeDefined();
            expect(retrievedAward?.id).toBe(savedAward.id);
            expect(retrievedAward?.category).toBe(
                NationalExcellentStudentExamSubject.ENGLISH,
            );
            expect(retrievedAward?.level).toBe(Rank.FIRST);
            expect(retrievedAward?.studentId).toBe(savedStudent.id);
        });

        it("should delete award from database", async () => {
            // Arrange
            const student = studentRepository.create({});
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.HISTORY,
                level: Rank.CONSOLATION,
                name: NationalExcellentExamType.NATIONAL,
            };

            const awardEntity = awardService.createAwardEntity(awardRequest);
            awardEntity.studentId = savedStudent.id;
            const savedAward = await awardRepository.save(awardEntity);

            // Act
            await awardRepository.delete(savedAward.id);

            // Assert
            const deletedAward = await awardRepository.findOne({
                where: { id: savedAward.id },
            });
            expect(deletedAward).toBeNull();
        });
    });

    describe("Edge Cases and Validation", () => {
        it("should handle all subject categories correctly", () => {
            // Arrange
            const allSubjects = [
                NationalExcellentStudentExamSubject.MATHEMATICS,
                NationalExcellentStudentExamSubject.PHYSICS,
                NationalExcellentStudentExamSubject.CHEMISTRY,
                NationalExcellentStudentExamSubject.BIOLOGY,
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.LITERATURE,
                NationalExcellentStudentExamSubject.HISTORY,
                NationalExcellentStudentExamSubject.GEOGRAPHY,
                NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY,
                NationalExcellentStudentExamSubject.FRENCH,
                NationalExcellentStudentExamSubject.CHINESE,
                NationalExcellentStudentExamSubject.JAPANESE,
                NationalExcellentStudentExamSubject.RUSSIAN,
            ];

            // Act & Assert
            allSubjects.forEach((subject) => {
                const awardRequest: AwardRequest = {
                    category: subject,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.category).toBe(subject);
            });
        });

        it("should handle all rank levels correctly", () => {
            // Arrange
            const allRanks = [
                Rank.FIRST,
                Rank.SECOND,
                Rank.THIRD,
                Rank.CONSOLATION,
            ];

            // Act & Assert
            allRanks.forEach((rank) => {
                const awardRequest: AwardRequest = {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: rank,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.level).toBe(rank);
            });
        });

        it("should create large batch of awards efficiently", () => {
            // Arrange
            const largeAwardArray: AwardRequest[] = Array.from(
                { length: 50 },
                (_, i) => ({
                    category:
                        i % 2 === 0
                            ? NationalExcellentStudentExamSubject.MATHEMATICS
                            : NationalExcellentStudentExamSubject.PHYSICS,
                    level: [
                        Rank.FIRST,
                        Rank.SECOND,
                        Rank.THIRD,
                        Rank.CONSOLATION,
                    ][i % 4],
                    name: NationalExcellentExamType.NATIONAL,
                }),
            );

            // Act
            const startTime = Date.now();
            const results = awardService.createAwardEntities(largeAwardArray);
            const endTime = Date.now();

            // Assert
            expect(results).toHaveLength(50);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle student with multiple awards across different subjects", async () => {
            // Arrange
            const student = studentRepository.create({});
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.PHYSICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.ENGLISH,
                    level: Rank.SECOND,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            const awardEntities =
                awardService.createAwardEntities(awardRequests);
            awardEntities.forEach((award) => {
                award.studentId = savedStudent.id;
            });

            // Act
            const savedAwards = await awardRepository.save(awardEntities);
            savedAwards.forEach((award) => createdAwardIds.push(award.id));

            // Assert
            const studentAwards = await awardRepository.find({
                where: { studentId: savedStudent.id },
            });

            expect(studentAwards).toHaveLength(3);
            expect(
                studentAwards.some(
                    (a) =>
                        a.category ===
                        NationalExcellentStudentExamSubject.MATHEMATICS,
                ),
            ).toBe(true);
            expect(
                studentAwards.some(
                    (a) =>
                        a.category ===
                        NationalExcellentStudentExamSubject.PHYSICS,
                ),
            ).toBe(true);
            expect(
                studentAwards.some(
                    (a) =>
                        a.category ===
                        NationalExcellentStudentExamSubject.ENGLISH,
                ),
            ).toBe(true);
        });

        it("should maintain award data integrity with createdBy field", async () => {
            // Arrange
            const student = studentRepository.create({});
            const savedStudent = await studentRepository.save(student);
            createdStudentIds.push(savedStudent.id);

            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.CHEMISTRY,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const awardEntity = awardService.createAwardEntity(awardRequest);
            awardEntity.studentId = savedStudent.id;

            // Act
            const savedAward = await awardRepository.save(awardEntity);
            createdAwardIds.push(savedAward.id);

            const retrievedAward = await awardRepository.findOne({
                where: { id: savedAward.id },
            });

            // Assert
            expect(retrievedAward?.createdBy).toBe(Role.ANONYMOUS);
            expect(retrievedAward?.createdAt).toBeDefined();
            expect(retrievedAward?.updatedAt).toBeDefined();
        });
    });
});
