import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

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
import { AcademicPerformanceDTO } from "@/dto/student/academic-performance-dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { ConductDTO } from "@/dto/student/conduct-dto.js";
import { StudentInfoDTO } from "@/dto/student/student-dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import {
    AcademicPerformance,
    getRankByAcademicPerformance,
} from "@/type/enum/academic-performance.js";
import { Conduct, getRankByConduct } from "@/type/enum/conduct.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam.js";
import { getCodeByVietnameseName } from "@/type/enum/major.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import {
    getAllPossibleSubjectGroups,
    SUBJECT_GROUPS,
    SubjectGroupKey,
    VietnameseSubject,
} from "@/type/enum/subject.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VsatExamSubject } from "@/type/enum/vsat-exam-subject.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";
import { validateAndTransformSync } from "@/util/validation.util.js";

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
export class PredictionModelService implements IPredictionModelService {
    private readonly config: PredictionModelServiceConfig;

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.StudentRepository) // Changed from StudentService
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.PredictionModelServiceConfig)
        config: PredictionModelServiceConfig,
    ) {
        this.config = config;
    }

    public async getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]> {
        const student = await this.studentRepository.findOne({
            relations: ["awards", "certifications"],
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

        const studentInfoDTO = validateAndTransformSync(
            StudentInfoDTO,
            student,
        );

        // Generate ALL user input combinations (awards × majors)
        const userInputs = this.generateUserInputL1Combinations(studentInfoDTO);

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

    public async getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]> {
        // Data retrieval and validation
        const student = await this.studentRepository.findOne({
            relations: ["awards", "certifications"], // Add relations needed by StudentInfoDTO
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

        const studentInfoDTO = validateAndTransformSync(
            StudentInfoDTO,
            student,
        );

        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");

        // Create base template for user inputs
        const baseTemplate = this.createBaseL2UserInputTemplate(studentInfoDTO);

        // Collect all possible exam scenarios
        const examScenarios = this.collectExamScenarios(studentInfoDTO);

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

    private _createCcqtScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        if (studentInfoDTO.hasCertificationExamType("CCQT")) {
            const ccqtCerts =
                studentInfoDTO.getCertificationsByExamType("CCQT");
            return ccqtCerts.reduce<ExamScenario[]>((acc, cert) => {
                if (cert.examType.type === "CCQT") {
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

    private _createNationalScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        if (!studentInfoDTO.hasValidNationalExam()) {
            return scenarios;
        }

        const subjectGroupScores: SubjectGroupScore[] =
            this.calculateSubjectGroupScores(studentInfoDTO);

        // Filter to only groups that can be formed with national exam subjects only
        const nationalSubjects = new Set<VietnameseSubject>(
            studentInfoDTO.nationalExams.map((e) => e.name),
        );
        const nationalOnlyGroups = subjectGroupScores.filter((group) =>
            group.subjects.every((subject) => nationalSubjects.has(subject)),
        );

        scenarios.push(
            ...nationalOnlyGroups.map((group) => ({
                diem_chuan: group.totalScore,
                to_hop_mon: group.groupName,
                type: "national" as const,
            })),
        );

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

        const talentSubjects = new Set<VietnameseSubject>(
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

    private _createVsatScenarios(
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        if (!studentInfoDTO.hasValidVSATScores()) {
            return scenarios;
        }

        // Create a map of VSAT subject scores for quick lookup
        const vsatScoreMap = new Map<VsatExamSubject, number>();
        studentInfoDTO.vsatScores?.forEach((exam) => {
            vsatScoreMap.set(exam.name, exam.score);
        });

        // Get VSAT subjects and calculate possible subject groups from VSAT data
        const vsatSubjects: VietnameseSubject[] =
            studentInfoDTO.vsatScores?.map((exam) => exam.name) ?? [];
        const vsatPossibleGroups: SubjectGroupKey[] =
            getAllPossibleSubjectGroups(vsatSubjects);

        // Filter to only the specified groups
        const allowedVsatGroups: SubjectGroupKey[] = [
            "A00",
            "A01",
            "D01",
            "D07",
            "C01",
            "D10",
        ];

        for (const subjectGroup of vsatPossibleGroups) {
            if (!allowedVsatGroups.includes(subjectGroup)) {
                continue;
            }

            const groupSubjects = SUBJECT_GROUPS[subjectGroup];

            // Calculate the sum of scores for the 3 subjects in this group
            let totalScore = 0;
            let hasAllSubjects = true;

            for (const subject of groupSubjects) {
                const score = vsatScoreMap.get(subject as VsatExamSubject);
                if (score === undefined) {
                    hasAllSubjects = false;
                    break;
                }
                totalScore += score;
            }

            // Only include if all 3 subjects are available
            if (hasAllSubjects) {
                scenarios.push({
                    diem_chuan: totalScore,
                    to_hop_mon: subjectGroup,
                    type: "vsat" as const,
                });
            }
        }

        return scenarios;
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
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios = [
            ...this._createNationalScenarios(studentInfoDTO),
            ...this._createVsatScenarios(studentInfoDTO),
            ...this._createDgnlScenarios(studentInfoDTO),
            ...this._createCcqtScenarios(studentInfoDTO),
            ...this._createTalentScenarios(studentInfoDTO),
        ];

        return scenarios;
    }

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

    // =================================================================
    // PRIVATE HELPER METHODS: SCENARIO & INPUT GENERATION
    // =================================================================

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
        // Create a map to group certifications by their handling type
        const certificationMap = new Map<string, CertificationDTO[]>();

        ccnnCertifications.forEach((cert) => {
            if (cert.examType.value === CCNNType.JLPT && cert.level) {
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
                                nhom_nganh: parseInt(majorCode, 10),
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

        return combinations;
    }

    // Updated method to generate all user input combinations
    private generateUserInputL1Combinations(
        studentInfoDTO: StudentInfoDTO,
    ): UserInputL1[] {
        // Create base template without HSG or major fields
        const baseTemplate = this.createBaseUserInputL1Template(studentInfoDTO);

        // Generate award-specific input templates
        const awardInputs = this.generateUserInputsForAwards(
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
                        nhom_nganh: parseInt(majorCode, 10),
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

    // Generate separate user inputs for each award combination
    private generateUserInputsForAwards(
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

    private isValidationError(data: unknown): data is HTTPValidationError {
        return (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            Array.isArray((data as HTTPValidationError).detail)
        );
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
