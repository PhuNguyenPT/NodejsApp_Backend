import {
    Controller,
    Path,
    Post,
    Produces,
    Request,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "@tsoa/runtime";
import { inject } from "inversify";

import { BatchScoreExtractionResult } from "@/dto/predict/ocr.js";
import { MistralService } from "@/service/mistral.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger.js";

@Route("students")
@Tags("OCR")
export class OcrController extends Controller {
    constructor(
        @inject(TYPES.MistralService)
        private readonly mistralService: MistralService,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
    ) {
        super();
    }

    /**
     * Extracts subject scores from transcript images for a given student.
     * The files must belong to the authenticated user.
     */
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
}
