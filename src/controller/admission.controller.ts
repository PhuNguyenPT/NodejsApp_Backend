import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import {
    Controller,
    Get,
    Middlewares,
    Path,
    Produces,
    Queries,
    Request,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import { AdmissionFieldResponse } from "@/dto/admission/admission-field-response.js";
import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import {
    AdmissionSearchQuery,
    buildSearchFilters,
} from "@/dto/admission/admission-search-query.dto.js";
import {
    AdmissionEntity,
    AdmissionSearchField,
} from "@/entity/admission.entity.js";
import { AdmissionMapper } from "@/mapper/admission-mapper.js";
import { validateQuery } from "@/middleware/query-validation.middleware.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import { AdmissionService } from "@/service/impl/admission.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page-request.js";
import { PageResponse } from "@/type/pagination/page-response.js";
import { Page } from "@/type/pagination/page.interface.js";

/**
 * Controller responsible for handling admission-related HTTP requests.
 * Provides endpoints for retrieving paginated admission data for both authenticated users and guests.
 *
 * @class AdmissionController
 * @extends {Controller}
 */
@injectable()
@Route("admission")
@Tags("Admissions")
export class AdmissionController extends Controller {
    /**
     * Creates an instance of AdmissionController.
     *
     * @param {AdmissionService} admissionService - Service for handling admission business logic
     * @memberof AdmissionController
     */
    constructor(
        @inject(TYPES.AdmissionService)
        private readonly admissionService: AdmissionService,
    ) {
        super();
    }

    @Get("filter/{studentId}")
    @Middlewares(
        validateUuidParams("studentId"),
        validateQuery(AdmissionSearchQuery),
    )
    @Produces("application/json")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's admissions filter",
    )
    public async getAdmissionFieldsFilter(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<AdmissionFieldResponse> {
        const user: Express.User = request.user;
        const userId = user.id;

        const fields: Record<AdmissionSearchField, (number | string)[]> =
            await this.admissionService.getAllDistinctAdmissionFieldValues(
                studentId,
                userId,
            );
        return AdmissionMapper.toAdmissionFieldResponse(fields);
    }

    /**
     * Retrieves a paginated list of admissions for a specific student profile.
     * This endpoint requires authentication and validates that the user has access to the requested student profile.
     *
     * @summary Get student profile's admission(s) for authenticated user
     * @param {string} studentId - UUID of the student profile to retrieve admissions for
     * @param {AuthenticatedRequest} request - Express request object containing authenticated user information
     * @param {AdmissionSearchQuery} queryParams - Query parameters for pagination, sorting, and filtering
     * @returns {Promise<Page<AdmissionResponse>>} Paginated list of admission responses
     *
     * @throws {ValidationException} When the page request parameters are invalid
     * @throws {EntityNotFoundException} When the student profile is not found or doesn't belong to the authenticated user
     *
     * @example
     * GET /admission/550e8400-e29b-41d4-a716-446655440000?page=0&size=20
     *
     * @memberof AdmissionController
     */
    @Get("{studentId}")
    @Middlewares(
        validateUuidParams("studentId"),
        validateQuery(AdmissionSearchQuery),
    )
    @Produces("application/json")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's admissions",
    )
    public async getAdmissionResponsePage(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
        @Queries() queryParams: AdmissionSearchQuery,
    ): Promise<PageResponse<AdmissionResponse>> {
        // Convert PageableQuery to PageRequest
        const queryDto = plainToInstance(PageableQuery, queryParams);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        // Use the private method instead of inline code
        const searchFilters = buildSearchFilters(queryParams);
        const searchOptions =
            Object.keys(searchFilters).length > 0
                ? { filters: searchFilters }
                : undefined;

        const user: Express.User = request.user;
        const userId = user.id;

        const admissionPage: Page<AdmissionEntity> =
            await this.admissionService.getAdmissionsPageByStudentIdAndUserId(
                studentId,
                pageRequest,
                { searchOptions, userId },
            );

        const admissionResponsePage: PageResponse<AdmissionResponse> =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return admissionResponsePage;
    }

    /**
     * Retrieves a paginated list of admissions for a public student profile.
     * This endpoint is accessible without authentication and only returns data for public student profiles
     * (profiles where userId is null).
     *
     * @summary Get student profile's admission(s) for guest user
     * @param {string} studentId - UUID of the public student profile to retrieve admissions for
     * @param {AdmissionSearchQuery} queryParams - Query parameters for pagination, sorting, and filtering
     * @returns {Promise<Page<AdmissionResponse>>} Paginated list of admission responses
     *
     * @throws {ValidationException} When the page request parameters are invalid
     * @throws {EntityNotFoundException} When the public student profile is not found
     *
     * @example
     * GET /admission/guest/550e8400-e29b-41d4-a716-446655440000?page=0&size=20
     *
     * @memberof AdmissionController
     */
    @Get("guest/{studentId}")
    @Middlewares(
        validateUuidParams("studentId"),
        validateQuery(AdmissionSearchQuery),
    )
    @Produces("application/json")
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's admissions",
    )
    public async getAdmissionResponsePageForGuest(
        @Path() studentId: string,
        @Queries() queryParams: AdmissionSearchQuery,
    ): Promise<PageResponse<AdmissionResponse>> {
        // Convert PageableQuery to PageRequest
        const queryDto = plainToInstance(PageableQuery, queryParams);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        // Use the private method instead of inline code
        const searchFilters = buildSearchFilters(queryParams);
        const searchOptions =
            Object.keys(searchFilters).length > 0
                ? { filters: searchFilters }
                : undefined;

        const admissionPage: Page<AdmissionEntity> =
            await this.admissionService.getAdmissionsPageByStudentIdAndUserId(
                studentId,
                pageRequest,
                { searchOptions },
            );

        const admissionResponsePage: PageResponse<AdmissionResponse> =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return admissionResponsePage;
    }
}
