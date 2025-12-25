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

import type { IPredictionL1Service } from "@/service/prediction-l1-service.interface.js";
import type { IPredictionL2Service } from "@/service/prediction-l2-service.interface.js";
import type { IPredictionL3Service } from "@/service/prediction-L3-service.interface.js";
import type { IPredictionResultService } from "@/service/prediction-result-service.interface.js";

import { L1PredictResult } from "@/dto/prediction/l1-response.dto.js";
import { UserInputL2 } from "@/dto/prediction/l2-request.dto.js";
import { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserInputL3 } from "@/dto/prediction/l3-request.dto.js";
import { PredictionResultResponse } from "@/dto/prediction/prediction-result-response.dto.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { PredictionResultMapper } from "@/mapper/prediction-result-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";

/**
 * Controller for handling university admission prediction requests.
 *
 * This controller provides endpoints for generating and retrieving prediction results
 * using L1 (Level 1), L2 (Level 2), and L3 (Level 3) prediction models, as well as managing
 * prediction result entities.
 */
@Route("predict")
@Tags("Prediction Model Service")
export class PredictionController extends Controller {
    /**
     * Creates an instance of PredictionController.
     *
     * @param predictionL1Service - Service for handling L1 prediction operations
     * @param predictionL2Service - Service for handling L2 prediction operations
     * @param predictionL3Service - Service for handling L3 prediction operations
     * @param logger - Logger instance for logging operations
     * @param predictionResultService - Service for managing prediction results
     */
    constructor(
        @inject(TYPES.IPredictionL1Service)
        private readonly predictionL1Service: IPredictionL1Service,
        @inject(TYPES.IPredictionL2Service)
        private readonly predictionL2Service: IPredictionL2Service,
        @inject(TYPES.IPredictionL3Service)
        private readonly predictionL3Service: IPredictionL3Service,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
        @inject(TYPES.IPredictionResultService)
        private readonly predictionResultService: IPredictionResultService,
    ) {
        super();
    }

    /**
     * Retrieve Level 1 (L1) prediction results for a specific student profile.
     * L1 predictions provide basic admission probability estimates based on
     * student academic performance and profile information.
     * This is a TEST endpoint for development and validation purposes.
     * @summary Get L1 predictions for authenticated user
     * @param studentId The UUID of the student profile.
     * @param request The authenticated Express request object.
     * @returns {L1PredictResult[]} Array of L1 prediction results with basic admission probabilities.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     */
    @Get("model/v1/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result retrieved successfully")
    public async getL1PredictResults(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<L1PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L1PredictResult[] =
            await this.predictionL1Service.getL1PredictResults(
                studentId,
                user.id,
            );
        return predictResults;
    }

    /**
     * Retrieve Level 2 (L2) prediction results for a specific student profile.
     * L2 predictions provide more detailed admission probability estimates
     * including various exam scenarios (CCQT, DGNL, national exams, etc.)
     * and subject group combinations.
     * This is a TEST endpoint for development and validation purposes.
     * @summary Get L2 predictions for authenticated user
     * @param studentId The UUID of the student profile.
     * @param request The authenticated Express request object.
     * @returns {L2PredictResult[]} Array of L2 prediction results with detailed exam scenarios.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     */
    @Get("model/v2/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result retrieved successfully")
    public async getL2PredictResults(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<L2PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictionL2Service.getL2PredictResults(
                studentId,
                user.id,
            );
        return predictResults;
    }

