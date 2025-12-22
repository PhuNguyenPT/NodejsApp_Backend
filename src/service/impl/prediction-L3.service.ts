import { AxiosError, type AxiosInstance, isAxiosError } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import type { PredictionModelServiceConfig } from "@/config/prediction-model.config.js";
import type { ISubjectScore } from "@/dto/ocr/subject-score.interface.js";
import type { IPredictionL3Service } from "@/service/prediction-L3-service.interface.js";
import type { NationalExamSubject } from "@/type/enum/national-exam-subject.js";
import type { TalentExamSubject } from "@/type/enum/talent-exam-subject.js";

import { DEFAULT_VALIDATOR_OPTIONS } from "@/config/validator.config.js";
import { AwardEnglish } from "@/dto/prediction/award-english.dto.js";
import { AwardQG } from "@/dto/prediction/award-qg.dto.js";
import { DGNL } from "@/dto/prediction/dgnl.dto.js";
import { HsgSubject } from "@/dto/prediction/hsg-subject.enum.js";
import { InterCer } from "@/dto/prediction/inter-cer.dto.js";
import { InterCerEnum } from "@/dto/prediction/inter-cert.enum.js";
import { L3NationalSubject } from "@/dto/prediction/l3-national-subject.enum.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserInputL3 } from "@/dto/prediction/l3-request.dto.js";
import { NangKhieuScore } from "@/dto/prediction/nang-khieu-score.dto.js";
import { THPTSubjectScore } from "@/dto/prediction/thpt-subject-score.dto.js";
import { TNTHPTScores } from "@/dto/prediction/tnthpt-scores.dto.js";
import { TranscriptRecord } from "@/dto/prediction/transcript-record.dto.js";
import { TranscriptSubjectScore } from "@/dto/prediction/transcript-subject-score.dto.js";
import { AptitudeExamDTO } from "@/dto/student/aptitude-exam-dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { TalentExam } from "@/dto/student/exam.dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { TYPES } from "@/type/container/types.js";
import { type CCQTType, ExamType, isCCQTType } from "@/type/enum/exam-type.js";
import { getCodeByVietnameseName, MajorGroup } from "@/type/enum/major.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";
import { VietnameseSubject } from "@/type/enum/subject.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";
import { formatValidationErrors } from "@/util/validation.util.js";

@injectable()
export class PredictionL3Service implements IPredictionL3Service {
    /**
     * Mapping from NationalExcellentStudentExamSubject to HsgSubject
     */
    private readonly NATIONAL_EXCELLENT_TO_HSG_SUBJECT_MAPPING: Record<
        NationalExcellentStudentExamSubject,
        HsgSubject
    > = {
        [NationalExcellentStudentExamSubject.BIOLOGY]: HsgSubject.SINH,
        [NationalExcellentStudentExamSubject.CHEMISTRY]: HsgSubject.HOA,
        [NationalExcellentStudentExamSubject.CHINESE]: HsgSubject.TIENG_TRUNG,
        [NationalExcellentStudentExamSubject.ENGLISH]: HsgSubject.ANH,
        [NationalExcellentStudentExamSubject.FRENCH]: HsgSubject.TIENG_PHAP,
        [NationalExcellentStudentExamSubject.GEOGRAPHY]: HsgSubject.DIA,
        [NationalExcellentStudentExamSubject.HISTORY]: HsgSubject.SU,
        [NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY]:
            HsgSubject.TIN,
        [NationalExcellentStudentExamSubject.JAPANESE]: HsgSubject.TIENG_NHAT,
        [NationalExcellentStudentExamSubject.LITERATURE]: HsgSubject.VAN,
        [NationalExcellentStudentExamSubject.MATHEMATICS]: HsgSubject.TOAN,
        [NationalExcellentStudentExamSubject.PHYSICS]: HsgSubject.LY,
        [NationalExcellentStudentExamSubject.RUSSIAN]: HsgSubject.TIENG_NGA,
    };

    /**
     * Mapping from Rank enum to numeric level
     */
    private readonly RANK_TO_LEVEL_MAPPING: Record<Rank, number> = {
        [Rank.CONSOLATION]: 4,
        [Rank.FIRST]: 1,
        [Rank.SECOND]: 2,
        [Rank.THIRD]: 3,
    };

