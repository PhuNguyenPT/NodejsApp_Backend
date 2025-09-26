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
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.js";
import {
    BatchScoreExtractionResult,
    OcrResultResponse,
} from "@/dto/predict/ocr.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";
import { OcrResultMapper } from "@/mapper/ocr-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { MistralService } from "@/service/impl/mistral.service.js";
import { OcrResultService } from "@/service/impl/ocr-result.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";

@injectable()
@Route("ocr")
@Tags("OCR")
export class OcrController extends Controller {
    constructor(
        @inject(TYPES.MistralService)
        private readonly mistralService: MistralService,
        @inject(TYPES.OcrResultService)
        private readonly ocrResultService: OcrResultService,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {
        super();
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
        this.logger.info(
            `Retrieving OCR result for student with id ${studentId}`,
        );
        const user: Express.User = request.user;
        const results: OcrResultEntity[] =
            await this.ocrResultService.findByStudentId(studentId, user.id);
        const resultResponses: OcrResultResponse[] =
            OcrResultMapper.toResponseList(results);
        return resultResponses;
    }

    @Get("guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async getExtractedScoresGuest(
        @Path("studentId") studentId: string,
    ): Promise<OcrResultResponse[]> {
        this.logger.info(
            `Retrieving OCR result for student with id ${studentId}`,
        );
        const results: OcrResultEntity[] =
            await this.ocrResultService.findByStudentId(studentId);
        const resultResponses: OcrResultResponse[] =
            OcrResultMapper.toResponseList(results);
        return resultResponses;
    }

    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("guest/{id}")
    @Produces("application/json")
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async patchExtractedScores(
        @Path("id") id: string,
        @Body() ocrUpdateRequest: OcrUpdateRequest,
    ): Promise<OcrResultResponse> {
        this.logger.info(`Retrieving OCR result for id ${id}`);
        const result: OcrResultEntity =
            await this.ocrResultService.patchByStudentIdAndFileId(
                id,
                ocrUpdateRequest,
            );
        const resultResponse: OcrResultResponse =
            OcrResultMapper.toResponse(result);
        return resultResponse;
    }

    @Middlewares(validateUuidParams("id"), validateDTO(OcrUpdateRequest))
    @Patch("{id}")
    @Produces("application/json")
    @Security("bearerAuth", ["profile:update:own"])
    @SuccessResponse(HttpStatus.OK, "Scores successfully retrieved")
    public async patchExtractedScoresGuest(
        @Path("id") id: string,
        @Body() ocrUpdateRequest: OcrUpdateRequest,
        @Request() authenticatedRequest: AuthenticatedRequest,
    ): Promise<OcrResultResponse> {
        const user = authenticatedRequest.user;
        const userId: string = user.id;

        const result: OcrResultEntity =
            await this.ocrResultService.patchByStudentIdAndFileId(
                id,
                ocrUpdateRequest,
                userId,
            );
        const resultResponse: OcrResultResponse =
            OcrResultMapper.toResponse(result);
        return resultResponse;
    }
}
