// test/integration/service/major-service.integration.spec.ts
import { type DataSource, QueryFailedError, type Repository } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { IMajorService } from "@/service/major-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { MajorEntity } from "@/entity/uni_guide/major.entity.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";
import { MajorGroup } from "@/type/enum/major.enum.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

describe("MajorService Integration Tests", () => {
    let dataSource: DataSource;
    let majorService: IMajorService;
    let majorGroupRepository: Repository<MajorGroupEntity>;
    let majorRepository: Repository<MajorEntity>;

    beforeAll(async () => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        majorService = iocContainer.get<IMajorService>(TYPES.IMajorService);
        majorGroupRepository = dataSource.getRepository(MajorGroupEntity);
        majorRepository = dataSource.getRepository(MajorEntity);

        // Verify that migration data exists
        const groupCount = await majorGroupRepository.count();
        if (groupCount === 0) {
            throw new Error(
                "Major groups not found in database. Please run migrations first.",
            );
        }
    });

    afterAll(async () => {
        // Cleanup is handled by test database reset if needed
        // No need to delete migration data as it should persist
    });

    describe("findMajorGroupEntitiesBy", () => {
        it("should retrieve single major group by enum value", async () => {
            // Arrange
            const majorGroups = [MajorGroup.COMPUTER_AND_IT];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert
            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe(MajorGroup.COMPUTER_AND_IT);
            expect(result[0].code).toBe("748");
            expect(result[0].englishName).toBe("COMPUTER_AND_IT");
            expect(result[0].id).toBeDefined();
            expect(result[0].createdAt).toBeDefined();
            expect(result[0].updatedAt).toBeDefined();
        });

        it("should retrieve multiple major groups by enum values", async () => {
            // Arrange
            const majorGroups = [
                MajorGroup.COMPUTER_AND_IT,
                MajorGroup.ENGINEERING,
                MajorGroup.BUSINESS_AND_MANAGEMENT,
            ];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert
            expect(result).toBeDefined();
            expect(result).toHaveLength(3);

            const names = result.map((entity) => entity.name);
            expect(names).toContain(MajorGroup.COMPUTER_AND_IT);
            expect(names).toContain(MajorGroup.ENGINEERING);
            expect(names).toContain(MajorGroup.BUSINESS_AND_MANAGEMENT);

            const codes = result.map((entity) => entity.code);
            expect(codes).toContain("748"); // Computer and IT
            expect(codes).toContain("752"); // Engineering
            expect(codes).toContain("734"); // Business and Management
        });

        it("should retrieve all major groups when provided complete list", async () => {
            // Arrange
            const allMajorGroups = Object.values(MajorGroup);

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(allMajorGroups);

            // Assert
            expect(result).toBeDefined();
            expect(result).toHaveLength(allMajorGroups.length);

            // Verify all groups are present
            const resultNames = result.map((entity) => entity.name);
            allMajorGroups.forEach((majorGroup) => {
                expect(resultNames).toContain(majorGroup);
            });
        });

        it("should throw QueryFailedError for non-existent major group (invalid enum)", async () => {
            // Arrange
            const invalidMajorGroup = "Invalid Major Group" as MajorGroup;
            const majorGroups = [invalidMajorGroup];

            // Act & Assert
            await expect(
                majorService.findMajorGroupEntitiesBy(majorGroups),
            ).rejects.toThrow();

            let error: unknown;
            try {
                await majorService.findMajorGroupEntitiesBy(majorGroups);
                expect.fail("Should have thrown an error");
            } catch (e: unknown) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(String(error)).toContain("invalid input value for enum");
        });

        it("should throw QueryFailedError when one of multiple groups is invalid enum", async () => {
            // Arrange
            const invalidMajorGroup = "Non-existent Group" as MajorGroup;
            const majorGroups = [
                MajorGroup.COMPUTER_AND_IT,
                invalidMajorGroup,
                MajorGroup.ENGINEERING,
            ];

            // Act & Assert
            await expect(
                majorService.findMajorGroupEntitiesBy(majorGroups),
            ).rejects.toThrow();

            let error: unknown;
            try {
                await majorService.findMajorGroupEntitiesBy(majorGroups);
                expect.fail("Should have thrown an error");
            } catch (e: unknown) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(String(error)).toContain("invalid input value for enum");
        });

        it("should throw QueryFailedError for multiple invalid enum groups", async () => {
            // Arrange
            const invalidGroup1 = "Invalid Group 1" as MajorGroup;
            const invalidGroup2 = "Invalid Group 2" as MajorGroup;
            const majorGroups = [invalidGroup1, invalidGroup2];

            // Act & Assert
            await expect(
                majorService.findMajorGroupEntitiesBy(majorGroups),
            ).rejects.toThrow();

            let error: unknown;
            try {
                await majorService.findMajorGroupEntitiesBy(majorGroups);
                expect.fail("Should have thrown an error");
            } catch (e: unknown) {
                error = e;
            }

            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(QueryFailedError);
            expect(String(error)).toContain("invalid input value for enum");
        });

        it("should handle empty array input", async () => {
            // Arrange
            const majorGroups: MajorGroup[] = [];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert
            expect(result).toBeDefined();
            expect(result).toHaveLength(0);
        });

        it("should throw EntityNotFoundException when database returns fewer results than requested", async () => {
            // Arrange - Mock the repository to simulate missing database records
            const requestedGroups = [
                MajorGroup.COMPUTER_AND_IT,
                MajorGroup.ENGINEERING,
                MajorGroup.HEALTH,
            ];

            // Fetch real data for 2 groups to use in mock
            const csGroup = await majorGroupRepository.findBy({
                name: MajorGroup.COMPUTER_AND_IT,
            });
            const engGroup = await majorGroupRepository.findBy({
                name: MajorGroup.ENGINEERING,
            });

            // Mock findBy to return only 2 results instead of 3
            // This simulates the case where HEALTH group is missing from database
            const mockFindBy = vi
                .spyOn(majorGroupRepository, "findBy")
                .mockResolvedValueOnce([...csGroup, ...engGroup]);

            // Act & Assert
            let error: unknown;
            try {
                await majorService.findMajorGroupEntitiesBy(requestedGroups);
                expect.fail("Should have thrown EntityNotFoundException");
            } catch (e: unknown) {
                error = e;
            }

            expect(error).toBeInstanceOf(EntityNotFoundException);
            expect((error as EntityNotFoundException).message).toContain(
                "Major group not found:",
            );
            expect((error as EntityNotFoundException).message).toContain(
                MajorGroup.HEALTH,
            );
            mockFindBy.mockRestore();
            const normalResult = await majorService.findMajorGroupEntitiesBy([
                MajorGroup.COMPUTER_AND_IT,
            ]);
            expect(normalResult).toHaveLength(1);
        });

        it("should verify major group relationships with majors", async () => {
            // Arrange
            const majorGroups = [MajorGroup.COMPUTER_AND_IT];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Get majors for this group directly via repository
            const majors = await majorRepository.findBy({
                group_id: result[0].id,
            });

            // Assert
            expect(result[0].code).toBe("748");
            expect(result[0].name).toBe(MajorGroup.COMPUTER_AND_IT);
            expect(majors.length).toBeGreaterThan(0);

            // Verify expected majors exist (from migration data)
            const majorCodes = majors.map((m) => m.code);
            expect(majorCodes).toContain("74801"); // Khoa học máy tính
            expect(majorCodes).toContain("74802"); // Mạng máy tính và truyền thông dữ liệu
            expect(majorCodes).toContain("74803"); // Kỹ thuật phần mềm
            expect(majorCodes).toContain("74804"); // Hệ thống thông tin
            expect(majorCodes).toContain("74805"); // Kỹ thuật máy tính

            // Verify all majors belong to the correct group
            majors.forEach((major) => {
                expect(major.group_id).toBe(result[0].id);
                expect(major.code.startsWith("748")).toBe(true);
                expect(major.name).toBeDefined();
                expect(major.createdAt).toBeInstanceOf(Date);
                expect(major.updatedAt).toBeInstanceOf(Date);
            });
        });

        it("should return consistent results for duplicate requests", async () => {
            // Arrange
            const majorGroups = [
                MajorGroup.HEALTH,
                MajorGroup.NATURAL_SCIENCES,
            ];

            // Act
            const result1 =
                await majorService.findMajorGroupEntitiesBy(majorGroups);
            const result2 =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert
            expect(result1).toHaveLength(result2.length);
            expect(result1[0].id).toBe(result2[0].id);
            expect(result1[1].id).toBe(result2[1].id);
            expect(result1[0].name).toBe(result2[0].name);
            expect(result1[1].name).toBe(result2[1].name);
        });

        it("should verify all education-related major groups", async () => {
            // Arrange
            const educationGroups = [
                MajorGroup.EDUCATION_AND_TEACHER_TRAINING,
                MajorGroup.ARTS,
                MajorGroup.HUMANITIES,
            ];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(educationGroups);

            // Assert
            expect(result).toHaveLength(3);

            const eduGroup = result.find(
                (r) => r.name === MajorGroup.EDUCATION_AND_TEACHER_TRAINING,
            );
            expect(eduGroup).toBeDefined();
            expect(eduGroup?.code).toBe("714");

            const artsGroup = result.find((r) => r.name === MajorGroup.ARTS);
            expect(artsGroup).toBeDefined();
            expect(artsGroup?.code).toBe("721");

            const humanitiesGroup = result.find(
                (r) => r.name === MajorGroup.HUMANITIES,
            );
            expect(humanitiesGroup).toBeDefined();
            expect(humanitiesGroup?.code).toBe("722");
        });

        it("should verify all STEM-related major groups", async () => {
            // Arrange
            const stemGroups = [
                MajorGroup.MATHEMATICS_AND_STATISTICS,
                MajorGroup.NATURAL_SCIENCES,
                MajorGroup.COMPUTER_AND_IT,
                MajorGroup.ENGINEERING,
                MajorGroup.ENGINEERING_TECHNOLOGY,
            ];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(stemGroups);

            // Assert
            expect(result).toHaveLength(5);

            const codes = result.map((r) => r.code);
            expect(codes).toContain("746"); // Mathematics and Statistics
            expect(codes).toContain("744"); // Natural Sciences
            expect(codes).toContain("748"); // Computer and IT
            expect(codes).toContain("752"); // Engineering
            expect(codes).toContain("751"); // Engineering Technology
        });

        it("should verify all business-related major groups", async () => {
            // Arrange
            const businessGroups = [
                MajorGroup.BUSINESS_AND_MANAGEMENT,
                MajorGroup.SOCIAL_AND_BEHAVIORAL_SCIENCES,
                MajorGroup.LAW,
            ];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(businessGroups);

            // Assert
            expect(result).toHaveLength(3);

            const businessGroup = result.find((r) => r.code === "734");
            expect(businessGroup).toBeDefined();
            expect(businessGroup?.name).toBe(
                MajorGroup.BUSINESS_AND_MANAGEMENT,
            );

            const socialGroup = result.find((r) => r.code === "731");
            expect(socialGroup).toBeDefined();
            expect(socialGroup?.name).toBe(
                MajorGroup.SOCIAL_AND_BEHAVIORAL_SCIENCES,
            );

            const lawGroup = result.find((r) => r.code === "738");
            expect(lawGroup).toBeDefined();
            expect(lawGroup?.name).toBe(MajorGroup.LAW);
        });

        it("should handle ORDER BY ensuring consistent ordering", async () => {
            // Arrange
            const majorGroups = [
                MajorGroup.VETERINARY,
                MajorGroup.HEALTH,
                MajorGroup.LIFE_SCIENCES,
            ];

            // Act - Multiple calls to verify consistent ordering
            const result1 =
                await majorService.findMajorGroupEntitiesBy(majorGroups);
            const result2 =
                await majorService.findMajorGroupEntitiesBy(majorGroups);
            const result3 =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert - Results should be in consistent order
            expect(result1.map((r) => r.id)).toStrictEqual(
                result2.map((r) => r.id),
            );
            expect(result2.map((r) => r.id)).toStrictEqual(
                result3.map((r) => r.id),
            );
        });

        it("should verify OTHER major group exists", async () => {
            // Arrange
            const majorGroups = [MajorGroup.OTHER];

            // Act
            const result =
                await majorService.findMajorGroupEntitiesBy(majorGroups);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe(MajorGroup.OTHER);
            expect(result[0].code).toBe("790");
            expect(result[0].englishName).toBe("OTHER");
        });

        describe("Data Integrity Checks", () => {
            it("should verify all major groups have valid codes", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                result.forEach((group) => {
                    expect(group.code).toMatch(/^\d{3}$/); // 3-digit code
                    expect(group.code.length).toBe(3);
                });
            });

            it("should verify all major groups have valid english names", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                result.forEach((group) => {
                    expect(group.englishName).toBeDefined();
                    expect(group.englishName).toMatch(/^[A-Z_]+$/); // SCREAMING_SNAKE_CASE
                    expect(group.englishName.length).toBeGreaterThan(0);
                });
            });

            it("should verify all major groups have created and updated timestamps", async () => {
                // Arrange
                const sampleGroups = [
                    MajorGroup.COMPUTER_AND_IT,
                    MajorGroup.ENGINEERING,
                    MajorGroup.HEALTH,
                ];

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(sampleGroups);

                // Assert
                result.forEach((group) => {
                    expect(group.createdAt).toBeInstanceOf(Date);
                    expect(group.updatedAt).toBeInstanceOf(Date);
                    expect(group.createdAt.getTime()).toBeLessThanOrEqual(
                        group.updatedAt.getTime(),
                    );
                });
            });

            it("should verify unique codes across all major groups", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                const codes = result.map((r) => r.code);
                const uniqueCodes = new Set(codes);
                expect(uniqueCodes.size).toBe(codes.length);
            });

            it("should verify unique IDs across all major groups", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                const ids = result.map((r) => r.id);
                const uniqueIds = new Set(ids);
                expect(uniqueIds.size).toBe(ids.length);
            });
        });

        describe("Edge Cases", () => {
            it("should handle single group array", async () => {
                // Arrange
                const majorGroups = [MajorGroup.LAW];

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                // Assert
                expect(result).toHaveLength(1);
                expect(result[0].name).toBe(MajorGroup.LAW);
            });

            it("should handle duplicate major groups in input array", async () => {
                // Arrange - Input has duplicates
                const majorGroups = [
                    MajorGroup.COMPUTER_AND_IT,
                    MajorGroup.COMPUTER_AND_IT,
                    MajorGroup.ENGINEERING,
                ];

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                // Assert - TypeORM's In() handles duplicates, returns unique results
                expect(result.length).toBeGreaterThan(0);
                expect(result.length).toBeLessThanOrEqual(2); // At most 2 unique groups

                const names = result.map((r) => r.name);
                expect(names).toContain(MajorGroup.COMPUTER_AND_IT);
                expect(names).toContain(MajorGroup.ENGINEERING);

                // Verify unique results
                const uniqueIds = new Set(result.map((r) => r.id));
                expect(uniqueIds.size).toBe(result.length);
            });

            it("should throw QueryFailedError for mixed valid and invalid enum groups", async () => {
                // Arrange
                const majorGroups = [
                    MajorGroup.COMPUTER_AND_IT,
                    "Completely Invalid" as MajorGroup,
                    MajorGroup.HEALTH,
                    "Another Invalid" as MajorGroup,
                ];

                // Act & Assert
                // PostgreSQL throws QueryFailedError for invalid enum values
                await expect(
                    majorService.findMajorGroupEntitiesBy(majorGroups),
                ).rejects.toThrow();

                let error: unknown;
                try {
                    await majorService.findMajorGroupEntitiesBy(majorGroups);
                    expect.fail("Should have thrown an error");
                } catch (e: unknown) {
                    error = e;
                }

                expect(error).toBeDefined();
                expect(error).toBeInstanceOf(QueryFailedError);
                expect(String(error)).toContain("invalid input value for enum");
            });
            it("should return same results regardless of input order", async () => {
                const groups1 = [
                    MajorGroup.HEALTH,
                    MajorGroup.LAW,
                    MajorGroup.ARTS,
                ];
                const groups2 = [
                    MajorGroup.ARTS,
                    MajorGroup.HEALTH,
                    MajorGroup.LAW,
                ];

                const result1 =
                    await majorService.findMajorGroupEntitiesBy(groups1);
                const result2 =
                    await majorService.findMajorGroupEntitiesBy(groups2);

                const ids1 = new Set(result1.map((r) => r.id));
                const ids2 = new Set(result2.map((r) => r.id));

                expect(ids1).toEqual(ids2);
            });
            it("should handle array with many duplicates efficiently", async () => {
                const majorGroups = Array.from(
                    { length: 1000 },
                    (): MajorGroup => MajorGroup.COMPUTER_AND_IT,
                );
                const result =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                expect(result).toHaveLength(1);
            });
        });

        describe("Performance Checks", () => {
            it("should retrieve large number of groups efficiently", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);
                const startTime = Date.now();

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);
                const endTime = Date.now();

                // Assert
                expect(result).toHaveLength(allGroups.length);
                const executionTime = endTime - startTime;

                // Should complete in reasonable time (adjust threshold as needed)
                expect(executionTime).toBeLessThan(1000); // Less than 1 second
            });

            it("should handle multiple sequential calls efficiently", async () => {
                // Arrange
                const majorGroups = [
                    MajorGroup.COMPUTER_AND_IT,
                    MajorGroup.ENGINEERING,
                ];

                // Act - Multiple sequential calls
                const promises = Array.from({ length: 10 }, () =>
                    majorService.findMajorGroupEntitiesBy(majorGroups),
                );

                const results = await Promise.all(promises);

                // Assert
                expect(results).toHaveLength(10);
                results.forEach((result) => {
                    expect(result).toHaveLength(2);
                });
            });
        });

        describe("Entity Structure Validation", () => {
            it("should verify major group entity has all required fields", async () => {
                // Arrange
                const majorGroups = [MajorGroup.HEALTH];

                // Act
                const result =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                // Assert
                const group = result[0];
                expect(group.id).toBeDefined();
                expect(group.code).toBeDefined();
                expect(group.name).toBeDefined();
                expect(group.englishName).toBeDefined();
                expect(group.createdAt).toBeInstanceOf(Date);
                expect(group.updatedAt).toBeInstanceOf(Date);

                // Verify types
                expect(typeof group.id).toBe("string");
                expect(typeof group.code).toBe("string");
                expect(typeof group.name).toBe("string");
                expect(typeof group.englishName).toBe("string");
            });

            it("should verify major entity structure", async () => {
                // Arrange
                const majorGroups = [MajorGroup.LAW];

                // Act
                const groups =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);
                const majors = await majorRepository.findBy({
                    group_id: groups[0].id,
                });

                // Assert
                expect(majors.length).toBeGreaterThan(0);
                const major = majors[0];
                expect(major.id).toBeDefined();
                expect(major.code).toBeDefined();
                expect(major.name).toBeDefined();
                expect(major.group_id).toBeDefined();
                expect(major.createdAt).toBeInstanceOf(Date);
                expect(major.updatedAt).toBeInstanceOf(Date);

                // Verify relationship
                expect(major.group_id).toBe(groups[0].id);
            });

            it("should verify code format consistency", async () => {
                // Arrange
                const majorGroups = [
                    MajorGroup.EDUCATION_AND_TEACHER_TRAINING,
                    MajorGroup.ARTS,
                    MajorGroup.HUMANITIES,
                ];

                // Act
                const groups =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                // Assert
                for (const group of groups) {
                    const majors = await majorRepository.findBy({
                        group_id: group.id,
                    });

                    // All majors should have codes starting with the group code
                    majors.forEach((major) => {
                        expect(major.code.startsWith(group.code)).toBe(true);
                        expect(major.code.length).toBe(5); // 5-digit major codes
                    });
                }
            });

            it("should verify major names are non-empty strings", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const groups =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                for (const group of groups) {
                    const majors = await majorRepository.findBy({
                        group_id: group.id,
                    });

                    majors.forEach((major) => {
                        expect(typeof major.name).toBe("string");
                        expect(major.name.length).toBeGreaterThan(0);
                        expect(major.name.trim()).toBe(major.name); // No leading/trailing spaces
                    });
                }
            });

            it("should verify each major group has at least one major", async () => {
                // Arrange - Get all groups except OTHER which might have only "Khác"
                const majorGroups = Object.values(MajorGroup).filter(
                    (g) => g !== MajorGroup.OTHER,
                );

                // Act
                const groups =
                    await majorService.findMajorGroupEntitiesBy(majorGroups);

                // Assert
                for (const group of groups) {
                    const majors = await majorRepository.findBy({
                        group_id: group.id,
                    });

                    expect(majors.length).toBeGreaterThan(0);
                }
            });

            it("should verify specific major groups have expected major counts", async () => {
                // Arrange & Act
                const csGroup = await majorService.findMajorGroupEntitiesBy([
                    MajorGroup.COMPUTER_AND_IT,
                ]);
                const csMajors = await majorRepository.findBy({
                    group_id: csGroup[0].id,
                });

                const healthGroup = await majorService.findMajorGroupEntitiesBy(
                    [MajorGroup.HEALTH],
                );
                const healthMajors = await majorRepository.findBy({
                    group_id: healthGroup[0].id,
                });

                const lawGroup = await majorService.findMajorGroupEntitiesBy([
                    MajorGroup.LAW,
                ]);
                const lawMajors = await majorRepository.findBy({
                    group_id: lawGroup[0].id,
                });

                // Assert - Based on migration data
                expect(csMajors.length).toBe(6); // 74801-74805 + 74890
                expect(healthMajors.length).toBe(8); // 77201-77207 + 77290
                expect(lawMajors.length).toBe(2); // 73801 + 73890
            });

            it("should verify OTHER major codes end with 90", async () => {
                // Arrange
                const allGroups = Object.values(MajorGroup);

                // Act
                const groups =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                for (const group of groups) {
                    const majors = await majorRepository.findBy({
                        group_id: group.id,
                    });

                    const otherMajors = majors.filter((m) =>
                        m.code.endsWith("90"),
                    );
                    const nonOtherMajors = majors.filter(
                        (m) => !m.code.endsWith("90"),
                    );

                    // Each group should have at least one "Khác" (Other) major
                    expect(otherMajors.length).toBeGreaterThan(0);

                    // "Khác" majors should have name "Khác"
                    otherMajors.forEach((major) => {
                        expect(major.name).toBe("Khác");
                    });

                    // Non-"Khác" majors should not have name "Khác"
                    nonOtherMajors.forEach((major) => {
                        expect(major.name).not.toBe("Khác");
                    });
                }
            });
        });

        describe("Migration Data Verification", () => {
            it("should verify total number of major groups", async () => {
                // Arrange
                const expectedCount = 24; // Based on migration data

                // Act
                const count = await majorGroupRepository.count();

                // Assert
                expect(count).toBe(expectedCount);
            });

            it("should verify specific major group codes", async () => {
                // Arrange
                const expectedCodeMapping = {
                    [MajorGroup.AGRICULTURE_FORESTRY_FISHERIES]: "762",
                    [MajorGroup.ARCHITECTURE_AND_CONSTRUCTION]: "758",
                    [MajorGroup.ARTS]: "721",
                    [MajorGroup.BUSINESS_AND_MANAGEMENT]: "734",
                    [MajorGroup.COMPUTER_AND_IT]: "748",
                    [MajorGroup.EDUCATION_AND_TEACHER_TRAINING]: "714",
                    [MajorGroup.ENGINEERING]: "752",
                    [MajorGroup.ENGINEERING_TECHNOLOGY]: "751",
                    [MajorGroup.ENVIRONMENT_AND_PROTECTION]: "785",
                    [MajorGroup.HEALTH]: "772",
                    [MajorGroup.HUMANITIES]: "722",
                    [MajorGroup.JOURNALISM_AND_INFORMATION]: "732",
                    [MajorGroup.LAW]: "738",
                    [MajorGroup.LIFE_SCIENCES]: "742",
                    [MajorGroup.MANUFACTURING_AND_PROCESSING]: "754",
                    [MajorGroup.MATHEMATICS_AND_STATISTICS]: "746",
                    [MajorGroup.NATURAL_SCIENCES]: "744",
                    [MajorGroup.OTHER]: "790",
                    [MajorGroup.SECURITY_DEFENSE]: "786",
                    [MajorGroup.SOCIAL_AND_BEHAVIORAL_SCIENCES]: "731",
                    [MajorGroup.SOCIAL_SERVICES]: "776",
                    [MajorGroup.TOURISM_HOSPITALITY_SPORTS_PERSONAL]: "781",
                    [MajorGroup.TRANSPORT_SERVICES]: "784",
                    [MajorGroup.VETERINARY]: "764",
                };

                // Act
                const allGroups = Object.values(MajorGroup);
                const result =
                    await majorService.findMajorGroupEntitiesBy(allGroups);

                // Assert
                result.forEach((group) => {
                    expect(group.code).toBe(expectedCodeMapping[group.name]);
                });
            });

            it("should verify all majors have valid group references", async () => {
                // Arrange
                const allMajors = await majorRepository.find();
                const allGroupIds = (await majorGroupRepository.find()).map(
                    (g) => g.id,
                );

                // Assert
                allMajors.forEach((major) => {
                    expect(allGroupIds).toContain(major.group_id);
                });
            });

            it("should verify no orphaned majors exist", async () => {
                // Arrange
                const allMajors = await majorRepository.find();

                // Act & Assert
                for (const major of allMajors) {
                    const group = await majorGroupRepository.findOneBy({
                        id: major.group_id,
                    });
                    expect(group).not.toBeNull();
                    expect(group).toBeDefined();
                }
            });
        });
    });
});