    /**
     * Mapping from TalentExamSubject to NangKhieuScore properties
     */
    private readonly TALENT_SUBJECT_MAPPING: Record<
        TalentExamSubject,
        keyof NangKhieuScore
    > = {
        [VietnameseSubject.BIEU_DIEN_NGHE_THUAT]: "BIEU_DIEN_NGHE_THUAT",
        [VietnameseSubject.CHI_HUY_TAI_CHO]: "CHI_HUY_TAI_CHO",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC]: "CHUYEN_MON_AM_NHAC",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC_1]: "CHUYEN_MON_AM_NHAC_1",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC_2]: "CHUYEN_MON_AM_NHAC_2",
        [VietnameseSubject.DOC_DIEN_CAM]: "DOC_DIEN_CAM",
        [VietnameseSubject.DOC_HIEU]: "DOC_HIEU",
        [VietnameseSubject.GHI_AM_XUONG_AM]: "GHI_AM_XUONG_AM",
        [VietnameseSubject.HAT]: "HAT",
        [VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU]: "HAT_BIEU_DIEN_NHAC_CU",
        [VietnameseSubject.HAT_MUA]: "HAT_MUA",
        [VietnameseSubject.HAT_XUONG_AM]: "HAT_XUONG_AM",
        [VietnameseSubject.HOA_THANH]: "HOA_THANH",
        [VietnameseSubject.KY_XUONG_AM]: "KY_XUONG_AM",
        [VietnameseSubject.NANG_KHIEU]: "NANG_KHIEU",
        [VietnameseSubject.NANG_KHIEU_1]: "NANG_KHIEU_1",
        [VietnameseSubject.NANG_KHIEU_2]: "NANG_KHIEU_2",
        [VietnameseSubject.NANG_KHIEU_AM_NHAC_1]: "NANG_KHIEU_AM_NHAC_1",
        [VietnameseSubject.NANG_KHIEU_AM_NHAC_2]: "NANG_KHIEU_AM_NHAC_2",
        [VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI]: "NANG_KHIEU_ANH_BAO_CHI",
        [VietnameseSubject.NANG_KHIEU_BAO_CHI]: "NANG_KHIEU_BAO_CHI",
        [VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT]:
            "NANG_KHIEU_BIEU_DIEN_NGHE_THUAT",
        [VietnameseSubject.NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT]:
            "NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT",
        [VietnameseSubject.NANG_KHIEU_MAM_NON]: "NANG_KHIEU_MAM_NON",
        [VietnameseSubject.NANG_KHIEU_MAM_NON_1]: "NANG_KHIEU_MAM_NON_1",
        [VietnameseSubject.NANG_KHIEU_MAM_NON_2]: "NANG_KHIEU_MAM_NON_2",
        [VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH]:
            "NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH",
        [VietnameseSubject.NANG_KHIEU_SKDA_1]: "NANG_KHIEU_SKDA_1",
        [VietnameseSubject.NANG_KHIEU_SKDA_2]: "NANG_KHIEU_SKDA_2",
        [VietnameseSubject.NANG_KHIEU_TDTT]: "NANG_KHIEU_TDTT",
        [VietnameseSubject.NANG_KHIEU_THUYET_TRINH]: "NANG_KHIEU_THUYET_TRINH",
        [VietnameseSubject.NANG_KHIEU_VE_1]: "NANG_KHIEU_VE_1",
        [VietnameseSubject.NANG_KHIEU_VE_2]: "NANG_KHIEU_VE_2",
        [VietnameseSubject.PHAT_TRIEN_CHU_DE_PHO_THO]:
            "PHAT_TRIEN_CHU_DE_PHO_THO",
        [VietnameseSubject.TU_DUY_GIAI_QUYET_NGU_VAN_DE]:
            "TU_DUY_GIAI_QUYET_NGU_VAN_DE",
        [VietnameseSubject.VE_HINH_HOA]: "VE_HINH_HOA",
        [VietnameseSubject.VE_HINH_HOA_MY_THUAT]: "VE_HINH_HOA_MY_THUAT",
        [VietnameseSubject.VE_MY_THUAT]: "VE_MY_THUAT",
        [VietnameseSubject.VE_NANG_KHIEU]: "VE_NANG_KHIEU",
        [VietnameseSubject.VE_TRANG_TRI]: "VE_TRANG_TRI",
        [VietnameseSubject.VE_TRANG_TRI_MAU]: "VE_TRANG_TRI_MAU",
        [VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN]:
            "XAY_DUNG_KICH_BAN_SU_KIEN",
    };

    /**
     * Mapping from TranscriptSubject enum to TranscriptSubjectScore properties
     * All foreign languages map to "anh" as there's only one language field
     */
    private readonly TRANSCRIPT_SUBJECT_MAPPING: Record<
        TranscriptSubject,
        keyof TranscriptSubjectScore
    > = {
        [TranscriptSubject.CONG_NGHE]: "cong_nghe",
        [TranscriptSubject.DIA_LY]: "dia",
        [TranscriptSubject.GDKTPL]: "gdkt_pl",
        [TranscriptSubject.HOA_HOC]: "hoa",
        [TranscriptSubject.LICH_SU]: "su",
        [TranscriptSubject.NGU_VAN]: "van",
        [TranscriptSubject.SINH_HOC]: "sinh",
        [TranscriptSubject.TIENG_ANH]: "anh",
        [TranscriptSubject.TIENG_DUC]: "tieng_duc",
        [TranscriptSubject.TIENG_HAN]: "tieng_han",
        [TranscriptSubject.TIENG_NGA]: "tieng_nga",
        [TranscriptSubject.TIENG_NHAT]: "tieng_nhat",
        [TranscriptSubject.TIENG_PHAP]: "tieng_phap",
        [TranscriptSubject.TIENG_TRUNG]: "tieng_trung",
        [TranscriptSubject.TIN_HOC]: "tin",
        [TranscriptSubject.TOAN]: "toan",
        [TranscriptSubject.VAT_LY]: "ly",
    };

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.PredictionModelServiceConfig)
        private readonly config: PredictionModelServiceConfig,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.ConcurrencyUtil)
        private readonly concurrencyUtil: ConcurrencyUtil,
        @inject(TYPES.PredictionUtil)
        private readonly predictionUtil: PredictionUtil,
    ) {}

    public async executeL3PredictionsWithRetry(
        userInputs: UserInputL3[],
    ): Promise<L3PredictResult[]> {
        const allResults: L3PredictResult[] = [];

        // Group inputs by major group for organized processing
        const groupedInputs = userInputs.reduce((acc, input) => {
            const group = acc.get(input.nhom_nganh) ?? [];
            group.push(input);
            acc.set(input.nhom_nganh, group);
            return acc;
        }, new Map<number, UserInputL3[]>());

        this.logger.info("L3 Prediction: Input summary", {
            majorGroups: Array.from(groupedInputs.keys()),
            majorGroupsCount: groupedInputs.size,
            totalInputs: userInputs.length,
        });

        // Create concurrency limiter
        const batchLimit = pLimit(this.config.SERVER_BATCH_CONCURRENCY);

        // Process each major group
        const results = await Promise.allSettled(
            Array.from(groupedInputs.entries()).map(
                ([majorGroup, inputs], index) =>
                    batchLimit(async () => {
                        return await this._processL3MajorGroup(
                            majorGroup,
                            inputs,
                            index,
                        );
                    }),
            ),
        );

        // Collect results
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const majorGroup = Array.from(groupedInputs.keys())[i];

            if (result.status === "fulfilled") {
                allResults.push(...result.value);
                this.logger.info(
                    `L3 Prediction: Major group ${majorGroup.toString()} completed successfully`,
                    {
                        resultsCount: result.value.length,
                    },
                );
            } else {
                this.logger.error(
                    `L3 Prediction: Major group ${majorGroup.toString()} failed completely`,
                    {
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : String(result.reason),
                    },
                );
            }
        }

        this.logger.info("L3 Prediction: All groups processing completed", {
            failedGroups: results.filter((r) => r.status === "rejected").length,
            successfulGroups: results.filter((r) => r.status === "fulfilled")
                .length,
            totalResults: allResults.length,
        });

        const dedupedResults = this.deduplicateL3PredictResults(allResults);

        return dedupedResults;
    }

    public async getL3PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L3PredictResult[]> {
        // Fetch student without file relations first
        const student = await this.studentRepository.findOne({
            relations: [
                "awards",
                "certifications",
                "nationalExams",
                "talentExams",
                "aptitudeExams",
                "transcripts",
                "transcripts.transcriptSubjects",
            ],
            transaction: true,
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

        // Fetch files with OCR results separately - this is now a much simpler query
        const fileEntities: FileEntity[] = await this.fileRepository.find({
            relations: ["ocrResult"],
            transaction: true,
            where: {
                status: FileStatus.ACTIVE,
                studentId: studentId,
            },
        });

        // Attach files to student object for downstream processing
        student.files = fileEntities;

        // Generate user inputs for all combinations
        const userInputs = await this.generateL3UserInputCombinations(
            student,
            fileEntities,
        );

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for L3 prediction",
            );
        }

        for (const userInput of userInputs) {
            const errors = await validate(userInput);
            if (errors.length > 0) {
                const validationErrors = formatValidationErrors(errors);
                throw new ValidationException(
                    validationErrors,
                    "Invalid L3 user input",
                );
            }
        }

        this.logger.info("L3 Prediction: Starting predictions", {
            inputCount: userInputs.length,
            studentId: studentId,
        });

        // Execute predictions with retry logic
        const results = await this.executeL3PredictionsWithRetry(userInputs);

        // Calculate statistics from nested structure
        const totalPredictions = results.reduce((sum, result) => {
            return (
                sum +
                Object.values(result.result).reduce((innerSum, predictions) => {
                    return innerSum + predictions.length;
                }, 0)
            );
        }, 0);

        const uniqueUniversities = new Set<string>();
        const uniqueMajorGroups = new Set<number>();
        const uniqueMajorCodes = new Set<string>();

        results.forEach((result) => {
            Object.entries(result.result).forEach(
                ([universityCode, predictions]) => {
                    uniqueUniversities.add(universityCode);
                    predictions.forEach((prediction) => {
                        uniqueMajorGroups.add(prediction.major_group);
                        uniqueMajorCodes.add(prediction.major_code);
                    });
                },
            );
        });

        this.logger.info("L3 Prediction: Results summary", {
            totalPredictions: totalPredictions,
            totalResults: results.length,
            uniqueMajorCodes: uniqueMajorCodes.size,
            uniqueMajorGroups: uniqueMajorGroups.size,
            uniqueUniversities: uniqueUniversities.size,
        });

        return results;
    }

    public async predictMajorsL3(
        userInput: UserInputL3,
    ): Promise<L3PredictResult> {
        const response = await this.httpClient.post<L3PredictResult>(
            `/calculate/l3`,
            userInput,
        );

        const validatedResult = await this.validateL3PredictResponse(
            response.data,
        );

        this.logger.info("L3 Prediction: Completed", {
            majorGroup: userInput.nhom_nganh,
            resultsCount: Object.keys(validatedResult.result).length,
        });

        return validatedResult;
    }

    public async predictMajorsL3Batch(
        userInputs: UserInputL3[],
    ): Promise<L3PredictResult[]> {
        const response = await this.httpClient.post<L3PredictResult[]>(
            `/calculate/l3/batch`,
            userInputs,
        );

        // Validate each result in the array
        const validatedResults: L3PredictResult[] = [];
        for (const data of response.data) {
            const validatedResult = await this.validateL3PredictResponse(data);
            validatedResults.push(validatedResult);
        }

        this.logger.info("L3 Prediction Batch: Completed", {
            inputCount: userInputs.length,
            resultCount: validatedResults.length,
        });

        return validatedResults;
    }

    private async _performL3BatchPrediction(
        inputsForGroup: UserInputL3[],
        majorGroup: number,
    ): Promise<{
        failedInputs: UserInputL3[];
        successfulResults: L3PredictResult[];
    }> {
        const successfulResults: L3PredictResult[] = [];
        const failedInputs: UserInputL3[] = [];

        try {
            this.logger.info(
                `L3 Prediction: Starting batch prediction for major group ${majorGroup.toString()}`,
                {
                    inputCount: inputsForGroup.length,
                },
            );

            const batchResults =
                await this.predictMajorsL3Batch(inputsForGroup);
            successfulResults.push(...batchResults);

            this.logger.info(
                `L3 Prediction: Batch processing for major group ${majorGroup.toString()} completed successfully`,
                {
                    resultCount: batchResults.length,
                    successful: inputsForGroup.length,
                    total: inputsForGroup.length,
                },
            );
        } catch (error: unknown) {
            // Log detailed error information for AxiosError
            if (isAxiosError(error)) {
                const axiosError = error as AxiosError;
                const status = axiosError.response?.status;

                this.logger.error(
                    "L3 Prediction: Batch prediction API error details",
                    {
                        inputCount: inputsForGroup.length,
                        majorGroup,
                        requestMethod: axiosError.config?.method,
                        requestUrl: axiosError.config?.url,
                        responseData: axiosError.response?.data,
                        sampleInput: inputsForGroup[0], // Log first input as sample
                        status: status,
                        statusText: axiosError.response?.statusText,
                    },
                );
            } else {
                this.logger.warn(
                    "L3 Prediction: Batch prediction failed for major group, falling back to individual predictions",
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        inputCount: inputsForGroup.length,
                        majorGroup,
                    },
                );
            }

            await new Promise((resolve) =>
                setTimeout(resolve, this.config.SERVICE_RETRY_BASE_DELAY_MS),
            );

            const limit = pLimit(this.config.SERVICE_PREDICTION_CONCURRENCY);
            const batchResults = await Promise.allSettled(
                inputsForGroup.map((userInput, index) =>
                    limit(async () => {
                        if (index > 0) {
                            await new Promise((resolve) =>
                                setTimeout(
                                    resolve,
                                    this.config.SERVICE_REQUEST_DELAY_MS,
                                ),
                            );
                        }
                        return await this.predictMajorsL3(userInput);
                    }),
                ),
            );

            for (let i = 0; i < batchResults.length; i++) {
                const result = batchResults[i];
                if (result.status === "fulfilled") {
                    successfulResults.push(result.value);
                } else {
                    // Log error details for failed individual predictions
                    const error: unknown = result.reason;
                    if (isAxiosError(error)) {
                        const axiosError = error as AxiosError;
                        this.logger.error(
                            `L3 Prediction: Individual prediction failed with API error`,
                            {
                                inputIndex: i,
                                majorGroup,
                                responseData: axiosError.response?.data,
                                status: axiosError.response?.status,
                                userInput: inputsForGroup[i],
                            },
                        );
                    }
                    failedInputs.push(inputsForGroup[i]);
                }
            }

            this.logger.info(
                `L3 Prediction: Fallback processing for major group ${majorGroup.toString()} completed`,
                {
                    failed: failedInputs.length,
                    successful: successfulResults.length,
                    total: inputsForGroup.length,
                },
            );
        }

        return { failedInputs, successfulResults };
    }

    private async _performL3SequentialRetry(
        failedInputs: UserInputL3[],
        majorGroup: number,
    ): Promise<L3PredictResult[]> {
        const successfulRetryResults: L3PredictResult[] = [];
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
                        `L3 Prediction: Sequential retry attempt ${attempt.toString()} for input ${String(i + 1)}/${failedInputs.length.toString()} in major group ${majorGroup.toString()}`,
                    );
                    const result = await this.predictMajorsL3(userInput);
                    successfulRetryResults.push(result);
                    success = true;
                    retrySuccessCount++;
                    this.logger.info(
                        `L3 Prediction: Sequential retry successful for major group ${majorGroup.toString()}`,
                    );
                } catch (error: unknown) {
                    // Log detailed AxiosError information
                    if (isAxiosError(error)) {
                        const axiosError = error as AxiosError;
                        const status = axiosError.response?.status;

                        const logLevel =
                            attempt === this.config.SERVICE_MAX_RETRIES
                                ? "error"
                                : "warn";
                        const logMessage =
                            attempt === this.config.SERVICE_MAX_RETRIES
                                ? "L3 Prediction: Sequential retry failed after all attempts with API error"
                                : `L3 Prediction: Sequential retry attempt ${attempt.toString()} failed with API error`;

                        this.logger[logLevel](logMessage, {
                            attempt,
                            majorGroup,
                            responseData: axiosError.response?.data,
                            status: status,
                            userInput: userInput,
                        });
                    } else {
                        if (attempt === this.config.SERVICE_MAX_RETRIES) {
                            this.logger.error(
                                "L3 Prediction: Sequential retry failed after all attempts for major group",
                                {
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                    majorGroup,
                                },
                            );
                        } else {
                            this.logger.warn(
                                `L3 Prediction: Sequential retry attempt ${attempt.toString()} failed for major group, will retry`,
                                {
                                    error:
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                    majorGroup,
                                },
                            );
                        }
                    }

                    if (attempt < this.config.SERVICE_MAX_RETRIES) {
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
            `L3 Prediction: Sequential retry for major group ${majorGroup.toString()} completed`,
            {
                finallySuccessful: retrySuccessCount,
                stillFailed: failedInputs.length - retrySuccessCount,
                totalAttempted: failedInputs.length,
            },
        );

        return successfulRetryResults;
    }

    private async _processL3MajorGroup(
        majorGroup: number,
        inputsForGroup: UserInputL3[],
        groupIndex: number,
    ): Promise<L3PredictResult[]> {
        const startTime = Date.now();

        // Add small delay between groups to avoid overwhelming the server
        if (groupIndex > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.config.SERVICE_L2_CHUNK_DELAY_MS),
            );
        }

        const { failedInputs, successfulResults } =
            await this._performL3BatchPrediction(inputsForGroup, majorGroup);

        let retryResults: L3PredictResult[] = [];
        if (failedInputs.length > 0) {
            retryResults = await this._performL3SequentialRetry(
                failedInputs,
                majorGroup,
            );
        }

        const duration = Date.now() - startTime;
        const totalResults = successfulResults.length + retryResults.length;

        this.logger.info(
            `L3 Prediction: Major group ${majorGroup.toString()} completed`,
            {
                duration: `${duration.toString()}ms`,
                failedInputs: failedInputs.length,
                throughput: `${(totalResults / (duration / 1000)).toFixed(2)} predictions/sec`,
                totalResults,
            },
        );

        return [...successfulResults, ...retryResults];
    }

    /**
     * Aggregate OCR scores by grade and semester, then average per subject
     */
    private aggregateScoresByGradeAndSemester(
        fileEntities: FileEntity[],
    ): Map<number, Map<string, { semester1?: number; semester2?: number }>> {
        // Map structure: grade -> subject -> { semester1, semester2 }
        const scoresByGrade = new Map<
            number,
            Map<string, { semester1?: number; semester2?: number }>
        >();

        fileEntities.forEach((fileEntity) => {
            const grade = this.extractGradeFromFile(fileEntity);
            const semester = this.extractSemesterFromFile(fileEntity);

            if (!grade || !semester) return;

            const ocrResultEntity = fileEntity.ocrResult;
            if (!ocrResultEntity?.scores) return;

            let gradeMap = scoresByGrade.get(grade);
            if (!gradeMap) {
                gradeMap = new Map();
                scoresByGrade.set(grade, gradeMap);
            }

            // Process each subject score from OCR
            ocrResultEntity.scores.forEach((ocrScore) => {
                // Check if this subject is a valid transcript subject
                if (!Object.values(TranscriptSubject).includes(ocrScore.name)) {
                    return;
                }

                let subjectScores = gradeMap.get(ocrScore.name);

                if (!subjectScores) {
                    subjectScores = {};
                    gradeMap.set(ocrScore.name, subjectScores);
                }

                // Store semester score
                if (semester === 1) {
                    subjectScores.semester1 = ocrScore.score;
                } else if (semester === 2) {
                    subjectScores.semester2 = ocrScore.score;
                }
            });
        });

        return scoresByGrade;
    }

    /**
     * Assign mapped scores to TranscriptSubjectScore
     * @param subjectScoresMap Map of subject to score
     * @returns Populated TranscriptSubjectScore instance
     */
    private assignScoresToTranscriptSubjectScore(
        subjectScoresMap: Map<TranscriptSubject, number>,
    ): TranscriptSubjectScore {
        // Initialize with default values for all required fields
        const scoreData: Record<keyof TranscriptSubjectScore, number> = {
            anh: 0,
            cong_nghe: 0,
            dia: 0,
            gdkt_pl: 0,
            hoa: 0,
            ly: 0,
            sinh: 0,
            su: 0,
            tieng_duc: 0,
            tieng_han: 0,
            tieng_nga: 0,
            tieng_nhat: 0,
            tieng_phap: 0,
            tieng_trung: 0,
            tin: 0,
            toan: 0,
            van: 0,
        };

        // Override with actual scores where available
        subjectScoresMap.forEach((score, subject) => {
            const propertyName = this.TRANSCRIPT_SUBJECT_MAPPING[subject];

            // Round to 2 decimal places and ensure it's between 0-10
            const normalizedScore = Math.min(
                Math.max(Number(score.toFixed(2)), 0),
                10,
            );
            scoreData[propertyName] = normalizedScore;
        });

        return plainToInstance(TranscriptSubjectScore, scoreData);
    }

    /**
     * Build transcript record with semester averaging
     */
    private buildTranscriptRecordFromFiles(
        fileEntities: FileEntity[],
    ): TranscriptRecord {
        const transcriptRecord = new TranscriptRecord();

        // Group files by grade first
        const filesByGrade = new Map<number, FileEntity[]>();

        fileEntities.forEach((file) => {
            const grade = this.extractGradeFromFile(file);
            if (!grade) return;

            const gradeFiles = filesByGrade.get(grade) ?? [];
            gradeFiles.push(file);
            filesByGrade.set(grade, gradeFiles);
        });

        this.logger.debug(
            "L3 Prediction: Processing file-based transcript data",
            {
                fileCount: fileEntities.length,
                grades: Array.from(filesByGrade.keys()),
            },
        );

        // Validate we have all 3 grades before processing
        const hasAllGrades =
            filesByGrade.has(10) &&
            filesByGrade.has(11) &&
            filesByGrade.has(12);

        if (!hasAllGrades) {
            this.logger.warn(
                "L3 Prediction: Missing required grades in files",
                {
                    hasGrade10: filesByGrade.has(10),
                    hasGrade11: filesByGrade.has(11),
                    hasGrade12: filesByGrade.has(12),
                    presentGrades: Array.from(filesByGrade.keys()),
                },
            );
            // Return empty record - will fail validation later
            return transcriptRecord;
        }

        // Check consistency - either all semester-based or all full-year
        const allHaveSemesters = Array.from(filesByGrade.values()).every(
            (gradeFiles) =>
                gradeFiles.every(
                    (f) => this.extractSemesterFromFile(f) != null,
                ),
        );

        const allHaveNoSemesters = Array.from(filesByGrade.values()).every(
            (gradeFiles) =>
                gradeFiles.every(
                    (f) => this.extractSemesterFromFile(f) == null,
                ),
        );

        if (!allHaveSemesters && !allHaveNoSemesters) {
            this.logger.warn(
                "L3 Prediction: Inconsistent file types - mixing semester and full-year data",
                {
                    gradeDetails: Array.from(filesByGrade.entries()).map(
                        ([grade, files]) => ({
                            fileCount: files.length,
                            grade,
                            hasSemester: files.some(
                                (f) => this.extractSemesterFromFile(f) != null,
                            ),
                        }),
                    ),
                },
            );
            // Return empty record - will fail validation later
            return transcriptRecord;
        }

        // Determine if this is semester-level data
        const hasSemesterData = fileEntities.length === 6 && allHaveSemesters;

        if (hasSemesterData) {
            this.logger.debug(
                "L3 Prediction: Processing semester-level transcript data from files",
                {
                    fileCount: fileEntities.length,
                },
            );

            const scoresByGrade =
                this.aggregateScoresByGradeAndSemester(fileEntities);

            // Process each grade
            for (const [grade, subjectMap] of scoresByGrade.entries()) {
                // Convert subject map to averaged scores
                const subjectScoresMap = new Map<TranscriptSubject, number>();

                for (const [subject, semesterScores] of subjectMap.entries()) {
                    const averageScore =
                        this.calculateAverageScore(semesterScores);
                    subjectScoresMap.set(
                        subject as TranscriptSubject,
                        averageScore,
                    );
                }

                // Assign to appropriate grade
                const transcriptSubjectScore =
                    this.assignScoresToTranscriptSubjectScore(subjectScoresMap);

                switch (grade) {
                    case 10:
                        transcriptRecord.grade_10 = transcriptSubjectScore;
                        break;
                    case 11:
                        transcriptRecord.grade_11 = transcriptSubjectScore;
                        break;
                    case 12:
                        transcriptRecord.grade_12 = transcriptSubjectScore;
                        break;
                }
            }
        } else {
            // Original logic for full-year transcripts
            this.logger.debug(
                "L3 Prediction: Processing full-year transcript data from files",
                {
                    fileCount: fileEntities.length,
                },
            );

            fileEntities.forEach((fileEntity) => {
                const grade = this.extractGradeFromFile(fileEntity);

                if (!grade) return;

                const ocrResultEntity = fileEntity.ocrResult;
                if (!ocrResultEntity?.scores) return;

                const subjectScoresMap = this.mapOcrScoresToTranscriptSubjects(
                    ocrResultEntity.scores,
                );

                const transcriptSubjectScore =
                    this.assignScoresToTranscriptSubjectScore(subjectScoresMap);

                switch (grade) {
                    case 10:
                        transcriptRecord.grade_10 = transcriptSubjectScore;
                        break;
                    case 11:
                        transcriptRecord.grade_11 = transcriptSubjectScore;
                        break;
                    case 12:
                        transcriptRecord.grade_12 = transcriptSubjectScore;
                        break;
                }
            });
        }

        return transcriptRecord;
    }

    /**
     * Build transcript record from TranscriptEntity array
     */
    private buildTranscriptRecordFromTranscripts(
        transcripts: TranscriptEntity[],
    ): TranscriptRecord {
        const transcriptRecord = new TranscriptRecord();

        // Group transcripts by grade
        const transcriptsByGrade = new Map<number, TranscriptEntity[]>();

        transcripts.forEach((transcript) => {
            if (!transcript.grade) return;

            const gradeTranscripts =
                transcriptsByGrade.get(transcript.grade) ?? [];
            gradeTranscripts.push(transcript);
            transcriptsByGrade.set(transcript.grade, gradeTranscripts);
        });

        this.logger.debug("L3 Prediction: Processing transcript entities", {
            grades: Array.from(transcriptsByGrade.keys()),
            transcriptCount: transcripts.length,
        });

        // Validate we have all 3 grades before processing
        const hasAllGrades =
            transcriptsByGrade.has(10) &&
            transcriptsByGrade.has(11) &&
            transcriptsByGrade.has(12);

        if (!hasAllGrades) {
            this.logger.warn("L3 Prediction: Missing required grades", {
                hasGrade10: transcriptsByGrade.has(10),
                hasGrade11: transcriptsByGrade.has(11),
                hasGrade12: transcriptsByGrade.has(12),
                presentGrades: Array.from(transcriptsByGrade.keys()),
            });
            // Return empty record - will fail validation later
            return transcriptRecord;
        }

        // Check consistency - either all semester-based or all full-year
        const allHaveSemesters = Array.from(transcriptsByGrade.values()).every(
            (gradeTranscripts) =>
                gradeTranscripts.every((t) => t.semester != null),
        );

        const allHaveNoSemesters = Array.from(
            transcriptsByGrade.values(),
        ).every((gradeTranscripts) =>
            gradeTranscripts.every((t) => t.semester == null),
        );

        if (!allHaveSemesters && !allHaveNoSemesters) {
            this.logger.warn(
                "L3 Prediction: Inconsistent transcript types - mixing semester and full-year data",
                {
                    gradeDetails: Array.from(transcriptsByGrade.entries()).map(
                        ([grade, transcripts]) => ({
                            grade,
                            hasSemester: transcripts.some(
                                (t) => t.semester != null,
                            ),
                            transcriptCount: transcripts.length,
                        }),
                    ),
                },
            );
            // Return empty record - will fail validation later
            return transcriptRecord;
        }

        // Process each grade
        for (const [grade, gradeTranscripts] of transcriptsByGrade.entries()) {
            // Check if this is semester-level data:
            // - Must have exactly 2 transcripts for this grade
            // - Both must have semester field populated (not null)
            // - They must be different semesters (1 and 2)
            const hasSemesterData =
                gradeTranscripts.length === 2 &&
                gradeTranscripts.every((t) => t.semester != null) &&
                gradeTranscripts[0].semester !== gradeTranscripts[1].semester;

            // Check if this is valid full-year data
            const isFullYearData =
                gradeTranscripts.length === 1 &&
                gradeTranscripts[0].semester == null;

            const subjectScoresMap = new Map<TranscriptSubject, number>();

            if (hasSemesterData) {
                // Average semester scores for each subject
                this.logger.debug(
                    `L3 Prediction: Processing semester-level data for grade ${grade.toString()}`,
                    {
                        semesterCount: gradeTranscripts.length,
                    },
                );

                const subjectSemesterScores = new Map<
                    TranscriptSubject,
                    { semester1?: number; semester2?: number }
                >();

                gradeTranscripts.forEach((transcript) => {
                    if (!transcript.transcriptSubjects) return;

                    transcript.transcriptSubjects.forEach((subjectEntity) => {
                        const transcriptSubject = subjectEntity.subject;

                        let semesterScores =
                            subjectSemesterScores.get(transcriptSubject);

                        if (!semesterScores) {
                            semesterScores = {};
                            subjectSemesterScores.set(
                                transcriptSubject,
                                semesterScores,
                            );
                        }

                        if (transcript.semester === 1) {
                            semesterScores.semester1 = subjectEntity.score;
                        } else if (transcript.semester === 2) {
                            semesterScores.semester2 = subjectEntity.score;
                        }
                    });
                });

                // Calculate averages
                for (const [
                    subject,
                    scores,
                ] of subjectSemesterScores.entries()) {
                    const averageScore = this.calculateAverageScore(scores);
                    subjectScoresMap.set(subject, averageScore);
                }
            } else if (isFullYearData) {
                // Full-year data: semester should be null and grade should be present
                // Use scores directly from the transcript
                this.logger.debug(
                    `L3 Prediction: Processing full-year data for grade ${grade.toString()}`,
                );

                const transcript = gradeTranscripts[0];
                if (!transcript.transcriptSubjects) continue;

                transcript.transcriptSubjects.forEach((subjectEntity) => {
                    subjectScoresMap.set(
                        subjectEntity.subject,
                        subjectEntity.score,
                    );
                });
            } else {
                // This shouldn't happen if top-level validation passed, but log it anyway
                this.logger.error(
                    `L3 Prediction: Invalid data for grade ${grade.toString()} despite passing validation`,
                    {
                        hasSemesterField: gradeTranscripts.some(
                            (t) => t.semester != null,
                        ),
                        transcriptCount: gradeTranscripts.length,
                    },
                );
                // Return empty record to trigger validation error
                return new TranscriptRecord();
            }

            // Assign to appropriate grade only if we have valid data
            if (subjectScoresMap.size > 0) {
                const transcriptSubjectScore =
                    this.assignScoresToTranscriptSubjectScore(subjectScoresMap);

                switch (grade) {
                    case 10:
                        transcriptRecord.grade_10 = transcriptSubjectScore;
                        break;
                    case 11:
                        transcriptRecord.grade_11 = transcriptSubjectScore;
                        break;
                    case 12:
                        transcriptRecord.grade_12 = transcriptSubjectScore;
                        break;
                }
            }
        }

        return transcriptRecord;
    }

    /**
     * Calculate average score from semester scores
     */
    private calculateAverageScore(scores: {
        semester1?: number;
        semester2?: number;
    }): number {
        // Fix: Cast the result to 'number[]' so TypeScript knows undefined values are removed
        const validScores = [scores.semester1, scores.semester2].filter(
            (score) => score !== undefined && !isNaN(score),
        ) as number[];

        if (validScores.length === 0) {
            return 0;
        }

        return (
            validScores.reduce((sum, score) => sum + score, 0) /
            validScores.length
        );
    }

    private createBaseL3UserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL3,
        | "award_english"
        | "award_qg"
        | "dgnl"
        | "hoc_ba"
        | "int_cer"
        | "nang_khieu"
        | "nhom_nganh"
        | "thpt"
    > {
        return {
            cong_lap: this.predictionUtil.mapUniTypeToBinaryFlag(
                studentInfoDTO.uniType,
            ),
            hoc_phi: studentInfoDTO.maxBudget,
            priority_object: 0,
            priority_region: 0,
            tinh_tp: studentInfoDTO.province,
        };
    }

    /**
     * Create a stable signature for an L3PredictResult
     * Uses only ma_nganh and university code to create a compact signature
     */
    private createResultSignature(result: L3PredictResult): string {
        const majors: string[] = [];

        // Extract all ma_nganh values from all universities
        for (const [university, predictions] of Object.entries(result.result)) {
            predictions.forEach((pred) => {
                majors.push(`${university}:${pred.major_code}`);
            });
        }

        // Sort to ensure consistent ordering
        majors.sort();
        return majors.join("|");
    }

    /**
     * Deduplicate L3PredictResult array by comparing the result objects
     * Optimized for comparing complex nested structures
     * @param results Array of L3PredictResult to deduplicate
     * @returns Deduplicated array maintaining order of first occurrence
     */
    private deduplicateL3PredictResults(
        results: L3PredictResult[],
    ): L3PredictResult[] {
        // Filter out results with no predictions first
        const nonEmptyResults = results.filter((result) => {
            return Object.values(result.result).some(
                (predictions) => predictions.length > 0,
            );
        });

        const seen = new Set<string>();
        const deduplicated: L3PredictResult[] = [];

        for (const result of nonEmptyResults) {
            // Create a stable signature by sorting and stringifying
            const signature = this.createResultSignature(result);

            if (!seen.has(signature)) {
                seen.add(signature);
                deduplicated.push(result);
            }
        }

        return deduplicated;
    }

    /**
     * Extract grade number (10, 11, 12) from file entity
     */
    private extractGradeFromFile(fileEntity: FileEntity): null | number {
        // Check description first
        if (fileEntity.description) {
            const match = /\b(10|11|12)\b/.exec(fileEntity.description);
            if (match) return parseInt(match[1]);
        }

        // Check tags
        if (fileEntity.tags?.length) {
            for (const tag of fileEntity.tags) {
                if (["10", "11", "12"].includes(tag)) {
                    return parseInt(tag);
                }
            }
        }

        // Check fileName
        if (fileEntity.fileName) {
            const match = /\b(10|11|12)\b/.exec(fileEntity.fileName);
            if (match) return parseInt(match[1]);
        }

        // Check originalFileName
        if (fileEntity.originalFileName) {
            const match = /\b(10|11|12)\b/.exec(fileEntity.originalFileName);
            if (match) return parseInt(match[1]);
        }

        return null;
    }

    /**
     * Extract semester number (1 or 2) from file entity
     */
    private extractSemesterFromFile(fileEntity: FileEntity): null | number {
        // Check description first
        if (fileEntity.description) {
            const match = /semester\s*([1-2])/i.exec(fileEntity.description);
            if (match) return parseInt(match[1]);
        }

        // Check tags
        if (fileEntity.tags) {
            const tagsArray = fileEntity.getTagsArray();
            for (const tag of tagsArray) {
                if (["1", "sem-1", "semester-1"].includes(tag.toLowerCase())) {
                    return 1;
                }
                if (["2", "sem-2", "semester-2"].includes(tag.toLowerCase())) {
                    return 2;
                }
            }
        }

        // Check fileName
        if (fileEntity.fileName) {
            const match = /semester\s*([1-2])/i.exec(fileEntity.fileName);
            if (match) return parseInt(match[1]);
        }

        // Check originalFileName
        if (fileEntity.originalFileName) {
            const match = /semester\s*([1-2])/i.exec(
                fileEntity.originalFileName,
            );
            if (match) return parseInt(match[1]);
        }

        return null;
    }

    private async generateL3UserInputCombinations(
        studentEntity: StudentEntity,
        fileEntities: FileEntity[],
    ): Promise<UserInputL3[]> {
        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            studentEntity,
            { excludeExtraneousValues: true },
        );

        const errors = await validate(
            studentInfoDTO,
            DEFAULT_VALIDATOR_OPTIONS,
        );

        if (errors.length > 0) {
            const validationErrors = formatValidationErrors(errors);

            throw new ValidationException(
                validationErrors,
                "Invalid L3 Student Info DTO",
            );
        }

        // Get certifications and aptitude exams by type
        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");
        this.logger.debug(
            "L3 Prediction: CCNN Certifications: ",
            ccnnCertifications,
        );

        const ccqtCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCQT");
        this.logger.debug(
            "L3 Prediction: CCQT Certifications: ",
            ccqtCertifications,
        );

        const dgnlAptitudeExams: AptitudeExamDTO[] =
            studentInfoDTO.getAptitudeTestScoresByExamType("ĐGNL");
        this.logger.debug("L3 Prediction: ĐGNL Exams: ", dgnlAptitudeExams);

        // Create base template for user inputs
        const baseTemplate = this.createBaseL3UserInputTemplate(studentInfoDTO);
        this.logger.debug(
            "L3 Prediction: Base UserInputL3 Template: ",
            baseTemplate,
        );

        const thptScores: TNTHPTScores = new TNTHPTScores();
        const electiveSubjects: THPTSubjectScore[] = [];

        studentInfoDTO.nationalExams.forEach((nationalExam) => {
            const l3Subject = this.mapNationalExamSubjectToL3NationalSubject(
                nationalExam.name,
            );

            switch (nationalExam.name) {
                case VietnameseSubject.NGU_VAN:
                    thptScores.literature_score = plainToInstance(
                        THPTSubjectScore,
                        {
                            score: nationalExam.score,
                            subject_name: l3Subject,
                        },
                    );
                    break;
                case VietnameseSubject.TOAN:
                    thptScores.math_score = plainToInstance(THPTSubjectScore, {
                        score: nationalExam.score,
                        subject_name: l3Subject,
                    });
                    break;
                default:
                    // Collect remaining subjects as potential electives
                    electiveSubjects.push({
                        score: nationalExam.score,
                        subject_name: l3Subject,
                    });
                    break;
            }
        });

        // Assign the first 2 elective subjects to elective_1_score and elective_2_score
        if (electiveSubjects.length >= 2) {
            thptScores.elective_1_score = plainToInstance(THPTSubjectScore, {
                score: electiveSubjects[0].score,
                subject_name: electiveSubjects[0].subject_name,
            });

            thptScores.elective_2_score = plainToInstance(THPTSubjectScore, {
                score: electiveSubjects[1].score,
                subject_name: electiveSubjects[1].subject_name,
            });
        } else {
            throw new IllegalArgumentException(
                "THPTSubjectScore is required with 2 electives but no valid data is available",
            );
        }
        this.logger.debug("L3 Prediction: THPTSubjectScore", thptScores);

        // Priority 1: Check if transcripts with grade exist
        // Full-year: 3 transcripts (grades 10, 11, 12) with semester = null
        // Semester-based: 6 transcripts (3 grades × 2 semesters) with semester = 1 or 2
        let transcriptRecord: null | TranscriptRecord = null;

        if (studentEntity.transcripts && studentEntity.transcripts.length > 0) {
            const transcripts = studentEntity.transcripts;
            const hasGradeData = transcripts.every((t) => t.grade != null);

            if (hasGradeData) {
                // Check if it's semester-based (6 transcripts with semesters)
                const isSemesterBased =
                    transcripts.length === 6 &&
                    transcripts.every((t) => t.semester != null);

                // Check if it's full-year based (3 transcripts with semester = null)
                const isFullYear =
                    transcripts.length === 3 &&
                    transcripts.every((t) => t.semester == null);

                if (isSemesterBased || isFullYear) {
                    this.logger.debug(
                        `L3 Prediction: Using transcripts (${isSemesterBased ? "semester-based" : "full-year"})`,
                        {
                            transcriptCount: transcripts.length,
                        },
                    );
                    transcriptRecord =
                        this.buildTranscriptRecordFromTranscripts(transcripts);
                } else {
                    this.logger.warn(
                        "L3 Prediction: Invalid transcript configuration",
                        {
                            hasGrade: hasGradeData,
                            semesterData: transcripts.map((t) => ({
                                grade: t.grade,
                                semester: t.semester,
                            })),
                            transcriptCount: transcripts.length,
                        },
                    );
                }
            }
        }

        // Priority 2: Check if OCR results from files exist
        // Same logic: 3 files for full-year OR 6 files for semester-based
        if (!transcriptRecord && fileEntities.length > 0) {
            const hasOcrResults = fileEntities.every(
                (file) =>
                    file.ocrResult?.scores && file.ocrResult.scores.length > 0,
            );

            if (
                hasOcrResults &&
                (fileEntities.length === 3 || fileEntities.length === 6)
            ) {
                this.logger.debug(
                    "L3 Prediction: Using OCR results from files",
                    {
                        fileCount: fileEntities.length,
                    },
                );
                transcriptRecord =
                    this.buildTranscriptRecordFromFiles(fileEntities);
            }
        }

        // Priority 3: Check if manual transcripts exist (no ocrResult)
        if (!transcriptRecord && studentEntity.transcripts) {
            const manualTranscripts = studentEntity.transcripts.filter(
                (transcript) => !transcript.ocrResultId,
            );

            if (
                manualTranscripts.length === 3 ||
                manualTranscripts.length === 6
            ) {
                this.logger.debug("L3 Prediction: Using manual transcripts", {
                    manualTranscriptCount: manualTranscripts.length,
                });
                transcriptRecord =
                    this.buildTranscriptRecordFromTranscripts(
                        manualTranscripts,
                    );
            }
        }

        // If no transcript data available, throw error
        if (!transcriptRecord) {
            throw new IllegalArgumentException(
                "TranscriptRecord is required but no valid transcript data is available",
            );
        }

        this.logger.debug("L3 Prediction: Transcript record built", {
            hasGrade10: !!transcriptRecord.grade_10,
            hasGrade11: !!transcriptRecord.grade_11,
            hasGrade12: !!transcriptRecord.grade_12,
            transcriptRecord: transcriptRecord,
        });

        const awardQG: AwardQG[] = studentInfoDTO.awards
            ? this.mapAwardsToAwardQG(studentInfoDTO.awards)
            : [];
        this.logger.debug("L3 Prediction: AwardQG", awardQG);

        const nangKhieuScore: NangKhieuScore | undefined =
            this.mapTalentExamsToNangKhieu(studentInfoDTO.talentExams);
        this.logger.debug("L3 Prediction: NangKhieuScore", nangKhieuScore);

        // Map all possible combinations
        const awardEnglishOptions: AwardEnglish[] =
            ccnnCertifications.length > 0
                ? ccnnCertifications
                      .map((cert) =>
                          this.mapCCNNCertificationToAwardEnglish(cert),
                      )
                      .filter(
                          (award): award is AwardEnglish => award !== undefined,
                      )
                : [];

        this.logger.debug("L3 Prediction: AwardEnglish", awardEnglishOptions);

        const interCerOptions: InterCer[] =
            ccqtCertifications.length > 0
                ? ccqtCertifications
                      .map((cert) => this.mapCCQTCertificationToInterCer(cert))
                      .filter((cert): cert is InterCer => cert !== undefined)
                : [];
        this.logger.debug("L3 Prediction: InterCer", interCerOptions);

        const dgnlOptions: DGNL[] =
            dgnlAptitudeExams.length > 0
                ? dgnlAptitudeExams
                      .map((exam) => this.mapDGNLAptitudeExamToDGNL(exam))
                      .filter((dgnl): dgnl is DGNL => dgnl !== undefined)
                : [];
        this.logger.debug("L3 Prediction: DGNL", dgnlOptions);

        const majors: MajorGroup[] = studentInfoDTO.majors;
        const combinations: UserInputL3[] = [];

        // Generate all combinations
        for (const major of majors) {
            const majorCode = getCodeByVietnameseName(major);
            if (!majorCode) {
                this.logger.warn(
                    `L3 Prediction: Cannot find code for major: ${major}`,
                );
                continue;
            }

            // Create combinations for each present option
            const awardEnglishLoop =
                awardEnglishOptions.length > 0
                    ? awardEnglishOptions
                    : [undefined];
            const interCerLoop =
                interCerOptions.length > 0 ? interCerOptions : [undefined];
            const dgnlLoop = dgnlOptions.length > 0 ? dgnlOptions : [undefined];

            for (const awardEnglish of awardEnglishLoop) {
                for (const interCer of interCerLoop) {
                    for (const dgnl of dgnlLoop) {
                        const userInput: UserInputL3 = plainToInstance(
                            UserInputL3,
                            {
                                ...baseTemplate,
                                award_english: awardEnglish,
                                award_qg:
                                    awardQG.length > 0 ? awardQG : undefined,
                                dgnl: dgnl,
                                hoc_ba: transcriptRecord,
                                int_cer: interCer,
                                nang_khieu: nangKhieuScore,
                                nhom_nganh: majorCode,
                                thpt: thptScores,
                            },
                        );

                        combinations.push(userInput);
                    }
                }
            }
        }

        const uniqueInputs = new Map<string, UserInputL3>();
        for (const input of combinations) {
            const key = JSON.stringify(input);
            uniqueInputs.set(key, input);
        }

        const dedupedCombinations = Array.from(uniqueInputs.values());
        const duplicatesRemoved =
            combinations.length - dedupedCombinations.length;

        this.logger.debug("L3 Prediction: Generated combinations", {
            awardEnglishOptions: awardEnglishOptions.length,
            deduplicationRate:
                combinations.length > 0
                    ? `${((duplicatesRemoved / combinations.length) * 100).toFixed(2)}%`
                    : "0%",
            dgnlOptions: dgnlOptions.length,
            duplicatesRemoved,
            generatedCombinations: combinations.length,
            interCerOptions: interCerOptions.length,
            majors: majors.length,
            uniqueCombinations: dedupedCombinations.length,
        });

        return dedupedCombinations;
    }

    /**
     * Convert AwardDTO array to AwardQG array
     * @param awards Array of AwardDTO objects
     * @returns Array of AwardQG objects
     */
    private mapAwardsToAwardQG(awards: AwardDTO[]): AwardQG[] {
        return awards
            .map((award) => {
                const hsgSubject =
                    this.NATIONAL_EXCELLENT_TO_HSG_SUBJECT_MAPPING[
                        award.category
                    ];
                const level = this.RANK_TO_LEVEL_MAPPING[award.level];

                if (!level) {
                    return null;
                }

                return plainToInstance(AwardQG, {
                    level: level,
                    subject: hsgSubject,
                });
            })
            .filter((award) => award !== null);
    }

    /**
     * Map a single CCNN certification to AwardEnglish (CEFR level)
     * @param certification CertificationDTO object
     * @returns AwardEnglish instance or undefined if no CEFR
     */
    private mapCCNNCertificationToAwardEnglish(
        certification: CertificationDTO,
    ): AwardEnglish | undefined {
        if (!certification.cefr) {
            return undefined;
        }

        return plainToInstance(AwardEnglish, {
            level: certification.cefr,
        });
    }

    /**
     * Map a single CCQT certification to InterCer
     * @param certification CertificationDTO object
     * @returns InterCer instance or undefined if invalid
     */
    private mapCCQTCertificationToInterCer(
        certification: CertificationDTO,
    ): InterCer | undefined {
        // Type guard to ensure it's a CCQT type
        if (!isCCQTType(certification.examType)) {
            this.logger.warn(
                "L3 Prediction: Certification is not a CCQT type",
                {
                    examType: certification.examType,
                },
            );
            return undefined;
        }

        // Now TypeScript knows certification.examType is CCQTType
        const interCerName = this.mapCCQTTypeToInterCerEnum(
            certification.examType,
        );

        const score = certification.level;

        return plainToInstance(InterCer, {
            name: interCerName,
            score: score,
        });
    }

    private mapCCQTTypeToInterCerEnum(examType: CCQTType): InterCerEnum {
        switch (examType) {
            case ExamType.A_Level:
                return InterCerEnum.A_LEVEL;
            case ExamType.ACT:
                return InterCerEnum.ACT;
            case ExamType.Duolingo_English_Test:
                return InterCerEnum.DOULINGO_ENGLISH_TEST;
            case ExamType.IB:
                return InterCerEnum.IB;
            case ExamType.OSSD:
                return InterCerEnum.OSSD;
            case ExamType.PTE_Academic:
                return InterCerEnum.PTE_ACADEMIC;
            case ExamType.SAT:
                return InterCerEnum.SAT;
            default: {
                const _exhaustiveCheck: never = examType;
                throw new Error(
                    `Unsupported CCQT exam type: ${String(_exhaustiveCheck)}`,
                );
            }
        }
    }

    /**
     * Map a single DGNL aptitude exam (VNUHCM only) to DGNL scores.
     * @param aptitudeExam AptitudeExamDTO object (with nested vnuhcmComponents)
     * @returns DGNL instance or undefined if not VNUHCM or missing required scores
     */
    private mapDGNLAptitudeExamToDGNL(
        aptitudeExam: AptitudeExamDTO,
    ): DGNL | undefined {
        if (
            aptitudeExam.examType !== ExamType.VNUHCM ||
            !aptitudeExam.vnuhcmComponents
        ) {
            return undefined;
        }

        const components = aptitudeExam.vnuhcmComponents;

        return plainToInstance(DGNL, {
            language_score: components.languageScore,
            math_score: components.mathScore,
            science_logic: components.scienceLogic,
        });
    }

    private mapNationalExamSubjectToL3NationalSubject(
        nationalExamSubject: NationalExamSubject,
    ): L3NationalSubject {
        switch (nationalExamSubject) {
            case VietnameseSubject.CONG_NGHE_CONG_NGHIEP:
                return L3NationalSubject.CONG_NGHE_CONG_NGHIEP;
            case VietnameseSubject.CONG_NGHE_NONG_NGHIEP:
                return L3NationalSubject.CONG_NGHE_NONG_NGHIEP;
            case VietnameseSubject.DIA_LY:
                return L3NationalSubject.DIA_LY;
            case VietnameseSubject.GDKTPL:
                return L3NationalSubject.GDKTPL;
            case VietnameseSubject.HOA_HOC:
                return L3NationalSubject.HOA_HOC;
            case VietnameseSubject.LICH_SU:
                return L3NationalSubject.LICH_SU;
            case VietnameseSubject.NGU_VAN:
                return L3NationalSubject.NGU_VAN;
            case VietnameseSubject.SINH_HOC:
                return L3NationalSubject.SINH_HOC;
            case VietnameseSubject.TIENG_ANH:
                return L3NationalSubject.TIENG_ANH;
            case VietnameseSubject.TIENG_DUC:
                return L3NationalSubject.TIENG_DUC;
            case VietnameseSubject.TIENG_HAN:
                return L3NationalSubject.TIENG_HAN;
            case VietnameseSubject.TIENG_NGA:
                return L3NationalSubject.TIENG_NGA;
            case VietnameseSubject.TIENG_NHAT:
                return L3NationalSubject.TIENG_NHAT;
            case VietnameseSubject.TIENG_PHAP:
                return L3NationalSubject.TIENG_PHAP;
            case VietnameseSubject.TIENG_TRUNG:
                return L3NationalSubject.TIENG_TRUNG;
            case VietnameseSubject.TIN_HOC:
                return L3NationalSubject.TIN_HOC;
            case VietnameseSubject.TOAN:
                return L3NationalSubject.TOAN;
            case VietnameseSubject.VAT_LY:
                return L3NationalSubject.VAT_LY;
            default: {
                const _exhaustiveCheck: never = nationalExamSubject;
                throw new Error(
                    `Unsupported national exam subject: ${String(_exhaustiveCheck)}`,
                );
            }
        }
    }

    /**
     * Map OCR subject scores to TranscriptSubject enum
     */
    private mapOcrScoresToTranscriptSubjects(
        ocrScores: ISubjectScore[],
    ): Map<TranscriptSubject, number> {
        const scoreMap = new Map<TranscriptSubject, number>();

        ocrScores.forEach((score) => {
            const transcriptSubject = score.name;
            if (Object.values(TranscriptSubject).includes(transcriptSubject)) {
                scoreMap.set(transcriptSubject, score.score);
            }
        });

        return scoreMap;
    }
    /**
     * Map TalentExam array to NangKhieuScore
     * @param talentExams Array of TalentExam objects
     * @returns NangKhieuScore instance or undefined if no talent exams
     */
    private mapTalentExamsToNangKhieu(
        talentExams?: TalentExam[],
    ): NangKhieuScore | undefined {
        if (!talentExams || talentExams.length === 0) {
            return undefined;
        }

        const scoreData: Partial<Record<keyof NangKhieuScore, number>> = {};

        talentExams.forEach((exam) => {
            const propertyName = this.TALENT_SUBJECT_MAPPING[exam.name];
            scoreData[propertyName] = exam.score;
        });

        // Only return if we have at least one score mapped
        if (Object.keys(scoreData).length === 0) {
            return undefined;
        }

        return plainToInstance(NangKhieuScore, scoreData);
    }

    private async validateL3PredictResponse(
        data: unknown,
    ): Promise<L3PredictResult> {
        const instance = plainToInstance(L3PredictResult, data);
        const errors = await validate(instance);

        if (errors.length > 0) {
            const validationErrors = formatValidationErrors(errors);

            throw new ValidationException(
                validationErrors,
                "Invalid L3 prediction response",
            );
        }

        return instance;
    }
}
