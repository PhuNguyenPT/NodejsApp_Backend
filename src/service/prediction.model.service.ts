import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { IsNull, Repository } from "typeorm";

import {
    HTTPValidationError,
    L2PredictResult,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { AcademicPerformanceDTO } from "@/dto/student/academic.performance.dto.js";
import { CertificationDTO } from "@/dto/student/certification.dto.js";
import { ConductDTO } from "@/dto/student/conduct.dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { OcrResultEntity, OcrStatus } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import {
    AcademicPerformance,
    getRankByAcademicPerformance,
} from "@/type/enum/academic.performance.js";
import { Conduct, getRankByConduct } from "@/type/enum/conduct.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam.js";
import { getCodeByVietnameseName } from "@/type/enum/major.js";
import {
    getAllPossibleSubjectGroups,
    SUBJECT_GROUPS,
    SubjectGroupKey,
    VietnameseSubject,
} from "@/type/enum/subject.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { ILogger } from "@/type/interface/logger.js";

export interface PredictionModelServiceConfig {
    SERVER_BATCH_CONCURRENCY: number;
    SERVICE_BATCH_CONCURRENCY: number;
    SERVICE_CHUNK_SIZE_INPUT_ARRAY: number;
    SERVICE_INPUTS_PER_WORKER: number;
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
        private readonly ocrResultRepository: Repository<OcrResultEntity>,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.PredictionModelServiceConfig)
        config: PredictionModelServiceConfig,
    ) {
        this.config = config;
    }

    async getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]> {
        // Data retrieval and validation
        const student = await this.fetchAndValidateStudent(studentId, userId);

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
            this.config.SERVICE_CHUNK_SIZE_INPUT_ARRAY,
        );

        // Deduplicate by ma_xet_tuyen, keeping the highest score
        const deduplicatedResults = this.deduplicateByHighestScore(results);

        this.logger.info("Prediction results summary", {
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
        return await this.predictMajors(userInput);
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

    // =================================================================
    // PRIVATE HELPER METHODS: SCENARIO & INPUT GENERATION
    // =================================================================

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

        this.logger.info("Generated talent score scenarios", {
            availableTalentSubjects: Array.from(talentSubjects),
            subjectGroups: talentScenarios.map((s) => s.to_hop_mon),
            talentScenarios: talentScenarios.length,
        });

        return talentScenarios;
    }

    private async _performBatchPrediction(
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
                `Attempting batch prediction for group ${subjectGroup}`,
                {
                    calculatedConcurrency: dynamicConcurrency,
                    configMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                    inputCount: inputsForGroup.length,
                },
            );

            // Use dynamic concurrency in the batch call
            const batchResults = await this.predictMajorsBatch(
                inputsForGroup,
                dynamicConcurrency,
            );
            successfulResults.push(...batchResults);

            this.logger.info(
                `Batch processing for group ${subjectGroup} completed successfully`,
                {
                    resultCount: batchResults.length,
                    successful: inputsForGroup.length,
                    total: inputsForGroup.length,
                    usedConcurrency: dynamicConcurrency,
                },
            );
        } catch (error: unknown) {
            this.logger.warn(
                "Batch prediction failed for group, falling back to individual predictions",
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
                            return await this.predictMajors(userInput);
                        } catch (error: unknown) {
                            this.logger.warn(
                                "Individual prediction failed, will retry sequentially",
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
                `Fallback processing for group ${subjectGroup} completed`,
                {
                    failed: failedInputs.length,
                    successful: successfulResults.length,
                    total: inputsForGroup.length,
                },
            );
        }

        return { failedInputs, successfulResults };
    }

    private async _performSequentialRetry(
        failedInputs: UserInputL2[],
        subjectGroup: string,
    ): Promise<L2PredictResult[]> {
        this.logger.info(
            `Starting sequential retry for failed predictions in group: ${subjectGroup}`,
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
                        `Sequential retry attempt ${attempt.toString()} for input ${String(i + 1)}/${failedInputs.length.toString()} in group ${subjectGroup}`,
                    );
                    const results = await this.predictMajors(userInput);
                    successfulRetryResults.push(...results);
                    success = true;
                    retrySuccessCount++;
                    this.logger.info(
                        `Sequential retry successful for group ${subjectGroup}`,
                    );
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    if (attempt === this.config.SERVICE_MAX_RETRIES) {
                        this.logger.error(
                            "Sequential retry failed after all attempts for group",
                            {
                                error: errorMessage,
                                subjectGroup,
                            },
                        );
                    } else {
                        this.logger.warn(
                            `Sequential retry attempt ${attempt.toString()} failed for group, will retry`,
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
            `Sequential retry for group ${subjectGroup} completed`,
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
            await this.delay(500); // 500ms delay between groups
        }

        this.logger.info(
            `Starting batch processing for subject group: ${subjectGroup} (${(groupIndex + 1).toString()})`,
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
            await this._performBatchPrediction(inputsForGroup, subjectGroup);

        let retryResults: L2PredictResult[] = [];
        if (failedInputs.length > 0) {
            retryResults = await this._performSequentialRetry(
                failedInputs,
                subjectGroup,
            );
        }

        const duration = Date.now() - startTime;
        const totalResults = successfulResults.length + retryResults.length;

        this.logger.info(`Subject group ${subjectGroup} completed`, {
            duration: `${duration.toString()}ms`,
            failedInputs: failedInputs.length,
            SERVICE_PREDICTION_CONCURRENCY:
                this.config.SERVICE_PREDICTION_CONCURRENCY,
            throughput: `${(totalResults / (duration / 1000)).toFixed(2)} predictions/sec`,
            totalResults,
        });

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
                "Cannot determine any valid subject groups from national exam data",
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

        this.logger.info("Generated exam scenarios", {
            ccqtScenarios: scenarios.filter((s) => s.type === "ccqt").length,
            dgnlScenarios: scenarios.filter((s) => s.type === "dgnl").length,
            nationalScenarios: scenarios.filter((s) => s.type === "national")
                .length,
            talentScenarios: scenarios.filter((s) => s.type === "talent")
                .length,
            totalScenarios: scenarios.length,
            vsatScenarios: scenarios.filter((s) => s.type === "vsat").length,
        });

        return scenarios;
    }
    private createBaseL2UserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL2,
        "diem_ccta" | "diem_chuan" | "nhom_nganh" | "ten_ccta" | "to_hop_mon"
    > {
        return {
            cong_lap: 1,
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

        this.logger.info("Calculated optimal chunk size", {
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

        this.logger.info("Starting concurrent processing with chunking", {
            optimalChunkSize,
            originalInputCount: userInputs.length,
            totalChunks: chunkedGroups.length,
            totalSubjectGroups: groupedInputs.size,
        });

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
                    `Chunk ${subjectGroup} completed successfully`,
                    {
                        resultsCount: result.value.length,
                    },
                );
            } else {
                this.logger.error(`Chunk ${subjectGroup} failed completely`, {
                    error:
                        result.reason instanceof Error
                            ? result.reason.message
                            : String(result.reason),
                });
            }
        }

        this.logger.info("All chunks processing completed", {
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
        const ocrResultEntities = await this.ocrResultRepository.find({
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
    private async fetchAndValidateStudent(
        studentId: string,
        userId?: string,
    ): Promise<StudentEntity> {
        const student = await this.studentRepository.findOne({
            relations: ["awards", "certifications"],
            where: { id: studentId, userId: userId ?? IsNull() },
        });

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with id ${studentId} not found`,
            );
        }

        return student;
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
                                `Cannot find code for major: ${major}`,
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

        this.logger.info("Calculated optimal chunk size with factors", {
            efficiency: `${(efficiency * 100).toFixed(1)}%`,
            factors: {
                complexityAdjusted: Math.floor(
                    concurrencyBasedSize * complexityMultiplier,
                ),
                concurrencyBased: concurrencyBasedSize,
                memoryBased: memoryBasedSize,
                networkOptimal: networkOptimalSize,
            },
            numChunks,
            optimalSize,
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
    private async predictMajors(
        userInput: UserInputL2,
    ): Promise<L2PredictResult[]> {
        try {
            this.logger.info("Starting prediction", {
                userInput,
            });

            const response = await this.httpClient.post<L2PredictResult[]>(
                `/predict/l2`,
                userInput,
            );

            const validatedResults = await this.validateResponse(response.data);

            if (validatedResults.length === 0) {
                this.logger.info("No valid predictions found", {
                    major: userInput.nhom_nganh,
                    subjectGroup: userInput.to_hop_mon,
                });
            } else {
                this.logger.info("Prediction completed", {
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

                this.logger.error("API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `API error (${String(status)}): ${detailedMessage} for ${userInput.to_hop_mon}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("Service error", {
                message,
                ...errorContext,
            });

            throw new Error(
                `Service error: ${message} for ${userInput.to_hop_mon}`,
            );
        }
    }

    private async predictMajorsBatch(
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

            this.logger.info("Starting batch prediction", {
                calculatedConcurrency: batchConcurrency,
                configuredMaxConcurrency: this.config.SERVICE_BATCH_CONCURRENCY,
                inputCount: userInputs.length,
            });

            const batchRequest = {
                items: userInputs,
            };

            const response = await this.httpClient.post<L2PredictResult[][]>(
                `/predict/l2/batch?concurrency=${batchConcurrency.toString()}`,
                batchRequest,
            );

            const flattenedResults = response.data.flat();
            const validatedResults =
                await this.validateResponse(flattenedResults);

            this.logger.info("Batch prediction completed", {
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

                this.logger.error("Batch API error", {
                    message: detailedMessage,
                    status: status ?? "unknown",
                    ...errorContext,
                });

                throw new Error(
                    `Batch API error (${String(status)}): ${detailedMessage}`,
                );
            }

            const message =
                error instanceof Error ? error.message : "Unknown error";
            this.logger.error("Batch service error", {
                message,
                ...errorContext,
            });

            throw new Error(`Batch service error: ${message}`);
        }
    }

    private async processIndividuallyWithRetry(
        userInputs: UserInputL2[],
        subjectGroup: string,
    ): Promise<L2PredictResult[]> {
        const allResults: L2PredictResult[] = [];

        for (const userInput of userInputs) {
            let success = false;

            for (
                let attempt = 1;
                attempt <= this.config.SERVICE_MAX_RETRIES && !success;
                attempt++
            ) {
                try {
                    const results = await this.predictMajors(userInput);
                    allResults.push(...results);
                    success = true;
                } catch (error: unknown) {
                    if (attempt === this.config.SERVICE_MAX_RETRIES) {
                        this.logger.error(
                            `Failed all ${this.config.SERVICE_MAX_RETRIES.toString()} attempts for input in group ${subjectGroup}`,
                            {
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                                major: userInput.nhom_nganh,
                                subjectGroup: userInput.to_hop_mon,
                            },
                        );
                    } else {
                        this.logger.warn(
                            `Attempt ${attempt.toString()} failed for group ${subjectGroup}, retrying`,
                            {
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                            },
                        );
                        await this.delay(
                            this.config.SERVICE_RETRY_BASE_DELAY_MS * attempt,
                        );
                    }
                }
            }
        }

        this.logger.info(
            `Individual processing completed for group ${subjectGroup}`,
            {
                inputCount: userInputs.length,
                resultCount: allResults.length,
            },
        );

        return allResults;
    }

    private async validateResponse(data: unknown): Promise<L2PredictResult[]> {
        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }

        // Handle empty array case - this is valid when no predictions are found
        if (data.length === 0) {
            this.logger.info("No predictions found for this input");
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
                this.logger.warn("Invalid prediction result received", {
                    errors: errors.map((err) => ({
                        constraints: err.constraints,
                        property: err.property,
                    })),
                    item,
                });
            }
        }

        // Return results even if empty after validation
        // This allows the calling code to handle empty results appropriately
        return results;
    }
}
