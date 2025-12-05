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
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "@tsoa/runtime";
import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { OcrRequest } from "@/dto/ocr/ocr-request.dto.js";
import { OcrResultResponse } from "@/dto/ocr/ocr-result-response.dto.js";
import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import { BatchScoreExtractionResult } from "@/dto/ocr/score-extraction-result.js";
import { SubjectScore } from "@/dto/ocr/subject-score.dto.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { ITranscriptService } from "@/service/transcript-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";

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
     * Manually create a transcript for an authenticated user's student
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(OcrRequest))
    @Post("{studentId}")
    @Produces("application/json")
    @Security("bearerAuth", ["profile:update:own"])
    @SuccessResponse(HttpStatus.CREATED, "Transcript successfully created")
    public async createTranscript(
        @Path("studentId") studentId: string,
        @Body() ocrRequest: OcrRequest,
        @Request() authenticatedRequest: AuthenticatedRequest,
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
     * Manually create a transcript for a guest student
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(OcrRequest))
    @Post("guest/{studentId}")
    @Produces("application/json")
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
     * Extracts subject scores from transcript images for a given student.
     * The files must belong to the authenticated user.
     */
    @Middlewares(validateUuidParams("studentId"))
    @Post("{studentId}/transcripts/ocr")
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully extracted")
    public async extractTranscriptScores(
        @Path("studentId") studentId: string,
        @Request() request: AuthenticatedRequest,
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
            this.setStatus(HttpStatus.BAD_REQUEST);
        }
        return result;
    }

    @Get("{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async getExtractedScores(
        @Path("studentId") studentId: string,
        @Request() request: AuthenticatedRequest,
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

    @Get("guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
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

    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("{id}")
    @Produces("application/json")
    @Security("bearerAuth", ["profile:update:own"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully updated")
    public async patchExtractedScores(
        @Path("id") id: string,
        @Body() ocrUpdateRequest: OcrUpdateRequest,
        @Request() authenticatedRequest: AuthenticatedRequest,
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

    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("guest/{id}")
    @Produces("application/json")
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
