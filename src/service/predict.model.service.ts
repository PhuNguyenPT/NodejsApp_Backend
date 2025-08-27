import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import pLimit from "p-limit";
import { Repository } from "typeorm";

import {
    HTTPValidationError,
    L2PredictResult,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { AcademicPerformanceDTO } from "@/dto/student/academic.performance.dto.js";
import { CertificationDTO } from "@/dto/student/certification.dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { OcrResultEntity, OcrStatus } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import {
    AcademicPerformance,
    getRankByAcademicPerformance,
} from "@/type/enum/academic.performance.js";
import { CCNNType, CCQTType, DGNLType } from "@/type/enum/exam.js";
import { getCodeByVietnameseName } from "@/type/enum/major.js";
import {
    getAllPossibleSubjectGroups,
    VietnameseSubject,
} from "@/type/enum/subject.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { HttpException } from "@/type/exception/http.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { ILogger } from "@/type/interface/logger.js";
import { config } from "@/util/validate.env.js";

interface ExamScenario {
    diem_chuan: number;
    to_hop_mon: string;
    type: "ccqt" | "dgnl" | "national" | "vsat";
}
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
        // Data retrieval and validation
        const student = await this.fetchAndValidateStudent(studentId, userId);
        await this.fetchAndValidateOcrResults(userId, student.id);

        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            student,
        );
        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");

        // Create base template for user inputs
        const baseTemplate: Omit<
            UserInputL2,
            | "diem_ccta"
            | "diem_chuan"
            | "nhom_nganh"
            | "ten_ccta"
            | "to_hop_mon"
        > = this.createBaseUserInputTemplate(studentInfoDTO);

        // Collect all possible exam scenarios
        const examScenarios: ExamScenario[] = this.collectExamScenarios(
            student,
            studentInfoDTO,
        );

        // Generate user inputs for all combinations
        const userInputs: UserInputL2[] = this.generateUserInputCombinations(
            baseTemplate,
            examScenarios,
            ccnnCertifications,
            studentInfoDTO.majors,
        );

        if (userInputs.length === 0) {
            throw new IllegalArgumentException(
                "No valid user inputs could be generated for prediction",
            );
        }

        // Execute predictions for all inputs with p-limit concurrency control
        const limit = pLimit(3);

        const allResultsPromises = userInputs.map((userInput) =>
            limit(async () => {
                try {
                    return await this.predictMajors(userInput);
                } catch (error: unknown) {
                    this.logger.warn("Prediction failed", {
                        error: error instanceof Error ? error.message : error,
                        userInput,
                    });
                    return []; // Return empty array on failure
                }
            }),
        );

        const allResults: L2PredictResult[][] =
            await Promise.all(allResultsPromises);

        // Flatten the results
        const flatResults = allResults.flat();

        // Deduplicate by ma_xet_tuyen, keeping the highest score
        const deduplicatedResults = this.deduplicateByHighestScore(flatResults);

        this.logger.info("Prediction results summary", {
            duplicatesRemoved: flatResults.length - deduplicatedResults.length,
            totalResults: flatResults.length,
            uniqueResults: deduplicatedResults.length,
        });

        return deduplicatedResults;
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

    private collectExamScenarios(
        student: StudentEntity,
        studentInfoDTO: StudentInfoDTO,
    ): ExamScenario[] {
        const scenarios: ExamScenario[] = [];

        // Get all possible subject groups from national exam subjects
        const vietnameseSubjects: VietnameseSubject[] =
            studentInfoDTO.nationalExam.map((exam) => exam.name);
        const possibleSubjectGroups: string[] =
            getAllPossibleSubjectGroups(vietnameseSubjects);

        if (possibleSubjectGroups.length === 0) {
            this.logger.warn(
                "Cannot determine any valid subject groups from national exam data",
                { vietnameseSubjects },
            );
            return scenarios; // Return empty array if no valid subject groups
        }

        // National exam scenarios - create one for each possible subject group
        if (student.hasValidNationalExamData()) {
            for (const subjectGroup of possibleSubjectGroups) {
                scenarios.push({
                    diem_chuan: student.getTotalNationalExamScore(),
                    to_hop_mon: subjectGroup,
                    type: "national",
                });
            }
        }

        // VSAT scenarios - create one for each possible subject group
        if (studentInfoDTO.hasValidVSATScores()) {
            for (const subjectGroup of possibleSubjectGroups) {
                scenarios.push({
                    diem_chuan: studentInfoDTO.getTotalVSATScore(),
                    to_hop_mon: subjectGroup,
                    type: "vsat",
                });
            }
        }

        // DGNL scenario (these have their own specific group format)
        if (studentInfoDTO.hasAptitudeTestScore()) {
            const examType = studentInfoDTO.aptitudeTestScore?.examType;
            const aptitudeScore = studentInfoDTO.getAptitudeTestScore();

            if (
                examType?.type === "DGNL" &&
                examType.value in DGNLType &&
                examType.value !== DGNLType.OTHER &&
                aptitudeScore !== undefined
            ) {
                scenarios.push({
                    diem_chuan: aptitudeScore,
                    to_hop_mon: examType.value,
                    type: "dgnl",
                });
            }
        }

        // CCQT scenarios (these also have their own specific group format)
        if (studentInfoDTO.hasCertificationExamType("CCQT")) {
            const ccqtCerts =
                studentInfoDTO.getCertificationsByExamType("CCQT");
            for (const cert of ccqtCerts) {
                if (
                    cert.examType.type === "CCQT" &&
                    cert.examType.value !== CCQTType.OTHER
                ) {
                    const score = this.getAndValidateScoreByCCQT(
                        cert.examType.value,
                        cert.level,
                    );
                    if (score !== undefined) {
                        scenarios.push({
                            diem_chuan: score,
                            to_hop_mon: cert.examType.value, // CCQT uses its own format
                            type: "ccqt",
                        });
                    }
                }
            }
        }

        this.logger.info("Generated exam scenarios", {
            ccqtScenarios: scenarios.filter((s) => s.type === "ccqt").length,
            dgnlScenarios: scenarios.filter((s) => s.type === "dgnl").length,
            nationalScenarios: scenarios.filter((s) => s.type === "national")
                .length,
            possibleSubjectGroups,
            totalScenarios: scenarios.length,
            vsatScenarios: scenarios.filter((s) => s.type === "vsat").length,
        });

        return scenarios;
    }

    private createBaseUserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL2,
        "diem_ccta" | "diem_chuan" | "nhom_nganh" | "ten_ccta" | "to_hop_mon"
    > {
        return {
            cong_lap: 1,
            hk10: 1,
            hk11: 1,
            hk12: 1,
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
            hoc_phi: studentInfoDTO.minBudget,
            tinh_tp: studentInfoDTO.province,
        };
    }

    /**
     * Deduplicates L2PredictResult array by ma_xet_tuyen, keeping only the entry with the highest score
     */
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
        userId: string,
    ): Promise<StudentEntity> {
        const student = await this.studentRepository.findOne({
            relations: ["awards", "certifications", "files"],
            where: { id: studentId, userId },
        });

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with id ${studentId} not found`,
            );
        }

        return student;
    }

    private findAndValidatePerformance(
        performances: AcademicPerformanceDTO[],
        grade: number,
    ): AcademicPerformance {
        const performance = performances.find(
            (ap) => ap.grade === grade,
        )?.academicPerformance;
        if (!performance) {
            // This error should be thrown if data is unexpectedly missing,
            // which helps maintain data integrity.
            throw new IllegalArgumentException(
                `Academic performance for grade ${grade.toString()} is missing.`,
            );
        }
        return performance;
    }

    private generateUserInputCombinations(
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
        const userInputs: UserInputL2[] = [];

        // Get valid CCNN certifications
        const validCcnnCerts = ccnnCertifications.filter(
            (cert) =>
                cert.cefr &&
                cert.examType.type === "CCNN" &&
                cert.examType.value !== CCNNType.OTHER,
        );

        // Generate combinations for each exam scenario
        for (const scenario of examScenarios) {
            for (const cert of validCcnnCerts) {
                for (const major of majors) {
                    const majorCode = getCodeByVietnameseName(major);
                    if (!majorCode) {
                        this.logger.warn(
                            `Cannot find code for major: ${major}`,
                        );
                        continue;
                    }

                    const userInput: UserInputL2 = {
                        ...baseTemplate,
                        diem_ccta: cert.cefr,
                        diem_chuan: scenario.diem_chuan,
                        nhom_nganh: parseInt(majorCode, 10),
                        ten_ccta: cert.examType.value,
                        to_hop_mon: scenario.to_hop_mon,
                    };

                    userInputs.push(userInput);

                    this.logger.info(
                        `Generated user input for ${scenario.type} exam, major: ${major}`,
                        { userInput },
                    );
                }
            }
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
        switch (level.toUpperCase()) {
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
