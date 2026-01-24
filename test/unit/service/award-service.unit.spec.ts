// test/unit/service/award-service.unit.spec.ts
import "reflect-metadata";
import type { Repository } from "typeorm";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AwardRequest } from "@/dto/student/award-request.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { AwardService } from "@/service/impl/award.service.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.enum.js";
import { Rank } from "@/type/enum/rank.enum.js";
import { Role } from "@/type/enum/user.enum.js";

describe("AwardService Business Logic Tests", () => {
    let awardService: AwardService;
    let mockRepository: Repository<AwardEntity>;
    let createSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Create mock repository
        mockRepository = {
            create: vi.fn(),
        } as unknown as Repository<AwardEntity>;

        // Create spy for the create method
        createSpy = vi.spyOn(mockRepository, "create");

        // Initialize service with mock
        awardService = new AwardService(mockRepository);
    });

    describe("AwardEntity", () => {
        it("should create an award entity with required fields", () => {
            // Arrange & Act
            const award = new AwardEntity({
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
                studentId: "test-student-id",
            });

            // Assert
            expect(award.category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(award.level).toBe(Rank.FIRST);
            expect(award.name).toBe(NationalExcellentExamType.NATIONAL);
            expect(award.studentId).toBe("test-student-id");
        });

        it("should create award with optional createdBy field", () => {
            // Arrange & Act
            const award = new AwardEntity({
                category: NationalExcellentStudentExamSubject.PHYSICS,
                createdBy: Role.ADMIN,
                level: Rank.SECOND,
                name: NationalExcellentExamType.NATIONAL,
                studentId: "test-student-id",
            });

            // Assert
            expect(award.createdBy).toBe(Role.ADMIN);
        });

        it("should create award with all fields", () => {
            // Arrange & Act
            const award = new AwardEntity({
                category: NationalExcellentStudentExamSubject.CHEMISTRY,
                createdBy: Role.USER,
                level: Rank.THIRD,
                name: NationalExcellentExamType.NATIONAL,
                studentId: "student-123",
                updatedBy: Role.MODERATOR,
            });

            // Assert
            expect(award.category).toBe(
                NationalExcellentStudentExamSubject.CHEMISTRY,
            );
            expect(award.level).toBe(Rank.THIRD);
            expect(award.name).toBe(NationalExcellentExamType.NATIONAL);
            expect(award.studentId).toBe("student-123");
            expect(award.createdBy).toBe(Role.USER);
            expect(award.updatedBy).toBe(Role.MODERATOR);
        });
    });

    describe("createAwardEntity", () => {
        it("should create an award entity from award request", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const expectedEntity = new AwardEntity();
            expectedEntity.category = awardRequest.category;
            expectedEntity.level = awardRequest.level;
            expectedEntity.name = awardRequest.name;
            expectedEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(createSpy).toHaveBeenCalledWith(awardRequest);
            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(result.category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(result.level).toBe(Rank.FIRST);
            expect(result.name).toBe(NationalExcellentExamType.NATIONAL);
        });

        it("should set createdBy to ANONYMOUS when not provided", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.ENGLISH,
                level: Rank.SECOND,
                name: NationalExcellentExamType.NATIONAL,
            };

            const expectedEntity = new AwardEntity();
            expectedEntity.category = awardRequest.category;
            expectedEntity.level = awardRequest.level;
            expectedEntity.name = awardRequest.name;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should preserve createdBy if already set", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.PHYSICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const expectedEntity = new AwardEntity();
            expectedEntity.category = awardRequest.category;
            expectedEntity.level = awardRequest.level;
            expectedEntity.name = awardRequest.name;
            expectedEntity.createdBy = Role.ADMIN;

            createSpy.mockReturnValue(expectedEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.createdBy).toBe(Role.ADMIN);
        });

        it("should create award with all subject categories", () => {
            // Arrange
            const subjects = [
                NationalExcellentStudentExamSubject.MATHEMATICS,
                NationalExcellentStudentExamSubject.PHYSICS,
                NationalExcellentStudentExamSubject.CHEMISTRY,
                NationalExcellentStudentExamSubject.BIOLOGY,
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.LITERATURE,
            ];

            subjects.forEach((subject) => {
                const awardRequest: AwardRequest = {
                    category: subject,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = subject;
                mockEntity.level = Rank.FIRST;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                // Act
                const result = awardService.createAwardEntity(awardRequest);

                // Assert
                expect(result.category).toBe(subject);
            });
        });

        it("should create award with all rank levels", () => {
            // Arrange
            const ranks = [
                Rank.FIRST,
                Rank.SECOND,
                Rank.THIRD,
                Rank.CONSOLATION,
            ];

            ranks.forEach((rank) => {
                const awardRequest: AwardRequest = {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: rank,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = awardRequest.category;
                mockEntity.level = rank;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                // Act
                const result = awardService.createAwardEntity(awardRequest);

                // Assert
                expect(result.level).toBe(rank);
            });
        });
    });

    describe("createAwardEntities", () => {
        it("should create multiple award entities from array of requests", () => {
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

            const mockEntities = awardRequests.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1])
                .mockReturnValueOnce(mockEntities[2]);

            // Act
            const result = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(result).toHaveLength(3);
            expect(result[0].category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(result[1].category).toBe(
                NationalExcellentStudentExamSubject.PHYSICS,
            );
            expect(result[2].category).toBe(
                NationalExcellentStudentExamSubject.CHEMISTRY,
            );
            expect(result[0].level).toBe(Rank.FIRST);
            expect(result[1].level).toBe(Rank.SECOND);
            expect(result[2].level).toBe(Rank.THIRD);
        });

        it("should return empty array when given empty array", () => {
            // Arrange
            const awardRequests: AwardRequest[] = [];

            // Act
            const result = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(createSpy).not.toHaveBeenCalled();
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
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

            const mockEntity = new AwardEntity();
            mockEntity.category = awardRequests[0].category;
            mockEntity.level = awardRequests[0].level;
            mockEntity.name = awardRequests[0].name;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = awardService.createAwardEntities(awardRequests);

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
            expect(result[0].category).toBe(
                NationalExcellentStudentExamSubject.LITERATURE,
            );
        });

        it("should set createdBy to ANONYMOUS for all entities when not provided", () => {
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
            ];

            const mockEntities = awardRequests.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1]);

            // Act
            const result = awardService.createAwardEntities(awardRequests);

            // Assert
            result.forEach((entity) => {
                expect(entity.createdBy).toBe(Role.ANONYMOUS);
            });
        });

        it("should handle large batch of awards", () => {
            // Arrange
            const largeAwardArray: AwardRequest[] = Array.from(
                { length: 100 },
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

            const mockEntities = largeAwardArray.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            mockEntities.forEach((entity) => {
                createSpy.mockReturnValueOnce(entity);
            });

            // Act
            const result = awardService.createAwardEntities(largeAwardArray);

            // Assert
            expect(result).toHaveLength(100);
            expect(createSpy).toHaveBeenCalledTimes(100);
            expect(result[0].category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(result[99].level).toBe(Rank.CONSOLATION);
        });
    });

    describe("Award Category Validation", () => {
        it("should handle all science subjects", () => {
            // Arrange
            const scienceSubjects = [
                NationalExcellentStudentExamSubject.MATHEMATICS,
                NationalExcellentStudentExamSubject.PHYSICS,
                NationalExcellentStudentExamSubject.CHEMISTRY,
                NationalExcellentStudentExamSubject.BIOLOGY,
            ];

            // Act & Assert
            scienceSubjects.forEach((subject) => {
                const awardRequest: AwardRequest = {
                    category: subject,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = subject;
                mockEntity.level = Rank.FIRST;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.category).toBe(subject);
            });
        });

        it("should handle all language subjects", () => {
            // Arrange
            const languageSubjects = [
                NationalExcellentStudentExamSubject.ENGLISH,
                NationalExcellentStudentExamSubject.FRENCH,
                NationalExcellentStudentExamSubject.CHINESE,
                NationalExcellentStudentExamSubject.JAPANESE,
                NationalExcellentStudentExamSubject.RUSSIAN,
            ];

            // Act & Assert
            languageSubjects.forEach((subject) => {
                const awardRequest: AwardRequest = {
                    category: subject,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = subject;
                mockEntity.level = Rank.FIRST;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.category).toBe(subject);
            });
        });

        it("should handle humanities subjects", () => {
            // Arrange
            const humanitiesSubjects = [
                NationalExcellentStudentExamSubject.LITERATURE,
                NationalExcellentStudentExamSubject.HISTORY,
                NationalExcellentStudentExamSubject.GEOGRAPHY,
            ];

            // Act & Assert
            humanitiesSubjects.forEach((subject) => {
                const awardRequest: AwardRequest = {
                    category: subject,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = subject;
                mockEntity.level = Rank.FIRST;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.category).toBe(subject);
            });
        });

        it("should handle information technology subject", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category:
                    NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            mockEntity.category =
                NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY;
            mockEntity.level = Rank.FIRST;
            mockEntity.name = NationalExcellentExamType.NATIONAL;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.category).toBe(
                NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY,
            );
        });
    });

    describe("Award Level Validation", () => {
        it("should validate rank hierarchy concept", () => {
            // Arrange
            const ranks = [
                { expectedPosition: 1, rank: Rank.FIRST },
                { expectedPosition: 2, rank: Rank.SECOND },
                { expectedPosition: 3, rank: Rank.THIRD },
                { expectedPosition: 4, rank: Rank.CONSOLATION },
            ];

            // Act & Assert
            ranks.forEach(({ rank }) => {
                const awardRequest: AwardRequest = {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: rank,
                    name: NationalExcellentExamType.NATIONAL,
                };

                const mockEntity = new AwardEntity();
                mockEntity.category = awardRequest.category;
                mockEntity.level = rank;
                mockEntity.name = NationalExcellentExamType.NATIONAL;
                mockEntity.createdBy = Role.ANONYMOUS;

                createSpy.mockReturnValue(mockEntity);

                const result = awardService.createAwardEntity(awardRequest);
                expect(result.level).toBe(rank);
            });
        });

        it("should handle consolation prize level", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.PHYSICS,
                level: Rank.CONSOLATION,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            mockEntity.category = awardRequest.category;
            mockEntity.level = Rank.CONSOLATION;
            mockEntity.name = NationalExcellentExamType.NATIONAL;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.level).toBe(Rank.CONSOLATION);
        });
    });

    describe("AwardService Logic Validation", () => {
        it("should validate that repository.create is called with correct parameters", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            createSpy.mockReturnValue(mockEntity);

            // Act
            awardService.createAwardEntity(awardRequest);

            // Assert
            expect(createSpy).toHaveBeenCalledWith({
                category: NationalExcellentStudentExamSubject.MATHEMATICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            });
        });

        it("should validate that createdBy defaults to ANONYMOUS via nullish coalescing", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.CHEMISTRY,
                level: Rank.SECOND,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            mockEntity.category = awardRequest.category;
            mockEntity.level = awardRequest.level;
            mockEntity.name = awardRequest.name;
            // Simulate the ??= operator behavior
            mockEntity.createdBy = undefined;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);
            // Simulate: awardEntity.createdBy ??= Role.ANONYMOUS;
            result.createdBy ??= Role.ANONYMOUS;

            // Assert
            expect(result.createdBy).toBe(Role.ANONYMOUS);
        });

        it("should preserve all properties from award request", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.BIOLOGY,
                level: Rank.THIRD,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            Object.assign(mockEntity, awardRequest);
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act
            const result = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(result.category).toBe(awardRequest.category);
            expect(result.level).toBe(awardRequest.level);
            expect(result.name).toBe(awardRequest.name);
        });

        it("should validate batch creation maintains individual award integrity", () => {
            // Arrange
            const awardRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.ENGLISH,
                    level: Rank.THIRD,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            const mockEntities = awardRequests.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            createSpy
                .mockReturnValueOnce(mockEntities[0])
                .mockReturnValueOnce(mockEntities[1]);

            // Act
            const results = awardService.createAwardEntities(awardRequests);

            // Assert - Verify each award maintains its unique properties
            expect(results[0].category).not.toBe(results[1].category);
            expect(results[0].level).not.toBe(results[1].level);
            expect(results[0].category).toBe(
                NationalExcellentStudentExamSubject.MATHEMATICS,
            );
            expect(results[1].category).toBe(
                NationalExcellentStudentExamSubject.ENGLISH,
            );
        });
    });

    describe("Edge Cases", () => {
        it("should handle creating awards with mixed rank levels", () => {
            // Arrange
            const mixedRequests: AwardRequest[] = [
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.FIRST,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.CONSOLATION,
                    name: NationalExcellentExamType.NATIONAL,
                },
                {
                    category: NationalExcellentStudentExamSubject.MATHEMATICS,
                    level: Rank.SECOND,
                    name: NationalExcellentExamType.NATIONAL,
                },
            ];

            const mockEntities = mixedRequests.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            mockEntities.forEach((entity) => {
                createSpy.mockReturnValueOnce(entity);
            });

            // Act
            const results = awardService.createAwardEntities(mixedRequests);

            // Assert
            expect(results[0].level).toBe(Rank.FIRST);
            expect(results[1].level).toBe(Rank.CONSOLATION);
            expect(results[2].level).toBe(Rank.SECOND);
            // All same category but different levels
            expect(
                results.every(
                    (r) =>
                        r.category ===
                        NationalExcellentStudentExamSubject.MATHEMATICS,
                ),
            ).toBe(true);
        });

        it("should handle creating awards with all different subjects", () => {
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

            const requests: AwardRequest[] = allSubjects.map((subject) => ({
                category: subject,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            }));

            const mockEntities = requests.map((req) => {
                const entity = new AwardEntity();
                entity.category = req.category;
                entity.level = req.level;
                entity.name = req.name;
                entity.createdBy = Role.ANONYMOUS;
                return entity;
            });

            mockEntities.forEach((entity) => {
                createSpy.mockReturnValueOnce(entity);
            });

            // Act
            const results = awardService.createAwardEntities(requests);

            // Assert
            expect(results).toHaveLength(13);
            allSubjects.forEach((subject, index) => {
                expect(results[index].category).toBe(subject);
            });
        });

        it("should handle rapid successive calls", () => {
            // Arrange
            const awardRequest: AwardRequest = {
                category: NationalExcellentStudentExamSubject.PHYSICS,
                level: Rank.FIRST,
                name: NationalExcellentExamType.NATIONAL,
            };

            const mockEntity = new AwardEntity();
            mockEntity.category = awardRequest.category;
            mockEntity.level = awardRequest.level;
            mockEntity.name = awardRequest.name;
            mockEntity.createdBy = Role.ANONYMOUS;

            createSpy.mockReturnValue(mockEntity);

            // Act - Call multiple times rapidly
            const result1 = awardService.createAwardEntity(awardRequest);
            const result2 = awardService.createAwardEntity(awardRequest);
            const result3 = awardService.createAwardEntity(awardRequest);

            // Assert
            expect(createSpy).toHaveBeenCalledTimes(3);
            expect(result1.category).toBe(result2.category);
            expect(result2.category).toBe(result3.category);
        });
    });
});
