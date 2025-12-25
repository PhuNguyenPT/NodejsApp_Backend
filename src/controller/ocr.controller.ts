import {
    Body,
    Controller,
    Get,
    Middlewares,
    Patch,
    Path,
    Post,
    Produces,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "@tsoa/runtime";
import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import type { BatchScoreExtractionResult } from "@/dto/ocr/score-extraction-result.js";
import type { IMistralService } from "@/service/mistral-service.interface.js";
import type { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import type { ITranscriptService } from "@/service/transcript-service.interface.js";

import { OcrRequest } from "@/dto/ocr/ocr-request.dto.js";
import { OcrResultResponse } from "@/dto/ocr/ocr-result-response.dto.js";
import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import { SubjectScore } from "@/dto/ocr/subject-score.dto.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";

@injectable()
@Route("ocr")
@Tags("OCR")
export class OcrController extends Controller {
    constructor(
        @inject(TYPES.IMistralService)
        private readonly mistralService: IMistralService,
        @inject(TYPES.IOcrResultService)
        private readonly ocrResultService: IOcrResultService,
        @inject(TYPES.ITranscriptService)
        private readonly transcriptService: ITranscriptService,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {
        super();
    }

    /**
     * Create a transcript manually for the authenticated user's student profile.
     * This endpoint allows users to input transcript data directly without OCR processing.
     * @summary Create transcript for authenticated user
     * @param studentId The UUID of the student profile to create a transcript for.
     * @param ocrRequest The transcript data including grade, semester, and subject scores.
     * @param authenticatedRequest The authenticated Express request object, containing user details.
     * @returns {OcrResultResponse} The newly created transcript with subject scores.
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(OcrRequest))
    @Post("{studentId}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["profile:update:own"])
    @SuccessResponse(HttpStatus.CREATED, "Transcript successfully created")
    public async createTranscript(
        @Path("studentId") studentId: string,
        @Body() ocrRequest: OcrRequest,
        @Request() authenticatedRequest: Express.AuthenticatedRequest,
    ): Promise<OcrResultResponse> {
        const user = authenticatedRequest.user;
        const transcript =
            await this.transcriptService.saveByStudentIdAndUserId(
                studentId,
                ocrRequest,
                user.id,
            );

        const subjectScores: SubjectScore[] = (
            transcript.transcriptSubjects ?? []
        ).map((subject) =>
            plainToInstance(SubjectScore, {
                name: subject.subject,
                score: subject.score,
            }),
        );

        const ocrResultResponse: OcrResultResponse = plainToInstance(
            OcrResultResponse,
            transcript,
            { excludeExtraneousValues: true },
        );
        ocrResultResponse.subjectScores = subjectScores;

        return ocrResultResponse;
    }

    /**
     * Create a transcript manually for a guest user's student profile.
     * This endpoint allows anonymous users to input transcript data without authentication.
     * @summary Create transcript for guest user
     * @param studentId The UUID of the guest student profile to create a transcript for.
     * @param ocrRequest The transcript data including grade, semester, and subject scores.
     * @returns {OcrResultResponse} The newly created transcript with subject scores.
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(OcrRequest))
    @Post("guest/{studentId}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @SuccessResponse(HttpStatus.CREATED, "Transcript successfully created")
    public async createTranscriptGuest(
        @Path("studentId") studentId: string,
        @Body() ocrRequest: OcrRequest,
    ): Promise<OcrResultResponse> {
        const transcript =
            await this.transcriptService.saveByStudentIdAndUserId(
                studentId,
                ocrRequest,
            );

        const subjectScores: SubjectScore[] = (
            transcript.transcriptSubjects ?? []
        ).map((subject) =>
            plainToInstance(SubjectScore, {
                name: subject.subject,
                score: subject.score,
            }),
        );

        const ocrResultResponse: OcrResultResponse = plainToInstance(
            OcrResultResponse,
            transcript,
            { excludeExtraneousValues: true },
        );
        ocrResultResponse.subjectScores = subjectScores;

        return ocrResultResponse;
    }

    /**
     * Extract subject scores from transcript images using OCR for an authenticated user.
     * This endpoint processes uploaded transcript images and extracts grade and subject score data.
     * The files must belong to the authenticated user's student profile.
     * @summary Extract scores from transcript images via OCR
     * @param studentId The UUID of the student profile whose transcript images to process.
     * @param request The authenticated Express request object.
     * @returns {BatchScoreExtractionResult} Batch extraction results containing scores for each processed image.
     */
    @Middlewares(validateUuidParams("studentId"))
    @Post("{studentId}/transcripts/ocr")
    @Produces("application/json")
    @Response<string>(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Validation error or extraction failed",
    )
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully extracted")
    public async extractTranscriptScores(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<BatchScoreExtractionResult> {
        this.logger.info(
            `Starting OCR extraction for student with id ${studentId}`,
        );

        const user: Express.User = request.user;
        const result = await this.mistralService.extractSubjectScoresByUserId(
            studentId,
            user.id,
        );

        if (!result.success) {
            this.setStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        }

        return result;
    }

    /**
     * Retrieve all extracted transcript scores for an authenticated user's student profile.
     * Returns all previously created or OCR-extracted transcripts with their subject scores.
     * @summary Get all transcripts for authenticated user
     * @param studentId The UUID of the student profile to retrieve transcripts for.
     * @param request The authenticated Express request object.
     * @returns {OcrResultResponse[]} Array of transcript results with subject scores.
     */
    @Get("{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(
        HttpStatus.NOT_FOUND,
        "Student profile or transcripts not found",
    )
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async getExtractedScores(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<OcrResultResponse[]> {
        const user: Express.User = request.user;
        const userId: string = user.id;

        this.logger.info("Retrieving OCR results for authorized student", {
            studentId,
            userId,
        });

        const transcriptEntities: TranscriptEntity[] =
            await this.transcriptService.findByStudentIdAndUserId(
                studentId,
                userId,
            );

        const ocrResultResponses: OcrResultResponse[] = transcriptEntities.map(
            (transcriptEntity) => {
                const subjectScores: SubjectScore[] = (
                    transcriptEntity.transcriptSubjects ?? []
                ).map((subject) =>
                    plainToInstance(SubjectScore, {
                        name: subject.subject,
                        score: subject.score,
                    }),
                );

                const ocrResultResponse: OcrResultResponse = plainToInstance(
                    OcrResultResponse,
                    transcriptEntity,
                    { excludeExtraneousValues: true },
                );
                ocrResultResponse.subjectScores = subjectScores;

                return ocrResultResponse;
            },
        );

        this.logger.info(
            "Retrieving OCR results successfully for authorized student",
            { length: ocrResultResponses.length, studentId, userId },
        );

        return ocrResultResponses;
    }

    /**
     * Retrieve all extracted transcript scores for a guest user's student profile.
     * Returns all previously created or OCR-extracted transcripts without authentication.
     * @summary Get all transcripts for guest user
     * @param studentId The UUID of the guest student profile to retrieve transcripts for.
     * @returns {OcrResultResponse[]} Array of transcript results with subject scores.
     */
    @Get("guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(
        HttpStatus.NOT_FOUND,
        "Student profile or transcripts not found",
    )
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async getExtractedScoresGuest(
        @Path("studentId") studentId: string,
    ): Promise<OcrResultResponse[]> {
        this.logger.info("Retrieving OCR result for guest student", {
            studentId,
        });

        const transcriptEntities: TranscriptEntity[] =
            await this.transcriptService.findByStudentIdAndUserId(studentId);

        const ocrResultResponses: OcrResultResponse[] = transcriptEntities.map(
            (transcriptEntity) => {
                const subjectScores: SubjectScore[] = (
                    transcriptEntity.transcriptSubjects ?? []
                ).map((subject) =>
                    plainToInstance(SubjectScore, {
                        name: subject.subject,
                        score: subject.score,
                    }),
                );

                const ocrResultResponse: OcrResultResponse = plainToInstance(
                    OcrResultResponse,
                    transcriptEntity,
                    { excludeExtraneousValues: true },
                );
                ocrResultResponse.subjectScores = subjectScores;

                return ocrResultResponse;
            },
        );

        this.logger.info(
            "Retrieving OCR results successfully for guest student",
            { length: ocrResultResponses.length, studentId },
        );

        return ocrResultResponses;
    }

    /**
     * Update subject scores for an existing transcript for an authenticated user.
     * This endpoint allows users to correct or modify previously extracted or entered scores.
     * @summary Update transcript scores for authenticated user
     * @param id The UUID of the transcript to update.
     * @param ocrUpdateRequest The updated subject scores.
     * @param authenticatedRequest The authenticated Express request object.
     * @returns {OcrResultResponse} The updated transcript with modified subject scores.
     */
    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("{id}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Transcript not found")
    @Security("bearerAuth", ["profile:update:own"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully updated")
    public async patchExtractedScores(
        @Path("id") id: string,
        @Body() ocrUpdateRequest: OcrUpdateRequest,
        @Request() authenticatedRequest: Express.AuthenticatedRequest,
    ): Promise<OcrResultResponse> {
        const user = authenticatedRequest.user;
        const createdBy: string = user.email;

        this.logger.info(
            `Updating OCR result for transcript id ${id} by ${createdBy}`,
        );

        const result = await this.transcriptService.patchByIdAndCreatedBy(
            id,
            ocrUpdateRequest,
            createdBy,
        );

        return plainToInstance(
            OcrResultResponse,
            {
                id: result.id,
                subjectScores: result.subjectScores,
            },
            { excludeExtraneousValues: true },
        );
    }

    /**
     * Update subject scores for an existing transcript for a guest user.
     * This endpoint allows anonymous users to correct or modify previously extracted or entered scores.
     * @summary Update transcript scores for guest user
     * @param id The UUID of the transcript to update.
     * @param ocrUpdateRequest The updated subject scores.
     * @returns {OcrResultResponse} The updated transcript with modified subject scores.
     */
    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("guest/{id}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.NOT_FOUND, "Transcript not found")
    @SuccessResponse(HttpStatus.OK, "Scores successfully updated")
    public async patchExtractedScoresGuest(
        @Path("id") id: string,
        @Body() ocrUpdateRequest: OcrUpdateRequest,
    ): Promise<OcrResultResponse> {
        this.logger.info(`Updating OCR result for transcript id ${id}`);

        const result = await this.transcriptService.patchByIdAndCreatedBy(
            id,
            ocrUpdateRequest,
        );

        return plainToInstance(
            OcrResultResponse,
            {
                id: result.id,
                subjectScores: result.subjectScores,
            },
            { excludeExtraneousValues: true },
        );
    }
}
