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
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import { Logger } from "winston";

import { PredictionResultResponse } from "@/dto/predict/prediciton-result-response.js";
import {
    L1PredictResult,
    L2PredictResult,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { PredictionResultMapper } from "@/mapper/prediction-result-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
import { IPredictionResultService } from "@/service/prediction-result-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { AuthenticatedRequest } from "@/type/express/express.js";

/**
 * Controller for handling university admission prediction requests.
 *
 * This controller provides endpoints for generating and retrieving prediction results
 * using L1 (Level 1) and L2 (Level 2) prediction models, as well as managing
 * prediction result entities.
 *
 * @class PredictionController
 * @extends Controller
 */
@Route("predict")
@Tags("Prediction Model Service")
export class PredictionController extends Controller {
    /**
     * Creates an instance of PredictionController.
     *
     * @param {PredictionModelService} predictionModelService - Service for handling prediction model operations
     * @param {ILogger} logger - Logger instance for logging operations
     * @param {PredictionResultService} predictionResultService - Service for managing prediction results
     */
    constructor(
        @inject(TYPES.IPredictionModelService)
        private readonly predictionModelService: IPredictionModelService,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
        @inject(TYPES.IPredictionResultService)
        private readonly predictionResultService: IPredictionResultService,
    ) {
        super();
    }

    /**
     * TEST: Retrieves Level 1 (L1) prediction results for a specific student.
     *
     * L1 predictions provide basic admission probability estimates based on
     * student academic performance and profile information.
     * @summary TEST ENDPOINT for student profile of an authenticated user
     * @param {string} studentId - UUID of the student profile
     * @param {AuthenticatedRequest} request - Authenticated request containing user information
     * @returns {Promise<L1PredictResult[]>} Array of L1 prediction results
     */
    @Get("model/v1/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async getL1PredictResults(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<L1PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L1PredictResult[] =
            await this.predictionModelService.getL1PredictResults(
                studentId,
                user.id,
            );
        return predictResults;
    }

    /**
     * TEST: Retrieves Level 2 (L2) prediction results for a specific student.
     *
     * L2 predictions provide more detailed admission probability estimates
     * including various exam scenarios (CCQT, DGNL, national exams, etc.)
     * and subject group combinations.
     *
     * @summary TEST ENDPOINT for student profile of an authenticated user
     * @param {string} studentId - UUID of the student profile
     * @param {AuthenticatedRequest} request - Authenticated request containing user information
     * @returns {Promise<L2PredictResult[]>} Array of L2 prediction results with detailed scenarios
     */
    @Get("model/v2/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async getL2PredictResults(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<L2PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictionModelService.getL2PredictResults(
                studentId,
                user.id,
            );
        return predictResults;
    }

    /**
     * TEST: Generates customized L2 prediction results based on user input parameters.
     *
     * This endpoint allows users to override default student parameters and generate
     * predictions with specific exam scores, subject combinations, or other custom inputs.
     * Useful for "what-if" scenarios and exploring different academic pathways.
     *
     * @summary TEST ENDPOINT for student profile of an authenticated user
     * @param {UserInputL2} userInput - Custom input parameters for prediction generation
     * @param {string} studentId - UUID of the student profile to base predictions on
     * @param {AuthenticatedRequest} request - Authenticated request containing user information
     * @returns {Promise<L2PredictResult[]>} Array of L2 prediction results based on custom inputs
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(UserInputL2))
    @Post("model/v2/{studentId}")
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async getPredictedMajors(
        @Body() userInput: UserInputL2,
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<L2PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictionModelService.predictMajorsByStudentIdAndUserId(
                userInput,
                studentId,
                user.id,
            );
        this.logger.info("Predict major successfully for user", {
            id: user.id,
        });
        return predictResults;
    }

    /**
     * Retrieves the prediction result entity for an authenticated user.
     *
     * This endpoint returns the stored prediction result entity, which contains
     * metadata about completed prediction operations, processing status, and
     * result summaries for a specific student profile.
     *
     * @summary Retrieve prediction result for student profile of an authenticated user
     * @param {string} studentId - UUID of the student profile
     * @param {AuthenticatedRequest} request - Authenticated request containing user information
     * @returns {Promise<PredictionResultEntity>} The prediction result entity with metadata
     */
    @Get("result/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Fetching prediction result successfully")
    public async getPredictionResultEntityForAuthenticatedUser(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<PredictionResultResponse> {
        const user: Express.User = request.user;

        const predictionResultEntity: PredictionResultEntity =
            await this.predictionResultService.getPredictionResultEntityByStudentIdAndUserId(
                studentId,
                user.id,
            );

        return PredictionResultMapper.toResponse(predictionResultEntity);
    }

    /**
     * Retrieves the prediction result entity for guest users (unauthenticated access).
     *
     * This endpoint allows access to prediction results without authentication,
     * typically used for public or shared prediction results. The student profile
     * must be configured to allow guest access.
     *
     * @summary Retrieve prediction result for student profile of a guest user
     * @param {string} studentId - UUID of the student profile
     * @returns {Promise<PredictionResultEntity>} The prediction result entity accessible to guests
     */
    @Get("result/guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @SuccessResponse(HttpStatus.OK, "Fetching prediction result successfully")
    public async getPredictionResultEntityForGuest(
        @Path() studentId: string,
    ): Promise<PredictionResultResponse> {
        const predictionResultEntity: PredictionResultEntity =
            await this.predictionResultService.getPredictionResultEntityByStudentIdAndUserId(
                studentId,
            );

        return PredictionResultMapper.toResponse(predictionResultEntity);
    }
}
