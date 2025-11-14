import { AxiosError, AxiosInstance, isAxiosError } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionModelServiceConfig } from "@/config/prediction-model.config.js";
import { DEFAULT_VALIDATOR_OPTIONS } from "@/config/validator.config.js";
import {
    L2BatchRequest,
    UserInputL2,
} from "@/dto/prediction/l2-request.dto.js";
import { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import { AcademicPerformanceDTO } from "@/dto/student/academic-performance-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { ConductDTO } from "@/dto/student/conduct-dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import {
    AcademicPerformance,
    getRankByAcademicPerformance,
} from "@/type/enum/academic-performance.js";
import { Conduct, getRankByConduct } from "@/type/enum/conduct.js";
import { ExamType } from "@/type/enum/exam-type.js";
import { getCodeByVietnameseName, MajorGroup } from "@/type/enum/major.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";

import { IPredictionL2Service } from "../prediction-l2-service.interface.js";

@injectable()
export class PredictionL2Service implements IPredictionL2Service {
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

    public deduplicateByHighestScore(
        results: L2PredictResult[],
    ): L2PredictResult[] {
        const resultMap = new Map<string, L2PredictResult>();

        for (const result of results) {
            const existing = resultMap.get(result.ma_xet_tuyen);

            if (!existing || result.score > existing.score) {
                resultMap.set(result.ma_xet_tuyen, result);
            }
        }

        return Array.from(resultMap.values());
    }

    public async executeL2PredictionsWithRetry(
        userInputs: UserInputL2[],
        maxChunkSize = 10, // Configurable chunk size
    ): Promise<L2PredictResult[]> {
        const allResults: L2PredictResult[] = [];
        const optimalChunkSize = this.concurrencyUtil.getOptimalChunkSize(
            userInputs.length,
            maxChunkSize,
            {
                processingComplexity: "medium", // Adjust based on your typical workload
                serverConcurrency: this.config.SERVER_BATCH_CONCURRENCY,
            },
        );

        this.logger.info("L2 Prediction: Calculated optimal chunk size", {
            optimalChunkSize,
            totalInputs: userInputs.length,
        });

        this.logger.debug("L2 Prediction: Input summary details", {
            ...this.summarizeL2Inputs(userInputs),
        });

        // Group inputs by subject group first
        const groupedInputs = userInputs.reduce((acc, input) => {
            const group = acc.get(input.to_hop_mon) ?? [];
            group.push(input);
            acc.set(input.to_hop_mon, group);
            return acc;
        }, new Map<string, UserInputL2[]>());

        // Now chunk each subject group
        const chunkedGroups: {
            chunk: UserInputL2[];
            chunkIndex: number;
            subjectGroup: string;
        }[] = [];

        for (const [subjectGroup, inputs] of groupedInputs.entries()) {
            const chunks = this.concurrencyUtil.chunkArray(
                inputs,
                optimalChunkSize,
            );
            chunks.forEach((chunk, index) => {
                chunkedGroups.push({
                    chunk,
                    chunkIndex: index,
                    subjectGroup: `${subjectGroup}_chunk_${index.toString()}`,
                });
            });
        }

        // Create concurrency limiter for chunks
        const batchLimit = pLimit(this.config.SERVER_BATCH_CONCURRENCY);

        this.logger.info(
            "L2 Prediction: Starting concurrent processing with chunking",
            {
                optimalChunkSize,
                originalInputCount: userInputs.length,
                totalChunks: chunkedGroups.length,
                totalSubjectGroups: groupedInputs.size,
            },
        );

        // Process chunks with limited concurrency
        const results = await Promise.allSettled(
            chunkedGroups.map(({ chunk, subjectGroup }, globalIndex) =>
                batchLimit(async () => {
                    return await this._processSubjectGroup(
                        subjectGroup,
                        chunk,
                        globalIndex,
                    );
                }),
            ),
        );

        // Collect results
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const { subjectGroup } = chunkedGroups[i];

            if (result.status === "fulfilled") {
                allResults.push(...result.value);
                this.logger.info(
                    `L2 Prediction: Chunk ${subjectGroup} completed successfully`,
                    {
                        resultsCount: result.value.length,
                    },
                );
            } else {
                this.logger.error(
                    `L2 Prediction: Chunk ${subjectGroup} failed completely`,
                    {
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : String(result.reason),
                    },
                );
            }
        }

        this.logger.info("L2 Prediction: All chunks processing completed", {
            failedChunks: results.filter((r) => r.status === "rejected").length,
            successfulChunks: results.filter((r) => r.status === "fulfilled")
                .length,
            totalResults: allResults.length,
        });

        return allResults;
    }

    public generateL2UserInputCombinations(
        studentInfoDTO: StudentInfoDTO,
    ): UserInputL2[] {
        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");

        // Create base template for user inputs
        const baseTemplate = this.createBaseL2UserInputTemplate(studentInfoDTO);

        // Collect all possible exam scenarios
        const examScenarios =
            this.predictionUtil.collectExamScenarios(studentInfoDTO);

        this.logger.info("L2 Prediction: Generated exam scenarios", {
            ccqtScenarios: examScenarios.filter((s) => s.type === "ccqt")
                .length,
            dgnlScenarios: examScenarios.filter((s) => s.type === "dgnl")
                .length,
            nationalScenarios: examScenarios.filter(
                (s) => s.type === "national",
            ).length,
            talentScenarios: examScenarios.filter((s) => s.type === "talent")
                .length,
            totalScenarios: examScenarios.length,
            vsatScenarios: examScenarios.filter((s) => s.type === "vsat")
                .length,
        });

        const majors: MajorGroup[] = studentInfoDTO.majors;

        // If no CCNN certifications, generate combinations with default values
        if (ccnnCertifications.length === 0) {
            this.logger.info(
                "L2 Prediction: No CCNN certifications found, using default values",
                {
                    examScenariosCount: examScenarios.length,
                    majorsCount: majors.length,
                },
            );

            const combinations: UserInputL2[] = examScenarios.flatMap(
                (scenario) =>
                    majors
                        .map((major) => {
                            const majorCode = getCodeByVietnameseName(major);
                            if (!majorCode) {
                                this.logger.warn(
                                    `L2 Prediction: Cannot find code for major: ${major}`,
                                );
                                return null;
                            }
                            return {
                                ...baseTemplate,
                                diem_ccta: "0", // Default value when no certification
                                diem_chuan: scenario.diem_chuan,
                                nhom_nganh: majorCode,
                                ten_ccta: "0", // 0 indicates no certification
                                to_hop_mon: scenario.to_hop_mon,
                            } as UserInputL2;
                        })
                        .filter(
                            (input): input is UserInputL2 => input !== null,
                        ),
            );

            this.logger.info(
                "L2 Prediction: Generated combinations without CCNN certifications",
                {
                    generatedCombinations: combinations.length,
                },
            );

            return combinations;
        }

        // Create a map to group certifications by their handling type
        const certificationMap = new Map<string, CertificationDTO[]>();

        ccnnCertifications.forEach((cert) => {
            if (cert.examType === ExamType.JLPT && cert.level) {
                // Group JLPT certifications
                if (!certificationMap.has("JLPT")) {
                    certificationMap.set("JLPT", []);
                }
                certificationMap.get("JLPT")?.push(cert);
            } else if (cert.cefr) {
                // Group CEFR-compatible certifications
                if (!certificationMap.has("CEFR")) {
                    certificationMap.set("CEFR", []);
                }
                certificationMap.get("CEFR")?.push(cert);
            }
        });

        // Configuration for different certification types
        const certTypeConfig = new Map([
            ["CEFR", { certName: "CEFR", scoreField: "cefr" as const }],
            ["JLPT", { certName: "JLPT", scoreField: "level" as const }],
        ]);

        const combinations: UserInputL2[] = [];

        // Generate combinations for each certification type
        certificationMap.forEach((certs, certType) => {
            const config = certTypeConfig.get(certType);
            if (!config) return;

            const typeCombinations = examScenarios.flatMap((scenario) =>
                certs.flatMap((cert) =>
                    majors
                        .map((major) => {
                            const majorCode = getCodeByVietnameseName(major);
                            if (!majorCode) {
                                this.logger.warn(
                                    `L2 Prediction: Cannot find code for major: ${major}`,
                                );
                                return null;
                            }
                            return {
                                ...baseTemplate,
                                diem_ccta: cert[config.scoreField], // Dynamic field access
                                diem_chuan: scenario.diem_chuan,
                                nhom_nganh: majorCode,
                                ten_ccta: config.certName,
                                to_hop_mon: scenario.to_hop_mon,
                            } as UserInputL2;
                        })
                        .filter(
                            (input): input is UserInputL2 => input !== null,
                        ),
                ),
            );

            combinations.push(...typeCombinations);
        });

        this.logger.info(
            "L2 Prediction: Generated combinations with CCNN certifications",
            {
                certificationTypes: Array.from(certificationMap.keys()),
                generatedCombinations: combinations.length,
            },
        );

        return combinations;
    }

    public async getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]> {
        // Data retrieval and validation
        const student = await this.studentRepository.findOne({
            relations: [
                "academicPerformances",
                "aptitudeExams",
                "awards",
                "certifications",
                "conducts",
                "studentMajorGroups.majorGroup",
                "nationalExams",
                "talentExams",
                "vsatExams",
            ],
            where: {
                id: studentId,
                userId: userId ?? IsNull(), // Handle both authenticated and anonymous
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

        // Generate user inputs for all combinations
        const userInputs = this.generateL2UserInputCombinations(studentInfoDTO);

        // Sort the userInputs array alphabetically by subject group to ensure consistent processing order
        userInputs.sort((a, b) => a.to_hop_mon.localeCompare(b.to_hop_mon));

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for prediction",
            );
        }

        await validate(userInputs, DEFAULT_VALIDATOR_OPTIONS);

        // Execute predictions with improved error handling and retry logic
        const results = await this.executeL2PredictionsWithRetry(
            userInputs,
            this.config.SERVICE_L2_CHUNK_SIZE_INPUT_ARRAY,
        );

        // Deduplicate by ma_xet_tuyen, keeping the highest score
        const deduplicatedResults = this.deduplicateByHighestScore(results);

        this.logger.info("L2 Prediction: Results summary", {
            duplicatesRemoved: results.length - deduplicatedResults.length,
            totalResults: results.length,
            uniqueResults: deduplicatedResults.length,
        });

        return deduplicatedResults;
    }

    public async predictL2MajorsBatch(
        userInputs: UserInputL2[],
        dynamicConcurrency?: number, // Optional override
    ): Promise<L2PredictResult[]> {
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

            this.logger.info("L2 Prediction: Starting batch prediction", {
                calculatedConcurrency: batchConcurrency,
                configuredMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                inputCount: userInputs.length,
            });

            const batchRequest: L2BatchRequest = {
                items: userInputs,
            };

            const response = await this.httpClient.post<L2PredictResult[][]>(
                `/predict/l2/batch?concurrency=${batchConcurrency.toString()}`,
                batchRequest,
            );

            const flattenedResults = response.data.flat();
            const validatedResults =
                await this.validateL2PredictResponse(flattenedResults);

            this.logger.info("L2 Prediction: Batch prediction completed", {
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

                this.logger.error("L2 Prediction: Batch API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `L2 Prediction: Batch API error (${String(status)}): ${detailedMessage}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("L2 Prediction: Batch service error", {
                message,
                ...errorContext,
            });

            throw new Error(`L2 Prediction: Batch service error: ${message}`);
        }
    }

    public async predictMajorsByStudentIdAndUserId(
        userInput: UserInputL2,
        studentId: string,
        userId: string,
    ): Promise<L2PredictResult[]> {
        this.logger.info("Performing prediction majors for student ", {
            studentId: studentId,
            userId: userId,
        });
        return await this.predictMajorsL2(userInput);
    }

    public async predictMajorsL2(
        userInput: UserInputL2,
    ): Promise<L2PredictResult[]> {
        try {
            this.logger.info("L2 Prediction: Predicting", {
                userInput,
            });

            const response = await this.httpClient.post<L2PredictResult[]>(
                `/predict/l2`,
                userInput,
            );

            const validatedResults = await this.validateL2PredictResponse(
                response.data,
            );

            if (validatedResults.length === 0) {
                this.logger.info("L2 Prediction: No valid predictions found", {
                    major: userInput.nhom_nganh,
                    subjectGroup: userInput.to_hop_mon,
                });
            } else {
                this.logger.info("L2 Prediction: Prediction completed", {
                    count: validatedResults.length,
                    major: userInput.nhom_nganh,
                    subjectGroup: userInput.to_hop_mon,
                });
            }

            return validatedResults;
        } catch (error) {
            const errorContext = {
                examScore: userInput.diem_chuan,
                major: userInput.nhom_nganh,
                subjectGroup: userInput.to_hop_mon,
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

                this.logger.error("L2 Prediction: API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `L2 Prediction: API error (${String(status)}): ${detailedMessage} for ${userInput.to_hop_mon}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("L2 Prediction: Service error", {
                message,
                ...errorContext,
            });

            throw new Error(
                `L2 Prediction: Service error: ${message} for ${userInput.to_hop_mon}`,
            );
        }
    }

    private async _performL2BatchPrediction(
        inputsForGroup: UserInputL2[],
        subjectGroup: string,
    ): Promise<{
        failedInputs: UserInputL2[];
        successfulResults: L2PredictResult[];
    }> {
        const successfulResults: L2PredictResult[] = [];
        const failedInputs: UserInputL2[] = [];

        try {
            // Calculate dynamic concurrency for this specific group
            const dynamicConcurrency =
                this.concurrencyUtil.calculateDynamicBatchConcurrency(
                    inputsForGroup.length,
                    this.config.SERVICE_INPUTS_PER_WORKER, // inputs per worker
                    this.config.SERVICE_BATCH_CONCURRENCY, // Max limit from config
                    this.config.SERVICE_MIN_BATCH_CONCURRENCY, // Min concurrency
                );

            this.logger.info(
                `L2 Prediction: Attempting batch prediction for group ${subjectGroup}`,
                {
                    calculatedConcurrency: dynamicConcurrency,
                    configMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                    inputCount: inputsForGroup.length,
                },
            );

            // Use dynamic concurrency in the batch call
            const batchResults = await this.predictL2MajorsBatch(
                inputsForGroup,
                dynamicConcurrency,
            );
            successfulResults.push(...batchResults);

            this.logger.info(
                `L2 Prediction: Batch processing for group ${subjectGroup} completed successfully`,
                {
                    resultCount: batchResults.length,
                    successful: inputsForGroup.length,
                    total: inputsForGroup.length,
                    usedConcurrency: dynamicConcurrency,
                },
            );
        } catch (error: unknown) {
            this.logger.warn(
                "L2 Prediction: Batch prediction failed for group, falling back to individual predictions",
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    inputCount: inputsForGroup.length,
                    subjectGroup,
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
                            return await this.predictMajorsL2(userInput);
                        } catch (error: unknown) {
                            this.logger.warn(
                                "L2 Prediction: Individual prediction failed, will retry sequentially",
                                {
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                    inputIndex: index,
                                    subjectGroup,
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
                `L2 Prediction: Fallback processing for group ${subjectGroup} completed`,
                {
                    failed: failedInputs.length,
                    successful: successfulResults.length,
                    total: inputsForGroup.length,
                },
            );
        }

        return { failedInputs, successfulResults };
    }

    private async _performL2SequentialRetry(
        failedInputs: UserInputL2[],
        subjectGroup: string,
    ): Promise<L2PredictResult[]> {
        this.logger.info(
            `L2 Prediction: Starting sequential retry for failed predictions in group: ${subjectGroup}`,
            {
                failedCount: failedInputs.length,
            },
        );

        const successfulRetryResults: L2PredictResult[] = [];
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
                        `L2 Prediction: Sequential retry attempt ${attempt.toString()} for input ${String(i + 1)}/${failedInputs.length.toString()} in group ${subjectGroup}`,
                    );
                    const results = await this.predictMajorsL2(userInput);
                    successfulRetryResults.push(...results);
                    success = true;
                    retrySuccessCount++;
                    this.logger.info(
                        `L2 Prediction: Sequential retry successful for group ${subjectGroup}`,
                    );
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    if (attempt === this.config.SERVICE_MAX_RETRIES) {
                        this.logger.error(
                            "L2 Prediction: Sequential retry failed after all attempts for group",
                            {
                                error: errorMessage,
                                subjectGroup,
                            },
                        );
                    } else {
                        this.logger.warn(
                            `L2 Prediction: Sequential retry attempt ${attempt.toString()} failed for group, will retry`,
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
            `L2 Prediction: Sequential retry for group ${subjectGroup} completed`,
            {
                finallySuccessful: retrySuccessCount,
                stillFailed: failedInputs.length - retrySuccessCount,
                totalAttempted: failedInputs.length,
            },
        );

        return successfulRetryResults;
    }

    private async _processSubjectGroup(
        subjectGroup: string,
        inputsForGroup: UserInputL2[],
        groupIndex = 0, // Add index parameter
    ): Promise<L2PredictResult[]> {
        const startTime = Date.now();

        // Add small delay between subject groups to avoid overwhelming the server
        if (groupIndex > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.config.SERVICE_L2_CHUNK_DELAY_MS),
            ); // delay between groups
        }

        this.logger.info(
            `L2 Prediction: Starting batch processing for subject group: ${subjectGroup} (${(groupIndex + 1).toString()})`,
            {
                SERVICE_BATCH_CONCURRENCY:
                    this.config.SERVICE_PREDICTION_CONCURRENCY,
                SERVICE_PREDICTION_CONCURRENCY:
                    this.config.SERVICE_PREDICTION_CONCURRENCY,
                timestamp: new Date().toISOString(),
                totalInputs: inputsForGroup.length,
            },
        );

        const { failedInputs, successfulResults } =
            await this._performL2BatchPrediction(inputsForGroup, subjectGroup);

        let retryResults: L2PredictResult[] = [];
        if (failedInputs.length > 0) {
            retryResults = await this._performL2SequentialRetry(
                failedInputs,
                subjectGroup,
            );
        }

        const duration = Date.now() - startTime;
        const totalResults = successfulResults.length + retryResults.length;

        this.logger.info(
            `L2 Prediction: Subject group ${subjectGroup} completed`,
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

    private createBaseL2UserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL2,
        "diem_ccta" | "diem_chuan" | "nhom_nganh" | "ten_ccta" | "to_hop_mon"
    > {
        return {
            cong_lap: this.predictionUtil.mapUniTypeToBinaryFlag(
                studentInfoDTO.uniType,
            ),
            hk10: getRankByConduct(
                this.findAndValidateConduct(studentInfoDTO.conducts, 10),
            ),
            hk11: getRankByConduct(
                this.findAndValidateConduct(studentInfoDTO.conducts, 11),
            ),
            hk12: getRankByConduct(
                this.findAndValidateConduct(studentInfoDTO.conducts, 12),
            ),
            hl10: getRankByAcademicPerformance(
                this.findAndValidatePerformance(
                    studentInfoDTO.academicPerformances,
                    10,
                ),
            ),
            hl11: getRankByAcademicPerformance(
                this.findAndValidatePerformance(
                    studentInfoDTO.academicPerformances,
                    11,
                ),
            ),
            hl12: getRankByAcademicPerformance(
                this.findAndValidatePerformance(
                    studentInfoDTO.academicPerformances,
                    12,
                ),
            ),
            hoc_phi: studentInfoDTO.maxBudget,
            tinh_tp: studentInfoDTO.province,
        };
    }

    private findAndValidateConduct(
        conducts: ConductDTO[],
        grade: number,
    ): Conduct {
        const conduct = conducts.find((c) => c.grade === grade)?.conduct;
        if (!conduct) {
            throw new IllegalArgumentException(
                `Academic performance for grade ${grade.toString()} is missing.`,
            );
        }
        return conduct;
    }

    private findAndValidatePerformance(
        performances: AcademicPerformanceDTO[],
        grade: number,
    ): AcademicPerformance {
        const performance = performances.find(
            (ap) => ap.grade === grade,
        )?.academicPerformance;
        if (!performance) {
            throw new IllegalArgumentException(
                `Academic performance for grade ${grade.toString()} is missing.`,
            );
        }
        return performance;
    }

    private summarizeL2Inputs(userInputs: UserInputL2[]): {
        byCertificationType: Record<string, number>;
        bySubjectGroup: Record<string, number>;
        majorGroups: number[];
        scoreRange: null | {
            max: number;
            min: number;
        };
        totalInputs: number;
    } {
        if (userInputs.length === 0) {
            return {
                byCertificationType: {},
                bySubjectGroup: {},
                majorGroups: [],
                scoreRange: null,
                totalInputs: 0,
            };
        }

        // Type-safe accumulator for certification types
        const byCertificationType: Record<string, number> = {};
        for (const input of userInputs) {
            const key = input.ten_ccta;
            if (key) {
                // Guard against undefined/null keys
                const currentCount = byCertificationType[key] as
                    | number
                    | undefined;
                byCertificationType[key] = (currentCount ?? 0) + 1;
            }
        }

        // Type-safe accumulator for subject groups
        const bySubjectGroup: Record<string, number> = {};
        for (const input of userInputs) {
            const key = input.to_hop_mon;
            if (key) {
                // Guard against undefined/null keys
                const currentCount = bySubjectGroup[key] as number | undefined;
                bySubjectGroup[key] = (currentCount ?? 0) + 1;
            }
        }

        // Calculate score range with proper number conversion
        const scores = userInputs
            .map((input) => {
                return typeof input.diem_chuan === "number"
                    ? input.diem_chuan
                    : parseFloat(String(input.diem_chuan));
            })
            .filter((score) => !isNaN(score)); // Filter out any NaN values

        const scoreRange =
            scores.length > 0
                ? {
                      max: Math.max(...scores),
                      min: Math.min(...scores),
                  }
                : null;

        return {
            byCertificationType,
            bySubjectGroup,
            majorGroups: [
                ...new Set(userInputs.map((input) => input.nhom_nganh)),
            ],
            scoreRange,
            totalInputs: userInputs.length,
        };
    }

    private async validateL2PredictResponse(
        data: unknown,
    ): Promise<L2PredictResult[]> {
        if (!Array.isArray(data)) {
            throw new Error("L2 Prediction: Invalid response format");
        }

        // Handle empty array case - this is valid when no predictions are found
        if (data.length === 0) {
            this.logger.info(
                "L2 Prediction: No predictions found for this input",
            );
            return [];
        }

        const results: L2PredictResult[] = [];

        for (const item of data) {
            const instance = plainToInstance(L2PredictResult, item);
            const errors = await validate(instance);

            if (errors.length === 0) {
                results.push(instance);
            } else {
                // Log validation errors for debugging
                this.logger.warn(
                    "L2 Prediction: Invalid Prediction Result received",
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

        // Return results even if empty after validation
        // This allows the calling code to handle empty results appropriately
        return results;
    }
}
