import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { Repository } from "typeorm";

import {
    HsgSubject,
    HTTPValidationError,
    L1BatchRequest,
    L1PredictResult,
    L2BatchRequest,
    L2PredictResult,
    UserInputL1,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { AcademicPerformanceDTO } from "@/dto/student/academic.performance.dto.js";
import { AwardDTO } from "@/dto/student/award.dto.js";
import { CertificationDTO } from "@/dto/student/certification.dto.js";
import { ConductDTO } from "@/dto/student/conduct.dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { OcrResultEntity, OcrStatus } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { StudentService } from "@/service/student.service.js";
import { TYPES } from "@/type/container/types.js";
import {
    AcademicPerformance,
    getRankByAcademicPerformance,
} from "@/type/enum/academic.performance.js";
import { Conduct, getRankByConduct } from "@/type/enum/conduct.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam.js";
import { getCodeByVietnameseName } from "@/type/enum/major.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national.excellent.exam.js";
import { Rank } from "@/type/enum/rank.js";
import { SpecialStudentCase } from "@/type/enum/special.student.case.js";
import {
    getAllPossibleSubjectGroups,
    SUBJECT_GROUPS,
    SubjectGroupKey,
    VietnameseSubject,
} from "@/type/enum/subject.js";
import { UniType } from "@/type/enum/uni.type.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { ILogger } from "@/type/interface/logger.js";

export interface PredictionModelServiceConfig {
    SERVER_BATCH_CONCURRENCY: number;
    SERVICE_BATCH_CONCURRENCY: number;
    SERVICE_INPUTS_PER_WORKER: number;
    SERVICE_L1_CHUNK_DELAY_MS: number;
    SERVICE_L1_CHUNK_SIZE_INPUT_ARRAY: number;
    SERVICE_L2_CHUNK_DELAY_MS: number;
    SERVICE_L2_CHUNK_SIZE_INPUT_ARRAY: number;
    SERVICE_MAX_RETRIES: number;
    SERVICE_MIN_BATCH_CONCURRENCY: number;
    SERVICE_NETWORK_LATENCY_MS: number;
    SERVICE_PREDICTION_CONCURRENCY: number;
    SERVICE_REQUEST_DELAY_MS: number;
    SERVICE_RETRY_BASE_DELAY_MS: number;
    SERVICE_RETRY_ITERATION_DELAY_MS: number;
}

interface ExamScenario {
    diem_chuan: number;
    to_hop_mon: string;
    type: "ccqt" | "dgnl" | "national" | "talent" | "vsat";
}

interface SubjectGroupScore {
    groupName: string;
    scoreBreakdown: { score: number; subject: VietnameseSubject }[];
    subjects: VietnameseSubject[];
    totalScore: number;
}
@injectable()
export class PredictionModelService {
    private readonly config: PredictionModelServiceConfig;

    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.OcrResultRepository)
        private readonly ocrResultEntityRepository: Repository<OcrResultEntity>,
        @inject(TYPES.StudentService)
        private readonly studentService: StudentService,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.PredictionModelServiceConfig)
        config: PredictionModelServiceConfig,
    ) {
        this.config = config;
    }

    async getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]> {
        const student = await this.studentService.getStudentEntityByIdAnUserId(
            studentId,
            userId,
        );
        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            student,
        );

        // Create base template for L1 user inputs
        const baseTemplate = this.createBaseUserInputL1Template(studentInfoDTO);

        // Generate L1 user inputs for all major combinations
        const userInputs = this.generateUserInputL1Combinations(
            baseTemplate,
            studentInfoDTO.majors,
        );

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for L1 prediction",
            );
        }

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

    async getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]> {
        // Data retrieval and validation
        const student = await this.studentService.getStudentEntityByIdAnUserId(
            studentId,
            userId,
        );

        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            student,
        );
        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");

        // Create base template for user inputs
        const baseTemplate = this.createBaseL2UserInputTemplate(studentInfoDTO);

        // Collect all possible exam scenarios
        const examScenarios = this.collectExamScenarios(
            student,
            studentInfoDTO,
        );

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

        // Generate user inputs for all combinations
        const userInputs = this.generateL2UserInputCombinations(
            baseTemplate,
            examScenarios,
            ccnnCertifications,
            studentInfoDTO.majors,
        );

        // Sort the userInputs array alphabetically by subject group to ensure consistent processing order
        userInputs.sort((a, b) => a.to_hop_mon.localeCompare(b.to_hop_mon));

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for prediction",
            );
        }

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

    async predictMajorsByStudentIdAndUserId(
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

    private _createCcqtScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (studentInfoDTO.hasCertificationExamType("CCQT")) {
            const ccqtCerts =
                studentInfoDTO.getCertificationsByExamType("CCQT");
            return ccqtCerts.reduce<ExamScenario[]>((acc, cert) => {
                if (
                    cert.examType.type === "CCQT" &&
                    cert.examType.value !== CCQTType.OTHER
                ) {
                    const score = this.getAndValidateScoreByCCQT(
                        cert.examType.value,
                        cert.level,
                    );
                    if (score !== undefined) {
                        acc.push({
                            diem_chuan: score,
                            to_hop_mon: cert.examType.value,
                            type: "ccqt",
                        });
                    }
                }
                return acc;
            }, []);
        }
        return [];
    }

    private _createDgnlScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (studentInfoDTO.hasAptitudeTestScore()) {
            const examType = studentInfoDTO.aptitudeTestScore?.examType;
            const aptitudeScore = studentInfoDTO.getAptitudeTestScore();

            if (
                examType?.type === "DGNL" &&
                examType.value in DGNLType &&
                examType.value !== DGNLType.OTHER &&
                aptitudeScore !== undefined
            ) {
                return [
                    {
                        diem_chuan: aptitudeScore,
                        to_hop_mon: examType.value,
                        type: "dgnl",
                    },
                ];
            }
        }
        return [];
    }

    private _createNationalAndVsatScenarios(
        student: StudentEntity,
        studentInfoDTO: StudentInfoDTO,
        possibleSubjectGroups: SubjectGroupKey[],
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        if (student.hasValidNationalExamData()) {
            const subjectGroupScores: SubjectGroupScore[] =
                this.calculateSubjectGroupScores(studentInfoDTO);

            // Filter to only groups that can be formed with national exam subjects only
            const nationalSubjects = new Set(
                studentInfoDTO.nationalExams.map((e) => e.name),
            );
            const nationalOnlyGroups = subjectGroupScores.filter((group) =>
                group.subjects.every((subject) =>
                    nationalSubjects.has(subject),
                ),
            );

            scenarios.push(
                ...nationalOnlyGroups.map((group) => ({
                    diem_chuan: group.totalScore,
                    to_hop_mon: group.groupName,
                    type: "national" as const,
                })),
            );
        }

        if (studentInfoDTO.hasValidVSATScores()) {
            scenarios.push(
                ...possibleSubjectGroups.map((subjectGroup) => ({
                    diem_chuan: studentInfoDTO.getTotalVSATScore(),
                    to_hop_mon: subjectGroup,
                    type: "vsat" as const,
                })),
            );
        }

        return scenarios;
    }

    private _createTalentScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (
            !studentInfoDTO.talentScores ||
            studentInfoDTO.talentScores.length === 0
        ) {
            return [];
        }

        const subjectGroupScores =
            this.calculateSubjectGroupScores(studentInfoDTO);

        // Filter to only groups that include talent score subjects
        const talentSubjects = new Set(
            studentInfoDTO.talentScores.map((t) => t.name),
        );
        const talentScenarios = subjectGroupScores
            .filter((group) =>
                group.subjects.some((subject) => talentSubjects.has(subject)),
            )
            .map((group) => ({
                diem_chuan: group.totalScore,
                to_hop_mon: group.groupName,
                type: "talent" as const,
            }));

        this.logger.info("L2 Prediction: Generated talent score scenarios", {
            availableTalentSubjects: Array.from(talentSubjects),
            subjectGroups: talentScenarios.map((s) => s.to_hop_mon),
            talentScenarios: talentScenarios.length,
        });

        return talentScenarios;
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
            const dynamicConcurrency = this.calculateDynamicBatchConcurrency(
                inputsForGroup.length,
                this.config.SERVICE_INPUTS_PER_WORKER, // inputs per worker
                this.config.SERVICE_BATCH_CONCURRENCY, // Max limit from config
                this.config.SERVICE_MIN_BATCH_CONCURRENCY, // Min concurrency
            );

            this.logger.info(
                `L1 Prediction: Attempting batch prediction for group ${groupName}`,
                {
                    calculatedConcurrency: dynamicConcurrency,
                    configMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                    inputCount: inputsForGroup.length,
                },
            );

            // Use dynamic concurrency in the batch call
            const batchResults = await this.predictL1MajorsBatch(
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

            await this.delay(this.config.SERVICE_RETRY_BASE_DELAY_MS);

            const limit = pLimit(this.config.SERVICE_PREDICTION_CONCURRENCY);
            const batchResults = await Promise.allSettled(
                inputsForGroup.map((userInput, index) =>
                    limit(async () => {
                        try {
                            if (index > 0) {
                                await this.delay(
                                    this.config.SERVICE_REQUEST_DELAY_MS,
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
        this.logger.info(
            `L1 Prediction: Starting sequential retry for failed predictions in group: ${subjectGroup}`,
            {
                failedCount: failedInputs.length,
            },
        );

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
                        await this.delay(
                            this.config.SERVICE_RETRY_BASE_DELAY_MS * attempt,
                        );
                    }
                }
            }
            if (i < failedInputs.length - 1) {
                await this.delay(this.config.SERVICE_RETRY_ITERATION_DELAY_MS);
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
            const dynamicConcurrency = this.calculateDynamicBatchConcurrency(
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

            await this.delay(this.config.SERVICE_RETRY_BASE_DELAY_MS);

            const limit = pLimit(this.config.SERVICE_PREDICTION_CONCURRENCY);
            const batchResults = await Promise.allSettled(
                inputsForGroup.map((userInput, index) =>
                    limit(async () => {
                        try {
                            if (index > 0) {
                                await this.delay(
                                    this.config.SERVICE_REQUEST_DELAY_MS,
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
                        await this.delay(
                            this.config.SERVICE_RETRY_BASE_DELAY_MS * attempt,
                        );
                    }
                }
            }
            if (i < failedInputs.length - 1) {
                await this.delay(this.config.SERVICE_RETRY_ITERATION_DELAY_MS);
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

    private async _processL1Chunk(
        subjectGroup: string,
        inputsForGroup: UserInputL1[],
        groupIndex = 0, // Add index parameter
    ): Promise<L1PredictResult[]> {
        const startTime = Date.now();

        // Add small delay between subject groups to avoid overwhelming the server
        if (groupIndex > 0) {
            await this.delay(this.config.SERVICE_L1_CHUNK_DELAY_MS);
        }

        this.logger.info(
            `L1 Prediction: Starting batch processing for subject group: ${subjectGroup} (${(groupIndex + 1).toString()})`,
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

    private async _processSubjectGroup(
        subjectGroup: string,
        inputsForGroup: UserInputL2[],
        groupIndex = 0, // Add index parameter
    ): Promise<L2PredictResult[]> {
        const startTime = Date.now();

        // Add small delay between subject groups to avoid overwhelming the server
        if (groupIndex > 0) {
            await this.delay(this.config.SERVICE_L2_CHUNK_DELAY_MS); // delay between groups
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

    /**
     * Calculates optimal batch concurrency based on user input count
     * @param userInputCount Total number of user inputs to process
     * @param inputsPerWorker Target number of inputs per worker (2-3)
     * @param maxConcurrency Maximum allowed concurrency (optional safety limit)
     * @param minConcurrency Minimum allowed concurrency (default: 1)
     * @returns Calculated batch concurrency
     */
    private calculateDynamicBatchConcurrency(
        userInputCount: number,
        inputsPerWorker = 3, // Default to 3 inputs per worker
        maxConcurrency?: number,
        minConcurrency = 1,
    ): number {
        // Calculate needed workers based on inputs per worker
        const neededWorkers = Math.ceil(userInputCount / inputsPerWorker);

        // Apply constraints
        let concurrency = Math.max(neededWorkers, minConcurrency);

        if (maxConcurrency) {
            concurrency = Math.min(concurrency, maxConcurrency);
        }

        this.logger.info("Calculated dynamic batch concurrency", {
            finalConcurrency: concurrency,
            inputsPerWorker,
            maxConcurrency: maxConcurrency ?? "none",
            minConcurrency,
            neededWorkers,
            userInputCount,
        });

        return concurrency;
    }

    private calculateSubjectGroupScores(
        studentInfoDTO: StudentInfoDTO,
    ): SubjectGroupScore[] {
        // Combine all available subjects from national exams and talent scores
        const subjectScoreMap = new Map<VietnameseSubject, number>();

        // Add national exam scores (higher priority)
        studentInfoDTO.nationalExams.forEach((exam) => {
            subjectScoreMap.set(exam.name, exam.score);
        });

        // Add talent scores (only if not already present from national exams)
        studentInfoDTO.talentScores?.forEach((talent) => {
            if (!subjectScoreMap.has(talent.name)) {
                subjectScoreMap.set(talent.name, talent.score);
            }
        });

        const availableSubjects = Array.from(subjectScoreMap.keys());
        const possibleSubjectGroups =
            getAllPossibleSubjectGroups(availableSubjects);

        const subjectGroupScores: SubjectGroupScore[] = [];

        for (const groupName of possibleSubjectGroups) {
            const groupSubjects = SUBJECT_GROUPS[groupName];

            const scoreBreakdown: {
                score: number;
                subject: VietnameseSubject;
            }[] = [];
            let totalScore = 0;
            let hasAllSubjects = true;

            for (const subject of groupSubjects) {
                const score = subjectScoreMap.get(subject);
                if (score === undefined) {
                    hasAllSubjects = false;
                    break;
                }
                scoreBreakdown.push({ score, subject });
                totalScore += score;
            }

            if (hasAllSubjects) {
                subjectGroupScores.push({
                    groupName,
                    scoreBreakdown,
                    subjects: [...groupSubjects],
                    totalScore,
                });
            }
        }

        return subjectGroupScores;
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    private collectExamScenarios(
        student: StudentEntity,
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const vietnameseSubjects: VietnameseSubject[] =
            studentInfoDTO.nationalExams.map((exam) => exam.name);
        const possibleSubjectGroups: SubjectGroupKey[] =
            getAllPossibleSubjectGroups(vietnameseSubjects);

        if (possibleSubjectGroups.length === 0) {
            this.logger.warn(
                "L2 Prediction: Cannot determine any valid subject groups from national exam data",
                { vietnameseSubjects },
            );
        }

        const scenarios = [
            ...this._createNationalAndVsatScenarios(
                student,
                studentInfoDTO,
                possibleSubjectGroups,
            ),
            ...this._createDgnlScenarios(studentInfoDTO),
            ...this._createCcqtScenarios(studentInfoDTO),
            ...this._createTalentScenarios(studentInfoDTO),
        ];

        return scenarios;
    }

    // =================================================================
    // PRIVATE HELPER METHODS: SCENARIO & INPUT GENERATION
    // =================================================================

    /**
     * Combines L1 prediction results by keeping only the highest score for each admission code
     * and removing duplicates across all priority types.
     * @param results Array of L1PredictResult objects
     * @returns Combined results with highest scores and no duplicates
     */
    private combineL1Results(results: L1PredictResult[]): L1PredictResult[] {
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

    private compareRanks(rankA: Rank, rankB: Rank): number {
        const rankOrder = {
            [Rank.FIRST]: 1,
            [Rank.SECOND]: 2,
            [Rank.THIRD]: 3,
        };
        return rankOrder[rankA] - rankOrder[rankB];
    }

    private createBaseL2UserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL2,
        "diem_ccta" | "diem_chuan" | "nhom_nganh" | "ten_ccta" | "to_hop_mon"
    > {
        return {
            cong_lap: this.mapUniTypeToBinaryFlag(studentInfoDTO.uniType),
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

    private deduplicateByHighestScore(
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

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Helper method to determine which factor limited the chunk size
     */
    private determineLimitingFactor(factors: {
        concurrencyAdjusted: number;
        finalOptimal: number;
        maxChunkSize: number;
        memoryBased: number;
        networkOptimal: number;
    }): string {
        const {
            concurrencyAdjusted,
            finalOptimal,
            maxChunkSize,
            memoryBased,
            networkOptimal,
        } = factors;

        // Find which factor produced the final result
        if (finalOptimal === concurrencyAdjusted) {
            return "concurrency_complexity";
        } else if (finalOptimal === networkOptimal) {
            return "network_latency";
        } else if (finalOptimal === memoryBased) {
            return "memory_constraint";
        } else if (finalOptimal === maxChunkSize) {
            return "max_chunk_size_limit";
        } else {
            return "total_inputs_constraint";
        }
    }

    private async executeL1PredictionsWithRetry(
        userInputs: UserInputL1[],
        maxChunkSize = 10,
    ): Promise<L1PredictResult[]> {
        const allResults: L1PredictResult[] = [];
        const optimalChunkSize = this.getOptimalChunkSize(
            userInputs.length,
            maxChunkSize,
            {
                processingComplexity: "medium", // Adjust based on your typical workload
                serverConcurrency: this.config.SERVER_BATCH_CONCURRENCY,
            },
        );

        this.logger.info("L1 Prediction: Calculated optimal chunk size", {
            optimalChunkSize,
            totalInputs: userInputs.length,
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
            const chunks = this.chunkArray(inputs, optimalChunkSize);
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

        this.logger.info(
            "L1 Prediction: Starting concurrent processing with chunking",
            {
                optimalChunkSize,
                originalInputCount: userInputs.length,
                totalChunks: chunkedGroups.length,
                totalGroups: groupedInputs.size,
            },
        );

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

    private async executeL2PredictionsWithRetry(
        userInputs: UserInputL2[],
        maxChunkSize = 10, // Configurable chunk size
    ): Promise<L2PredictResult[]> {
        const allResults: L2PredictResult[] = [];
        const optimalChunkSize = this.getOptimalChunkSize(
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
            const chunks = this.chunkArray(inputs, optimalChunkSize);
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

    private async fetchAndValidateOcrResults(
        userId: string,
        studentId: string,
    ): Promise<void> {
        const ocrResultEntities = await this.ocrResultEntityRepository.find({
            where: {
                processedBy: userId,
                status: OcrStatus.COMPLETED,
                studentId,
            },
        });

        if (ocrResultEntities.length !== 6) {
            throw new IllegalArgumentException(
                `Cannot predict majors due to ocr array length ${ocrResultEntities.length.toString()} is not 6`,
            );
        }
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

    private generateL2UserInputCombinations(
        baseTemplate: Omit<
            UserInputL2,
            | "diem_ccta"
            | "diem_chuan"
            | "nhom_nganh"
            | "ten_ccta"
            | "to_hop_mon"
        >,
        examScenarios: ExamScenario[],
        ccnnCertifications: CertificationDTO[],
        majors: string[],
    ): UserInputL2[] {
        const validCcnnCerts = ccnnCertifications.filter(
            (cert) =>
                cert.cefr &&
                cert.examType.type === "CCNN" &&
                cert.examType.value !== CCNNType.OTHER,
        );

        return examScenarios.flatMap((scenario) =>
            validCcnnCerts.flatMap((cert) =>
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
                            diem_ccta: cert.cefr,
                            diem_chuan: scenario.diem_chuan,
                            nhom_nganh: parseInt(majorCode, 10),
                            ten_ccta: "CEFR",
                            to_hop_mon: scenario.to_hop_mon,
                        } as UserInputL2;
                    })
                    .filter((input): input is UserInputL2 => input !== null),
            ),
        );
    }

    private generateUserInputL1Combinations(
        baseTemplate: Omit<UserInputL1, "nhom_nganh">,
        majors: string[],
    ): UserInputL1[] {
        return majors
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
                    nhom_nganh: parseInt(majorCode, 10),
                } as UserInputL1;
            })
            .filter((input): input is UserInputL1 => input !== null);
    }

    private getAndValidateScoreByCCQT(
        type: CCQTType,
        validateScore: string,
    ): number | undefined {
        const parsedScore = parseInt(validateScore, 10);
        if (isNaN(parsedScore) && type !== CCQTType["A-Level"])
            return undefined;

        switch (type) {
            case CCQTType.ACT:
                return 1 <= parsedScore && parsedScore <= 36
                    ? parsedScore
                    : undefined;
            case CCQTType.IB:
                return 0 <= parsedScore && parsedScore <= 45
                    ? parsedScore
                    : undefined;
            case CCQTType.OSSD:
                return 0 <= parsedScore && parsedScore <= 100
                    ? parsedScore
                    : undefined;
            case CCQTType.SAT:
                return 400 <= parsedScore && parsedScore <= 1600
                    ? parsedScore
                    : undefined;
            case CCQTType["A-Level"]:
                return this.getAndValidateScoreByCCQT_Type_A_Level(
                    validateScore,
                );
            case CCQTType["Duolingo English Test"]:
                return 10 <= parsedScore && parsedScore <= 160
                    ? parsedScore
                    : undefined;
            case CCQTType["PTE Academic"]:
                return 10 <= parsedScore && parsedScore <= 90
                    ? parsedScore
                    : undefined;
            default:
                return undefined;
        }
    }

    private getAndValidateScoreByCCQT_Type_A_Level(
        level: string,
    ): number | undefined {
        switch (level.toUpperCase()) {
            case "A":
                return 0.9;
            case "A*":
                return 1.0;
            case "B":
                return 0.8;
            case "C":
                return 0.7;
            case "D":
                return 0.6;
            case "E":
                return 0.5;
            case "F":
            case "N":
            case "O":
            case "U":
                return 0.0;
            default:
                return undefined;
        }
    }

    private getOptimalChunkSize(
        totalInputs: number,
        maxChunkSize = 10,
        factors?: {
            memoryLimit?: number;
            networkLatency?: number;
            processingComplexity?: "high" | "low" | "medium";
            serverConcurrency?: number;
        },
    ): number {
        const {
            memoryLimit = 1000, // Default memory limit per chunk
            networkLatency = this.config.SERVICE_NETWORK_LATENCY_MS, // ms
            processingComplexity = "medium",
            serverConcurrency = this.config.SERVER_BATCH_CONCURRENCY,
        } = factors ?? {};

        // For small datasets, prioritize parallelism
        const smallDatasetThreshold = serverConcurrency * 2;
        if (totalInputs <= smallDatasetThreshold) {
            const optimalSize = 1;
            const numChunks = totalInputs; // Each input gets its own chunk
            const efficiency = 100; // Perfect efficiency for small datasets

            this.logger.info(
                "Small dataset detected - using maximum parallelism strategy",
                {
                    efficiency: `${efficiency.toString()}%`,
                    factors: {
                        concurrencyUtilization: `${Math.min((numChunks / serverConcurrency) * 100, 100).toFixed(1)}%`,
                        smallDatasetOptimization: true,
                    },
                    numChunks,
                    optimalSize,
                    reasoning:
                        "Maximizing parallelism for small dataset to minimize latency",
                    serverConcurrency,
                    strategy: "small_dataset_parallelism",
                    threshold: smallDatasetThreshold,
                    totalInputs,
                },
            );

            return optimalSize;
        }

        // Standard algorithm for larger datasets
        // Factor 1: Balance with server concurrency
        // Aim for chunks that can be processed efficiently in parallel
        const concurrencyBasedSize = Math.ceil(totalInputs / serverConcurrency);

        // Factor 2: Processing complexity adjustment
        const complexityMultiplier = {
            high: 0.7,
            low: 1.5,
            medium: 1.0,
        }[processingComplexity];

        // Factor 3: Network efficiency - avoid too many small requests
        const networkOptimalSize = Math.max(
            3,
            Math.min(maxChunkSize, networkLatency / 10),
        );

        // Factor 4: Memory constraints
        const memoryBasedSize = Math.floor(memoryLimit / 50); // Assuming ~50 memory units per input

        // Calculate optimal size considering all factors
        let optimalSize = Math.floor(
            Math.min(
                concurrencyBasedSize * complexityMultiplier,
                networkOptimalSize,
                memoryBasedSize,
                maxChunkSize,
            ),
        );

        // Ensure minimum viable chunk size
        optimalSize = Math.max(optimalSize, 1);

        // If total inputs is small, don't over-chunk
        if (totalInputs <= maxChunkSize) {
            optimalSize = Math.min(optimalSize, totalInputs);
        }

        // Calculate efficiency metrics
        const numChunks = Math.ceil(totalInputs / optimalSize);
        const remainder = totalInputs % optimalSize;
        const efficiency = 1 - remainder / totalInputs;

        // Determine which factor was the limiting constraint
        const limitingFactor = this.determineLimitingFactor({
            concurrencyAdjusted: Math.floor(
                concurrencyBasedSize * complexityMultiplier,
            ),
            finalOptimal: optimalSize,
            maxChunkSize,
            memoryBased: memoryBasedSize,
            networkOptimal: networkOptimalSize,
        });

        this.logger.info("Calculated optimal chunk size with factors", {
            concurrencyUtilization: `${Math.min((numChunks / serverConcurrency) * 100, 100).toFixed(1)}%`,
            config: {
                maxChunkSize,
                memoryLimit,
                networkLatency,
                serverConcurrency,
            },
            efficiency: `${(efficiency * 100).toFixed(1)}%`,
            factors: {
                complexityAdjusted: Math.floor(
                    concurrencyBasedSize * complexityMultiplier,
                ),
                concurrencyBased: concurrencyBasedSize,
                limitingFactor: limitingFactor,
                memoryBased: memoryBasedSize,
                networkOptimal: networkOptimalSize,
            },
            numChunks,
            optimalSize,
            processingComplexity,
            strategy: "standard_algorithm",
            totalInputs,
        });

        return optimalSize;
    }

    private isValidationError(data: unknown): data is HTTPValidationError {
        return (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            Array.isArray((data as HTTPValidationError).detail)
        );
    }

    private mapAwardsToHsgSubjects(awards?: AwardDTO[]): {
        hsg_1?: HsgSubject;
        hsg_2?: HsgSubject;
        hsg_3?: HsgSubject;
    } {
        if (!awards || awards.length === 0) {
            return { hsg_1: undefined, hsg_2: undefined, hsg_3: undefined };
        }

        // Sort awards by rank priority (First > Second > Third)
        const sortedAwards = awards.sort((a, b) =>
            this.compareRanks(a.level, b.level),
        );

        const result: {
            hsg_1?: HsgSubject;
            hsg_2?: HsgSubject;
            hsg_3?: HsgSubject;
        } = {};

        // Map up to 3 awards to HSG subjects
        if (sortedAwards.length > 0) {
            result.hsg_1 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                sortedAwards[0].category,
            );
        }
        if (sortedAwards.length > 1) {
            result.hsg_2 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                sortedAwards[1].category,
            );
        }
        if (sortedAwards.length > 2) {
            result.hsg_3 = this.mapNationalExcellentStudentSubjectToHsgSubject(
                sortedAwards[2].category,
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

    private async predictL1MajorsBatch(
        userInputs: UserInputL1[],
        dynamicConcurrency?: number, // Optional override
    ): Promise<L1PredictResult[]> {
        try {
            // Calculate dynamic concurrency if not provided
            const batchConcurrency =
                dynamicConcurrency ??
                this.calculateDynamicBatchConcurrency(
                    userInputs.length,
                    this.config.SERVICE_INPUTS_PER_WORKER, // inputs per worker
                    this.config.SERVICE_BATCH_CONCURRENCY, // Use config as max limit
                    this.config.SERVICE_MIN_BATCH_CONCURRENCY, // Min concurrency
                );

            this.logger.info("L1 Prediction: Starting batch prediction", {
                calculatedConcurrency: batchConcurrency,
                configuredMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                inputCount: userInputs.length,
            });

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

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.isValidationError(axiosError.response?.data)
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

    private async predictL2MajorsBatch(
        userInputs: UserInputL2[],
        dynamicConcurrency?: number, // Optional override
    ): Promise<L2PredictResult[]> {
        try {
            // Calculate dynamic concurrency if not provided
            const batchConcurrency =
                dynamicConcurrency ??
                this.calculateDynamicBatchConcurrency(
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

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.isValidationError(axiosError.response?.data)
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

    private async predictMajorsL1(
        userInput: UserInputL1,
    ): Promise<L1PredictResult[]> {
        try {
            this.logger.info("L1 Prediction: Predicting...", {
                majorGroup: userInput.nhom_nganh,
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

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.isValidationError(axiosError.response?.data)
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

    private async predictMajorsL2(
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

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;
                let detailedMessage = axiosError.message;

                if (
                    status === 422 &&
                    this.isValidationError(axiosError.response?.data)
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
                        item,
                    },
                );
            }
        }

        return results;
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
                        item,
                    },
                );
            }
        }

        // Return results even if empty after validation
        // This allows the calling code to handle empty results appropriately
        return results;
    }
}
