import { AxiosError, AxiosInstance, isAxiosError } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionModelServiceConfig } from "@/config/prediction-model.config.js";
import { DEFAULT_VALIDATOR_OPTIONS } from "@/config/validator.config.js";
import { HsgSubject } from "@/dto/prediction/hsg-subject.enum.js";
import {
    L1BatchRequest,
    UserInputL1,
} from "@/dto/prediction/l1-request.dto.js";
import { L1PredictResult } from "@/dto/prediction/l1-response.dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { getCodeByVietnameseName } from "@/type/enum/major.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { UniType } from "@/type/enum/uni-type.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";

import { IPredictionL1Service } from "../prediction-l1-service.interface.js";

@injectable()
export class PredictionL1Service implements IPredictionL1Service {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.PredictionModelServiceConfig)
        private readonly config: PredictionModelServiceConfig,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.ConcurrencyUtil)
        private readonly concurrencyUtil: ConcurrencyUtil,
        @inject(TYPES.PredictionUtil)
        private readonly predictionUtil: PredictionUtil,
    ) {}

    /**
     * Combines L1 prediction results by keeping only the highest score for each admission code
     * and removing duplicates across all priority types.
     * @param results Array of L1PredictResult objects
     * @returns Combined results with highest scores and no duplicates
     */
    public combineL1Results(results: L1PredictResult[]): L1PredictResult[] {
        // Map to store the highest score for each admission code
        const admissionCodeScores = new Map<
            string,
            {
                loai_uu_tien: string;
                score: number;
            }
        >();

        // Collect all admission codes with their highest scores
        for (const result of results) {
            for (const [admissionCode, score] of Object.entries(
                result.ma_xet_tuyen,
            )) {
                const existing = admissionCodeScores.get(admissionCode);

                if (!existing || score > existing.score) {
                    admissionCodeScores.set(admissionCode, {
                        loai_uu_tien: result.loai_uu_tien,
                        score,
                    });
                }
            }
        }

        // Group by priority type
        const groupedResults = new Map<string, Record<string, number>>();

        for (const [admissionCode, data] of admissionCodeScores.entries()) {
            if (!groupedResults.has(data.loai_uu_tien)) {
                groupedResults.set(data.loai_uu_tien, {});
            }

            const group = groupedResults.get(data.loai_uu_tien);
            if (group) {
                group[admissionCode] = data.score;
            }
        }

        // Convert back to L1PredictResult array
        return Array.from(groupedResults.entries()).map(
            ([loai_uu_tien, ma_xet_tuyen]) => ({
                loai_uu_tien,
                ma_xet_tuyen,
            }),
        );
    }

    public async executeL1PredictionsWithRetry(
        userInputs: UserInputL1[],
        maxChunkSize = 10,
    ): Promise<L1PredictResult[]> {
        const allResults: L1PredictResult[] = [];
        const optimalChunkSize = this.concurrencyUtil.getOptimalChunkSize(
            userInputs.length,
            maxChunkSize,
            {
                processingComplexity: "medium", // Adjust based on your typical workload
                serverConcurrency: this.config.SERVER_BATCH_CONCURRENCY,
            },
        );

        this.logger.debug("L1 Prediction: Input distribution", {
            ...this.summarizeL1Inputs(userInputs),
        });

        const groupedInputs = userInputs.reduce((acc, input) => {
            const majorCode = input.nhom_nganh;
            const group = acc.get(majorCode) ?? [];
            group.push(input);
            acc.set(majorCode, group);
            return acc;
        }, new Map<number, UserInputL1[]>());

        const chunkedGroups: {
            chunk: UserInputL1[];
            chunkIndex: number;
            groupName: string;
        }[] = [];

        for (const [majorGroup, inputs] of groupedInputs.entries()) {
            const chunks = this.concurrencyUtil.chunkArray(
                inputs,
                optimalChunkSize,
            );
            chunks.forEach((chunk, index) => {
                chunkedGroups.push({
                    chunk,
                    chunkIndex: index,
                    groupName: `${majorGroup.toString()}_chunk_${index.toString()}`,
                });
            });
        }

        // Create a concurrency limiter for processing chunks
        const batchLimit = pLimit(this.config.SERVER_BATCH_CONCURRENCY);

        // Process chunks with limited concurrency
        const results = await Promise.allSettled(
            chunkedGroups.map(({ chunk, groupName }, globalIndex) =>
                batchLimit(async () => {
                    return await this._processL1Chunk(
                        groupName,
                        chunk,
                        globalIndex,
                    );
                }),
            ),
        );

        // Collect results
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const { groupName } = chunkedGroups[i];

            if (result.status === "fulfilled") {
                allResults.push(...result.value);
                this.logger.info(
                    `L1 Prediction: Chunk ${groupName} completed successfully`,
                    {
                        resultsCount: result.value.length,
                    },
                );
            } else {
                this.logger.error(
                    `L1 Prediction: Chunk ${groupName} failed completely`,
                    {
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : String(result.reason),
                    },
                );
            }
        }

        this.logger.info("L1 Prediction: All chunks processing completed", {
            failedChunks: results.filter((r) => r.status === "rejected").length,
            successfulChunks: results.filter((r) => r.status === "fulfilled")
                .length,
            totalResults: allResults.length,
        });

        return allResults;
    }

    public generateUserInputL1Combinations(
        studentInfoDTO: StudentInfoDTO,
    ): UserInputL1[] {
        // Create base template without HSG or major fields
        const baseTemplate = this.createBaseUserInputL1Template(studentInfoDTO);

        // Generate award-specific input templates
        const awardInputs = this.generateL1UserInputsForAwards(
            baseTemplate,
            studentInfoDTO.awards,
        );

        // Generate final combinations by pairing each award template with each major code
        const allCombinations: UserInputL1[] = [];

        for (const awardInput of awardInputs) {
            for (const majorName of studentInfoDTO.majors) {
                // 1. Look up the major code from its Vietnamese name
                const majorCode = getCodeByVietnameseName(majorName); // Assumes this helper function exists

                // 2. Check if a code was found
                if (majorCode) {
                    // 3. Create the final input object with the numeric major code
                    allCombinations.push({
                        ...awardInput,
                        nhom_nganh: majorCode,
                    });
                } else {
                    // Optional: Log a warning if a major cannot be mapped
                    this.logger.warn(
                        `L1 Prediction: Cannot find code for major: "${majorName}". Skipping this combination.`,
                    );
                }
            }
        }

        return allCombinations;
    }

    public async getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]> {
        const student = await this.studentRepository.findOne({
            relations: ["awards", "studentMajorGroups.majorGroup"],
            where: {
                id: studentId,
                userId: userId ?? IsNull(),
            },
        });

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with id: ${studentId} not found`,
            );
        }

        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            student,
            { excludeExtraneousValues: true },
        );
        await validate(studentInfoDTO, DEFAULT_VALIDATOR_OPTIONS);

        // Generate ALL user input combinations (awards × majors)
        const userInputs = this.generateUserInputL1Combinations(studentInfoDTO);

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for L1 prediction",
            );
        }

        await validate(userInputs, DEFAULT_VALIDATOR_OPTIONS);

        // Execute L1 predictions
        const results = await this.executeL1PredictionsWithRetry(
            userInputs,
            this.config.SERVICE_L1_CHUNK_SIZE_INPUT_ARRAY,
        );

        const combinedResults = this.combineL1Results(results);

        this.logger.info("L1 Prediction: Results summary", {
            combinedResults: combinedResults.length,
            totalInputs: userInputs.length,
        });

        return combinedResults;
    }

    public async predictMajorsL1(
        userInput: UserInputL1,
    ): Promise<L1PredictResult[]> {
        try {
            this.logger.info("L1 Prediction: Predicting...", {
                userInput,
            });

            const response = await this.httpClient.post<L1PredictResult[]>(
                `/predict/l1`,
                userInput,
            );

            const validatedResults = await this.validateL1PredictResponse(
                response.data,
            );

            if (validatedResults.length === 0) {
                this.logger.info(
                    "L1 Prediction: : No valid L1 Prediction Results found",
                    {
                        majorGroup: userInput.nhom_nganh,
                    },
                );
            } else {
                this.logger.info("L1 Prediction: Completed", {
                    count: validatedResults.length,
                    majorGroup: userInput.nhom_nganh,
                });
            }

            return validatedResults;
        } catch (error) {
            const errorContext = {
                majorGroup: userInput.nhom_nganh,
            };

            if (isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.predictionUtil.isValidationError(
                        axiosError.response?.data,
                    )
                ) {
                    const validationError = axiosError.response.data;
                    const specificErrors = validationError.detail
                        .map((err) => `${err.loc.join(".")} - ${err.msg}`)
                        .join("; ");
                    detailedMessage = `API Validation Error: ${specificErrors}`;
                }

                this.logger.error("L1 Prediction: API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `L1 Prediction: API error (${String(status)}): ${detailedMessage} for major ${userInput.nhom_nganh.toString()}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("L1 Prediction: Service error", {
                message,
                ...errorContext,
            });

            throw new Error(
                `L1 Prediction: Service error: ${message} for major ${userInput.nhom_nganh.toString()}`,
            );
        }
    }

    public async predictMajorsL1Batch(
        userInputs: UserInputL1[],
        dynamicConcurrency?: number, // Optional override
    ): Promise<L1PredictResult[]> {
        try {
            // Calculate dynamic concurrency if not provided
            const batchConcurrency =
                dynamicConcurrency ??
                this.concurrencyUtil.calculateDynamicBatchConcurrency(
                    userInputs.length,
                    this.config.SERVICE_INPUTS_PER_WORKER, // inputs per worker
                    this.config.SERVICE_BATCH_CONCURRENCY, // Use config as max limit
                    this.config.SERVICE_MIN_BATCH_CONCURRENCY, // Min concurrency
                );

            const batchRequest: L1BatchRequest = {
                items: userInputs,
            };

            const response = await this.httpClient.post<L1PredictResult[][]>(
                `/predict/l1/batch?concurrency=${batchConcurrency.toString()}`,
                batchRequest,
            );

            const flattenedResults = response.data.flat();
            const validatedResults =
                await this.validateL1PredictResponse(flattenedResults);

            this.logger.info("L1 Prediction: Batch prediction completed", {
                inputCount: userInputs.length,
                resultCount: validatedResults.length,
                usedConcurrency: batchConcurrency,
            });

            return validatedResults;
        } catch (error) {
            const errorContext = {
                inputCount: userInputs.length,
                usedConcurrency: dynamicConcurrency ?? "calculated",
            };

            if (isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.predictionUtil.isValidationError(
                        axiosError.response?.data,
                    )
                ) {
                    const validationError = axiosError.response.data;
                    const specificErrors = validationError.detail
                        .map((err) => `${err.loc.join(".")} - ${err.msg}`)
                        .join("; ");
                    detailedMessage = `API Validation Error: ${specificErrors}`;
                }

                this.logger.error("L1 Prediction: Batch API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `L1 Prediction: Batch API error (${String(status)}): ${detailedMessage}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("L1 Prediction: Batch service error", {
                message,
                ...errorContext,
            });

            throw new Error(`L1 Prediction: Batch service error: ${message}`);
        }
    }

    private async _performL1BatchPrediction(
        inputsForGroup: UserInputL1[],
        groupName: string,
    ): Promise<{
        failedInputs: UserInputL1[];
        successfulResults: L1PredictResult[];
    }> {
        const successfulResults: L1PredictResult[] = [];
        const failedInputs: UserInputL1[] = [];

        try {
            // Calculate dynamic concurrency for this specific group
            const dynamicConcurrency =
                this.concurrencyUtil.calculateDynamicBatchConcurrency(
                    inputsForGroup.length,
                    this.config.SERVICE_INPUTS_PER_WORKER, // inputs per worker
                    this.config.SERVICE_BATCH_CONCURRENCY, // Max limit from config
                    this.config.SERVICE_MIN_BATCH_CONCURRENCY, // Min concurrency
                );

            // Use dynamic concurrency in the batch call
            const batchResults = await this.predictMajorsL1Batch(
                inputsForGroup,
                dynamicConcurrency,
            );
            successfulResults.push(...batchResults);

            this.logger.info(
                `L1 Prediction: Batch processing for group ${groupName} completed successfully`,
                {
                    resultCount: batchResults.length,
                    successful: inputsForGroup.length,
                    total: inputsForGroup.length,
                    usedConcurrency: dynamicConcurrency,
                },
            );
        } catch (error: unknown) {
            this.logger.warn(
                "L1 Prediction: Batch prediction failed for group, falling back to individual predictions",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    groupName,
                    inputCount: inputsForGroup.length,
                },
            );

            await new Promise((resolve) =>
                setTimeout(resolve, this.config.SERVICE_RETRY_BASE_DELAY_MS),
            );

            const limit = pLimit(this.config.SERVICE_PREDICTION_CONCURRENCY);
            const batchResults = await Promise.allSettled(
                inputsForGroup.map((userInput, index) =>
                    limit(async () => {
                        try {
                            if (index > 0) {
                                await new Promise((resolve) =>
                                    setTimeout(
                                        resolve,
                                        this.config.SERVICE_REQUEST_DELAY_MS,
                                    ),
                                );
                            }
                            return await this.predictMajorsL1(userInput);
                        } catch (error: unknown) {
                            this.logger.warn(
                                "L1 Prediction: Individual prediction failed, will retry sequentially",
                                {
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                    groupName,
                                    inputIndex: index,
                                },
                            );
                            throw error;
                        }
                    }),
                ),
            );

            for (let i = 0; i < batchResults.length; i++) {
                const result = batchResults[i];
                if (result.status === "fulfilled") {
                    successfulResults.push(...result.value);
                } else {
                    failedInputs.push(inputsForGroup[i]);
                }
            }

            this.logger.info(
                `L1 Prediction: Fallback processing for group ${groupName} completed`,
                {
                    failed: failedInputs.length,
                    successful: successfulResults.length,
                    total: inputsForGroup.length,
                },
            );
        }

        return { failedInputs, successfulResults };
    }

    private async _performL1SequentialRetry(
        failedInputs: UserInputL1[],
        subjectGroup: string,
    ): Promise<L1PredictResult[]> {
        const successfulRetryResults: L1PredictResult[] = [];
        let retrySuccessCount = 0;

        for (let i = 0; i < failedInputs.length; i++) {
            const userInput = failedInputs[i];
            let success = false;

            for (
                let attempt = 1;
                attempt <= this.config.SERVICE_MAX_RETRIES && !success;
                attempt++
            ) {
                try {
                    this.logger.info(
                        `L1 Prediction: Sequential retry attempt ${attempt.toString()} for input ${String(i + 1)}/${failedInputs.length.toString()} in group ${subjectGroup}`,
                    );
                    const results = await this.predictMajorsL1(userInput);
                    successfulRetryResults.push(...results);
                    success = true;
                    retrySuccessCount++;
                    this.logger.info(
                        `L1 Prediction: Sequential retry successful for group ${subjectGroup}`,
                    );
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    if (attempt === this.config.SERVICE_MAX_RETRIES) {
                        this.logger.error(
                            "L1 Prediction: Sequential retry failed after all attempts for group",
                            {
                                error: errorMessage,
                                subjectGroup,
                            },
                        );
                    } else {
                        this.logger.warn(
                            `L1 Prediction: Sequential retry attempt ${attempt.toString()} failed for group, will retry`,
                            {
                                error: errorMessage,
                                subjectGroup,
                            },
                        );
                        await new Promise((resolve) =>
                            setTimeout(
                                resolve,
                                this.config.SERVICE_RETRY_BASE_DELAY_MS *
                                    attempt,
                            ),
                        );
                    }
                }
            }
            if (i < failedInputs.length - 1) {
                await new Promise((resolve) =>
                    setTimeout(
                        resolve,
                        this.config.SERVICE_RETRY_ITERATION_DELAY_MS,
                    ),
                );
            }
        }

        this.logger.info(
            `L1 Prediction: Sequential retry for group ${subjectGroup} completed`,
            {
                finallySuccessful: retrySuccessCount,
                stillFailed: failedInputs.length - retrySuccessCount,
                totalAttempted: failedInputs.length,
            },
        );

        return successfulRetryResults;
    }

    private async _processL1Chunk(
        subjectGroup: string,
        inputsForGroup: UserInputL1[],
        groupIndex = 0, // Add index parameter
    ): Promise<L1PredictResult[]> {
        const startTime = Date.now();

        // Add small delay between subject groups to avoid overwhelming the server
        if (groupIndex > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.config.SERVICE_L1_CHUNK_DELAY_MS),
            );
        }

        const { failedInputs, successfulResults } =
            await this._performL1BatchPrediction(inputsForGroup, subjectGroup);

        let retryResults: L1PredictResult[] = [];
        if (failedInputs.length > 0) {
            retryResults = await this._performL1SequentialRetry(
                failedInputs,
                subjectGroup,
            );
        }

        const duration = Date.now() - startTime;
        const totalResults = successfulResults.length + retryResults.length;

        this.logger.info(
            `L1 Prediction: Subject group ${subjectGroup} completed`,
            {
                duration: `${duration.toString()}ms`,
                failedInputs: failedInputs.length,
                SERVICE_PREDICTION_CONCURRENCY:
                    this.config.SERVICE_PREDICTION_CONCURRENCY,
                throughput: `${(totalResults / (duration / 1000)).toFixed(2)} predictions/sec`,
                totalResults,
            },
        );

        return [...successfulResults, ...retryResults];
    }

    private createBaseUserInputL1Template(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<UserInputL1, "nhom_nganh"> {
        // Map awards to HSG subjects
        const { hsg_1, hsg_2, hsg_3 } = this.mapAwardsToHsgSubjects(
            studentInfoDTO.awards,
        );

        // Map special cases to binary flags
        const { ahld, dan_toc_thieu_so, haimuoi_huyen_ngheo_tnb } =
            this.mapSpecialCasesToBinaryFlags(
                studentInfoDTO.specialStudentCases,
            );

        return {
            ahld,
            cong_lap: this.mapUniTypeToBinaryFlag(studentInfoDTO.uniType),
            dan_toc_thieu_so,
            haimuoi_huyen_ngheo_tnb,
            hoc_phi: studentInfoDTO.maxBudget,
            hsg_1,
            hsg_2,
            hsg_3,
            tinh_tp: studentInfoDTO.province,
        };
    }

    private generateL1UserInputsForAwards(
        baseTemplate: Omit<
            UserInputL1,
            "hsg_1" | "hsg_2" | "hsg_3" | "nhom_nganh"
        >,
        awards?: AwardDTO[],
    ): Omit<UserInputL1, "nhom_nganh">[] {
        const userInputs: Omit<UserInputL1, "nhom_nganh">[] = [];

        if (!awards || awards.length === 0) {
            // No awards - create one input with all HSG fields as 0
            userInputs.push({
                ...baseTemplate,
                hsg_1: 0,
                hsg_2: 0,
                hsg_3: 0,
            });
            return userInputs;
        }

        // Group awards by rank
        const awardsByRank = this.groupAwardsByRank(awards);

        // Generate inputs for First rank awards (each gets its own input with hsg_1)
        const firstRankAwards = awardsByRank[Rank.FIRST];
        for (const award of firstRankAwards) {
            userInputs.push({
                ...baseTemplate,
                hsg_1: this.mapNationalExcellentStudentSubjectToHsgSubject(
                    award.category,
                ),
                hsg_2: 0,
                hsg_3: 0,
            });
        }

        // Generate inputs for Second rank awards (each gets its own input with hsg_2)
        const secondRankAwards = awardsByRank[Rank.SECOND];
        for (const award of secondRankAwards) {
            userInputs.push({
                ...baseTemplate,
                hsg_1: 0,
                hsg_2: this.mapNationalExcellentStudentSubjectToHsgSubject(
                    award.category,
                ),
                hsg_3: 0,
            });
        }

        // Generate inputs for Third rank awards (each gets its own input with hsg_3)
        const thirdRankAwards = awardsByRank[Rank.THIRD];
        for (const award of thirdRankAwards) {
            userInputs.push({
                ...baseTemplate,
                hsg_1: 0,
                hsg_2: 0,
                hsg_3: this.mapNationalExcellentStudentSubjectToHsgSubject(
                    award.category,
                ),
            });
        }

        // If no awards were processed, add a default input with all 0s
        if (userInputs.length === 0) {
            userInputs.push({
                ...baseTemplate,
                hsg_1: 0,
                hsg_2: 0,
                hsg_3: 0,
            });
        }

        return userInputs;
    }

    private groupAwardsByRank(awards: AwardDTO[]): Record<Rank, AwardDTO[]> {
        const initialGroup: Record<Rank, AwardDTO[]> = {
            [Rank.FIRST]: [],
            [Rank.SECOND]: [],
            [Rank.THIRD]: [],
        };

        return awards.reduce((acc, award) => {
            // This will throw an error if award.level is ever null or undefined.
            acc[award.level].push(award);
            return acc;
        }, initialGroup);
    }

    private mapAwardsToHsgSubjects(awards?: AwardDTO[]): {
        hsg_1: 0 | HsgSubject;
        hsg_2: 0 | HsgSubject;
        hsg_3: 0 | HsgSubject;
    } {
        // This method is now primarily for single award scenarios
        // For multiple awards, use generateUserInputsForAwards instead

        if (!awards || awards.length === 0) {
            return { hsg_1: 0, hsg_2: 0, hsg_3: 0 };
        }

        const result: {
            hsg_1: 0 | HsgSubject;
            hsg_2: 0 | HsgSubject;
            hsg_3: 0 | HsgSubject;
        } = { hsg_1: 0, hsg_2: 0, hsg_3: 0 };

        // Find first occurrence of each rank
        const firstRankAward = awards.find(
            (award) => award.level === Rank.FIRST,
        );
        const secondRankAward = awards.find(
            (award) => award.level === Rank.SECOND,
        );
        const thirdRankAward = awards.find(
            (award) => award.level === Rank.THIRD,
        );

        if (firstRankAward) {
            result.hsg_1 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                firstRankAward.category,
            );
        }

        if (secondRankAward) {
            result.hsg_2 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                secondRankAward.category,
            );
        }

        if (thirdRankAward) {
            result.hsg_3 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                thirdRankAward.category,
            );
        }

        return result;
    }

    private mapNationalExcellentStudentSubjectToHsgSubject(
        subject: NationalExcellentStudentExamSubject,
    ): HsgSubject {
        const mapping: Record<NationalExcellentStudentExamSubject, HsgSubject> =
            {
                [NationalExcellentStudentExamSubject.BIOLOGY]: HsgSubject.SINH,
                [NationalExcellentStudentExamSubject.CHEMISTRY]: HsgSubject.HOA,
                [NationalExcellentStudentExamSubject.CHINESE]:
                    HsgSubject.TIENG_TRUNG,
                [NationalExcellentStudentExamSubject.ENGLISH]: HsgSubject.ANH,
                [NationalExcellentStudentExamSubject.FRENCH]:
                    HsgSubject.TIENG_PHAP,
                [NationalExcellentStudentExamSubject.GEOGRAPHY]: HsgSubject.DIA,
                [NationalExcellentStudentExamSubject.HISTORY]: HsgSubject.SU,
                [NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY]:
                    HsgSubject.TIN,
                [NationalExcellentStudentExamSubject.JAPANESE]:
                    HsgSubject.TIENG_NHAT,
                [NationalExcellentStudentExamSubject.LITERATURE]:
                    HsgSubject.VAN,
                [NationalExcellentStudentExamSubject.MATHEMATICS]:
                    HsgSubject.TOAN,
                [NationalExcellentStudentExamSubject.PHYSICS]: HsgSubject.LY,
                [NationalExcellentStudentExamSubject.RUSSIAN]:
                    HsgSubject.TIENG_NGA,
            } as const;

        return mapping[subject];
    }

    private mapSpecialCasesToBinaryFlags(specialCases?: SpecialStudentCase[]): {
        ahld: number;
        dan_toc_thieu_so: number;
        haimuoi_huyen_ngheo_tnb: number;
    } {
        if (!specialCases || specialCases.length === 0) {
            return {
                ahld: 0,
                dan_toc_thieu_so: 0,
                haimuoi_huyen_ngheo_tnb: 0,
            };
        }

        const flags = {
            ahld: 0,
            dan_toc_thieu_so: 0,
            haimuoi_huyen_ngheo_tnb: 0,
        };

        for (const specialCase of specialCases) {
            switch (specialCase) {
                case SpecialStudentCase.ETHNIC_MINORITY_STUDENT:
                    flags.haimuoi_huyen_ngheo_tnb = 1;
                    break;
                case SpecialStudentCase.HEROES_AND_CONTRIBUTORS:
                    flags.ahld = 1;
                    break;
                case SpecialStudentCase.VERY_FEW_ETHNIC_MINORITY:
                    flags.dan_toc_thieu_so = 1;
                    break;
                // Note: TRANSFER_STUDENT doesn't map to any of these flags
                default:
                    break;
            }
        }

        return flags;
    }

    private mapUniTypeToBinaryFlag(uniType: UniType): number {
        switch (uniType) {
            case UniType.PRIVATE:
                return 0;
            case UniType.PUBLIC:
                return 1;
        }
    }

    private summarizeL1Inputs(userInputs: UserInputL1[]): object {
        return {
            awardDistribution: {
                hsg_1: userInputs.filter((input) => input.hsg_1 !== 0).length,
                hsg_2: userInputs.filter((input) => input.hsg_2 !== 0).length,
                hsg_3: userInputs.filter((input) => input.hsg_3 !== 0).length,
                noAwards: userInputs.filter(
                    (input) =>
                        input.hsg_1 === 0 &&
                        input.hsg_2 === 0 &&
                        input.hsg_3 === 0,
                ).length,
            },
            majorGroups: [
                ...new Set(userInputs.map((input) => input.nhom_nganh)),
            ],
            totalInputs: userInputs.length,
            uniqueProfiles: new Set(
                userInputs.map((input) =>
                    JSON.stringify({
                        ahld: input.ahld,
                        dan_toc_thieu_so: input.dan_toc_thieu_so,
                        haimuoi_huyen_ngheo_tnb: input.haimuoi_huyen_ngheo_tnb,
                    }),
                ),
            ).size,
        };
    }

    private async validateL1PredictResponse(
        data: unknown,
    ): Promise<L1PredictResult[]> {
        if (!Array.isArray(data)) {
            throw new Error("L1 Prediction: Invalid L1 response format");
        }

        // Handle empty array case
        if (data.length === 0) {
            this.logger.info(
                "L1 Prediction: No L1 predictions found for this input",
            );
            return [];
        }

        const results: L1PredictResult[] = [];

        for (const item of data) {
            const instance = plainToInstance(L1PredictResult, item);
            const errors = await validate(instance);

            if (errors.length === 0) {
                results.push(instance);
            } else {
                this.logger.warn(
                    "L1 Prediction: Invalid L1 Prediction Result received",
                    {
                        errors: errors.map((err) => ({
                            constraints: err.constraints,
                            property: err.property,
                        })),
                        item: item as unknown,
                    },
                );
            }
        }

        return results;
    }
}
