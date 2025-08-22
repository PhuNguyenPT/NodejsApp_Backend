import axios, { AxiosError, AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import {
    HTTPValidationError,
    PredictResult,
    UserInput,
} from "@/dto/predict/predict.js";
import { OcrResultEntity, OcrStatus } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
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
    ): Promise<PredictResult[]> {
        // TODO: implement query result by event
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications", "files"],
                where: { id: studentId, userId },
            });

        if (!student) {
            throw new EntityNotFoundException(
                `Student with id ${studentId} not found`,
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
        userInput: UserInput,
        studentId: string,
        userId: string,
    ): Promise<PredictResult[]> {
        this.logger.info("Performing prediction majors for student ", {
            studentId: studentId,
            userId: userId,
        });
        return await this.predictMajors(userInput);
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
        userInput: UserInput,
    ): Promise<PredictResult[]> {
        try {
            this.logger.info("Starting prediction");

            const response = await this.httpClient.post<PredictResult[]>(
                "/predict",
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

    private async validateResponse(data: unknown): Promise<PredictResult[]> {
        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }

        const results: PredictResult[] = [];

        for (const item of data) {
            const instance = plainToInstance(PredictResult, item);
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
