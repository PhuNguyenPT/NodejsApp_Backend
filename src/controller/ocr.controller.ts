import {
    Controller,
    Get,
    Middlewares,
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

import {
    BatchScoreExtractionResult,
    OcrResultResponse,
} from "@/dto/predict/ocr.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";
import { OcrResultMapper } from "@/mapper/ocr-mapper.js";
import { validateUuidParam } from "@/middleware/uuid-validation-middleware.js";
import { MistralService } from "@/service/mistral.service.js";
import { OcrResultService } from "@/service/ocr-result.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger.interface.js";

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
        private readonly logger: ILogger,
    ) {
        super();
    }

    /**
     * Extracts subject scores from transcript images for a given student.
     * The files must belong to the authenticated user.
     */
    @Middlewares(validateUuidParam("studentId"))
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
    @Middlewares(validateUuidParam("studentId"))
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
    @Middlewares(validateUuidParam("studentId"))
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
}
