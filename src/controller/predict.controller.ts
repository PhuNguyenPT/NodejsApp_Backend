import { inject } from "inversify";
import {
    Body,
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
} from "tsoa";

import { L2PredictResult, L2PUserInput } from "@/dto/predict/predict.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware.js";
import validateDTO from "@/middleware/validation.middleware.js";
import { PredictModelService } from "@/service/predic.model.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger.js";

@Route("predict")
@Tags("Predict Model Service")
export class PredictController extends Controller {
    constructor(
        @inject(TYPES.PredictModelService)
        private readonly predictModelService: PredictModelService,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
    ) {
        super();
    }

    @Middlewares(validateUuidParam("studentId"), validateDTO(L2PUserInput))
    @Post("model/v2/{studentId}")
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async getPredictedMajors(
        @Body() userInput: L2PUserInput,
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<L2PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictModelService.predictMajorsByStudentIdAndUserId(
                userInput,
                studentId,
                user.id,
            );
        this.logger.info("Predict major successfully for user", {
            id: user.id,
        });
        return predictResults;
    }

    @Get("model/v2/{studentId}")
    @Middlewares(validateUuidParam("studentId"))
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async predictMajors(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ) {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictModelService.getPredictedResults(
                studentId,
                user.id,
            );
        return predictResults;
    }
}
