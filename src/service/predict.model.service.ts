import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import {
    HTTPValidationError,
    L2PredictResult,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { OcrResultEntity, OcrStatus } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import { CCQTType } from "@/type/enum/exam.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { HttpException } from "@/type/exception/http.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { ILogger } from "@/type/interface/logger.js";
import { config } from "@/util/validate.env.js";

@injectable()
export class PredictModelService {
    private readonly httpClient: AxiosInstance;

    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.OcrResultRepository)
        private readonly ocrResultRepository: Repository<OcrResultEntity>,
    ) {
        const baseUrl = `http://${config.SERVICE_SERVER_HOSTNAME}:${config.SERVICE_SERVER_PORT.toString()}${config.SERVICE_SERVER_PATH}`;

        this.httpClient = axios.create({
            baseURL: baseUrl,
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
        });

        this.logger.info("PredictModelService initialized", { baseUrl });
    }

    async getPredictedResults(
        studentId: string,
        userId: string,
    ): Promise<L2PredictResult[]> {
        // TODO: implement query result by event
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications", "files"],
                where: { id: studentId, userId },
            });

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with id ${studentId} not found`,
            );
        }

        const ocrResultEntities: OcrResultEntity[] =
            await this.ocrResultRepository.find({
                where: {
                    processedBy: userId,
                    status: OcrStatus.COMPLETED,
                    studentId: student.id,
                },
            });

        if (ocrResultEntities.length !== 6) {
            throw new IllegalArgumentException(
                `Cannot predict majors due to ocr array length ${ocrResultEntities.length.toString()} is not 6`,
            );
        }

        // const studentInfoDTO: StudentInfoDTO = plainToInstance(
        //     StudentInfoDTO,
        //     student,
        // );
        // const subjectGroups = getSubjectGroup(
        //     studentInfoDTO.nationalExam.map((exam) => exam.name),
        // );

        // if (!subjectGroups) {
        //     throw new IllegalArgumentException(
        //         `Student subject group cannot be undefined`,
        //     );
        // }

        // const userInputs: UserInputL2[] = [];
        // const ccnnCertifications: CertificationRequest[] =
        //     studentInfoDTO.getCertificationsByExamType("CCNN");

        // const baseUserInput: Partial<UserInputL2> = {
        //     cong_lap: 1,
        //     diem_chuan: student.getTotalNationalExamScore(),
        //     hk10: 1,
        //     hk11: 1,
        //     hk12: 1,
        //     hl10: getRankByAcademicPerformance(
        //         findAndValidatePerformance(
        //             studentInfoDTO.academicPerformances,
        //             10,
        //         ),
        //     ),
        //     hl11: getRankByAcademicPerformance(
        //         findAndValidatePerformance(
        //             studentInfoDTO.academicPerformances,
        //             11,
        //         ),
        //     ),
        //     hl12: getRankByAcademicPerformance(
        //         findAndValidatePerformance(
        //             studentInfoDTO.academicPerformances,
        //             12,
        //         ),
        //     ),
        //     hoc_phi: studentInfoDTO.minBudget,
        //     tinh_tp: studentInfoDTO.province,
        //     to_hop_mon: subjectGroups,
        // };

        // if (student.hasValidNationalExamData()) {
        //     for (const cert of ccnnCertifications) {
        //         if (!cert.cefr || !cert.examType) {
        //             throw new IllegalArgumentException(
        //                 `Certification CEFR and type cannot be undefined`,
        //             );
        //         }

        //         if (cert.examType.value !== CCNNType.OTHER) {
        //             const tempUserInput: Partial<UserInputL2> = baseUserInput;
        //             tempUserInput.diem_ccta = cert.cefr;
        //             tempUserInput.ten_ccta = cert.examType.value;

        //             for (const major of studentInfoDTO.majors) {
        //                 const userInput: UserInputL2 = plainToInstance(
        //                     UserInputL2,
        //                     tempUserInput,
        //                 );
        //                 const majorCode = getCodeByVietnameseName(major);
        //                 userInput.nhom_nganh = majorCode
        //                     ? parseInt(majorCode, 10)
        //                     : (() => {
        //                           throw new IllegalArgumentException(
        //                               `Cannot find code for major: ${major}`,
        //                           );
        //                       })();
        //                 userInputs.push(userInput);
        //             }
        //         }
        //     }
        // }

        // if (studentInfoDTO.hasValidVSATScores()) {
        //     baseUserInput.diem_chuan = studentInfoDTO.getTotalVSATScore();

        //     for (const cert of ccnnCertifications) {
        //         if (!cert.cefr || !cert.examType) {
        //             throw new IllegalArgumentException(
        //                 `Certification CEFR and type cannot be undefined`,
        //             );
        //         }

        //         if (cert.examType.value !== CCNNType.OTHER) {
        //             const tempUserInput: Partial<UserInputL2> = baseUserInput;
        //             tempUserInput.diem_ccta = cert.cefr;
        //             tempUserInput.ten_ccta = cert.examType.value;

        //             for (const major of studentInfoDTO.majors) {
        //                 const userInput: UserInputL2 = plainToInstance(
        //                     UserInputL2,
        //                     tempUserInput,
        //                 );
        //                 const majorCode = getCodeByVietnameseName(major);
        //                 userInput.nhom_nganh = majorCode
        //                     ? parseInt(majorCode, 10)
        //                     : (() => {
        //                           throw new IllegalArgumentException(
        //                               `Cannot find code for major: ${major}`,
        //                           );
        //                       })();
        //                 userInputs.push(userInput);
        //             }
        //         }
        //     }
        // }

        // if (studentInfoDTO.hasAptitudeTestScore()) {
        //     const examType = studentInfoDTO.aptitudeTestScore?.examType;
        //     if (!(examType?.type === "DGNL") || !(examType.value in DGNLType)) {
        //         throw new IllegalArgumentException(
        //             `Invalid aptitude test score's exam type or/and value`,
        //         );
        //     }

        //     const examValue = student.aptitudeTestScore?.examType.value;
        //     if (examValue !== DGNLType.OTHER) {
        //         baseUserInput.diem_chuan =
        //             studentInfoDTO.getAptitudeTestScore();
        //         baseUserInput.to_hop_mon = examValue;

        //         for (const cert of ccnnCertifications) {
        //             if (!cert.cefr || !cert.examType) {
        //                 throw new IllegalArgumentException(
        //                     `Certification CEFR and type cannot be undefined`,
        //                 );
        //             }

        //             if (cert.examType.value !== CCNNType.OTHER) {
        //                 const tempUserInput: Partial<UserInputL2> =
        //                     baseUserInput;
        //                 tempUserInput.diem_ccta = cert.cefr;
        //                 tempUserInput.ten_ccta = cert.examType.value;

        //                 for (const major of studentInfoDTO.majors) {
        //                     const userInput: UserInputL2 = plainToInstance(
        //                         UserInputL2,
        //                         tempUserInput,
        //                     );
        //                     const majorCode = getCodeByVietnameseName(major);
        //                     userInput.nhom_nganh = majorCode
        //                         ? parseInt(majorCode, 10)
        //                         : (() => {
        //                               throw new IllegalArgumentException(
        //                                   `Cannot find code for major: ${major}`,
        //                               );
        //                           })();
        //                     userInputs.push(userInput);
        //                 }
        //             }
        //         }
        //     }
        // }

        // if (studentInfoDTO.hasCertificationExamType("CCQT")) {
        //     const ccqtCerts: CertificationRequest[] =
        //         studentInfoDTO.getCertificationsByExamType("CCQT");
        //     for (const cert of ccqtCerts) {
        //         if (cert.examType.value !== CCNNType.OTHER) {
        //             const tempUserInput: Partial<UserInputL2> = baseUserInput;
        //             tempUserInput.to_hop_mon = cert.examType.value;
        //         }
        //     }
        // }

        return [];
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.httpClient.get("/health", {
                timeout: 5000,
            });
            return response.status === 200;
        } catch {
            return false;
        }
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

    private getAndValidateScoreByCCQT(
        type: CCQTType,
        validateScore: string,
    ): number | undefined {
        const parsedScore = parseInt(validateScore, 10);
        if (isNaN(parsedScore) && type !== CCQTType["A-Level"])
            return undefined;

        switch (type) {
            case CCQTType.ACT: {
                return 1 <= parsedScore && parsedScore <= 36
                    ? parsedScore
                    : undefined;
            }
            case CCQTType.IB: {
                return 0 <= parsedScore && parsedScore <= 45
                    ? parsedScore
                    : undefined;
            }
            case CCQTType.OSSD: {
                return 0 <= parsedScore && parsedScore <= 100
                    ? parsedScore
                    : undefined;
            }
            case CCQTType.OTHER: {
                return undefined;
            }
            case CCQTType.SAT: {
                return 400 <= parsedScore && parsedScore <= 1600
                    ? parsedScore
                    : undefined;
            }
            case CCQTType["A-Level"]: {
                return this.getAndValidateScoreByCCQT_Type_A_Level(
                    validateScore,
                );
            }
            case CCQTType["Duolingo English Test"]: {
                return 10 <= parsedScore && parsedScore <= 160
                    ? parsedScore
                    : undefined;
            }
            case CCQTType["PTE Academic"]: {
                return 10 <= parsedScore && parsedScore <= 90
                    ? parsedScore
                    : undefined;
            }
            default:
                return undefined;
        }
    }

    private getAndValidateScoreByCCQT_Type_A_Level(
        level: string,
    ): number | undefined {
        switch (level) {
            case "A": {
                return 0.9;
            }
            case "A*": {
                return 1.0;
            }
            case "B": {
                return 0.8;
            }
            case "C": {
                return 0.7;
            }
            case "D": {
                return 0.6;
            }
            case "E": {
                return 0.5;
            }
            case "F": // Failed
            case "N": // Nearly passed
            case "O": // O-level equivalent
            case "U": {
                return 0.0;
            } // Ungraded
            default:
                return undefined;
        }
    }

    private handleError(error: unknown, userId?: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            // Handle validation errors (422)
            if (
                axiosError.response?.status === 422 &&
                this.isValidationError(axiosError.response.data)
            ) {
                const details = axiosError.response.data.detail
                    .map((err) => `${err.loc.join(".")}: ${err.msg}`)
                    .join("; ");

                this.logger.error("Validation error", { details, userId });
                throw new Error(`Validation failed: ${details}`);
            }

            // Handle other HTTP errors
            const status = axiosError.response?.status ?? "unknown";
            const message = axiosError.message;

            this.logger.error("API error", { message, status, userId });
            throw new Error(`API error (${status.toString()}): ${message}`);
        }

        // Handle non-HTTP errors
        const message =
            error instanceof Error ? error.message : "Unknown error";
        this.logger.error("Service error", { message, userId });
        throw new Error(`Service error: ${message}`);
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
            this.logger.info("Starting prediction");

            const response = await this.httpClient.post<L2PredictResult[]>(
                "/predict/l2",
                userInput,
            );
            const validatedResults = await this.validateResponse(response.data);

            this.logger.info("Prediction completed", {
                count: validatedResults.length,
            });

            return validatedResults;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            return this.handleError(error);
        }
    }

    private async validateResponse(data: unknown): Promise<L2PredictResult[]> {
        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }

        const results: L2PredictResult[] = [];

        for (const item of data) {
            const instance = plainToInstance(L2PredictResult, item);
            const errors = await validate(instance);

            if (errors.length === 0) {
                results.push(instance);
            }
        }

        if (results.length === 0) {
            throw new Error("No valid predictions received");
        }

        return results;
    }
}

// const findAndValidatePerformance = (
//     performances: AcademicPerformanceRequest[],
//     grade: number,
// ): AcademicPerformance => {
//     const performance = performances.find(
//         (ap) => ap.grade === grade,
//     )?.academicPerformance;
//     if (!performance) {
//         // This error should be thrown if data is unexpectedly missing,
//         // which helps maintain data integrity.
//         throw new IllegalArgumentException(
//             `Academic performance for grade ${grade.toString()} is missing.`,
//         );
//     }
//     return performance;
// };