    /**
     * Retrieve Level 3 (L3) prediction results for a specific student profile.
     * L3 predictions provide comprehensive admission analysis including transcript scores,
     * national exam results, certifications (CCNN, CCQT), DGNL scores, talent exams,
     * and awards. This model considers all available student data for the most
     * accurate predictions.
     * This is a TEST endpoint for development and validation purposes.
     * @summary Get L3 predictions for authenticated user
     * @param studentId The UUID of the student profile.
     * @param request The authenticated Express request object.
     * @returns {L3PredictResult[]} Array of L3 prediction results with comprehensive analysis.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     */
    @Get("model/v3/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "L3 predict results retrieved successfully")
    public async getL3PredictResults(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<L3PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L3PredictResult[] =
            await this.predictionL3Service.getL3PredictResults(
                studentId,
                user.id,
            );
        return predictResults;
    }

    /**
     * Generate customized L2 prediction results based on user input parameters.
     * This endpoint allows users to override default student parameters and generate
     * predictions with specific exam scores, subject combinations, or other custom inputs.
     * Useful for "what-if" scenarios and exploring different academic pathways.
     * This is a TEST endpoint for development and validation purposes.
     * @summary Generate custom L2 predictions for authenticated user
     * @param userInput Custom input parameters for prediction generation including exam scores and subject groups.
     * @param studentId The UUID of the student profile to base predictions on.
     * @param request The authenticated Express request object.
     * @returns {L2PredictResult[]} Array of L2 prediction results based on custom inputs.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     * @throws {ValidationException} If the input parameters are invalid.
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(UserInputL2))
    @Post("model/v2/{studentId}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Predict result created successfully")
    public async getPredictedMajors(
        @Body() userInput: UserInputL2,
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<L2PredictResult[]> {
        const user: Express.User = request.user;
        const predictResults: L2PredictResult[] =
            await this.predictionL2Service.predictMajorsByStudentIdAndUserId(
                userInput,
            );
        this.logger.info("Predict major successfully for user", {
            id: user.id,
            studentId,
        });
        return predictResults;
    }

    /**
     * Generate customized L3 prediction results based on user input parameters.
     * This endpoint allows users to override default student parameters and generate
     * predictions with specific transcript scores, exam results, certifications,
     * and other comprehensive inputs. Useful for "what-if" scenarios and exploring
     * different academic pathways with complete student profiles.
     * This is a TEST endpoint for development and validation purposes.
     * @summary Generate custom L3 predictions for authenticated user
     * @param userInput Custom input parameters for L3 prediction generation including comprehensive student data.
     * @param studentId The UUID of the student profile to base predictions on.
     * @param request The authenticated Express request object.
     * @returns {L3PredictResult} L3 prediction result based on custom inputs.
     * @throws {EntityNotFoundException} If the student profile is not found or access is denied.
     * @throws {ValidationException} If the input parameters are invalid.
     */
    @Middlewares(validateUuidParams("studentId"), validateDTO(UserInputL3))
    @Post("model/v3/{studentId}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Student profile not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "L3 predict result created successfully")
    public async getPredictedMajorsL3(
        @Body() userInput: UserInputL3,
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<L3PredictResult> {
        const user: Express.User = request.user;
        const predictResult: L3PredictResult =
            await this.predictionL3Service.predictMajorsL3(userInput);
        this.logger.info("L3 predict major successfully for user", {
            majorGroup: userInput.nhom_nganh,
            studentId: studentId,
            userId: user.id,
        });
        return predictResult;
    }

    /**
     * Retrieve the prediction result entity for an authenticated user's student profile.
     * This endpoint returns the stored prediction result entity, which contains
     * metadata about completed prediction operations, processing status, and
     * result summaries for a specific student profile.
     * @summary Get prediction result for authenticated user
     * @param studentId The UUID of the student profile.
     * @param request The authenticated Express request object.
     * @returns {PredictionResultResponse} The prediction result entity with metadata.
     * @throws {EntityNotFoundException} If the student profile or prediction result is not found, or access is denied.
     */
    @Get("result/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Prediction result not found")
    @Security("bearerAuth", ["api:read"])
    @SuccessResponse(HttpStatus.OK, "Fetching prediction result successfully")
    public async getPredictionResultEntityForAuthenticatedUser(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<PredictionResultResponse> {
        const user: Express.User = request.user;

        const predictionResultEntity: PredictionResultEntity =
            await this.predictionResultService.findByStudentIdAndUserId(
                studentId,
                user.id,
            );

        return PredictionResultMapper.toResponse(predictionResultEntity);
    }

    /**
     * Retrieve the prediction result entity for a guest user's student profile (unauthenticated access).
     * This endpoint allows access to prediction results without authentication,
     * typically used for public or shared prediction results. The student profile
     * must not be owned by any authenticated user to allow guest access.
     * @summary Get prediction result for guest user
     * @param studentId The UUID of the student profile.
     * @returns {PredictionResultResponse} The prediction result entity accessible to guests.
     * @throws {EntityNotFoundException} If the student profile or prediction result is not found, or the profile is owned by an authenticated user.
     */
    @Get("result/guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.NOT_FOUND, "Prediction result not found")
    @SuccessResponse(HttpStatus.OK, "Fetching prediction result successfully")
    public async getPredictionResultEntityForGuest(
        @Path("studentId") studentId: string,
    ): Promise<PredictionResultResponse> {
        const predictionResultEntity: PredictionResultEntity =
            await this.predictionResultService.findByStudentIdAndUserId(
                studentId,
            );

        return PredictionResultMapper.toResponse(predictionResultEntity);
    }
}
