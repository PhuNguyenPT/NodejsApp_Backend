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

import type { AuthenticatedRequest } from "@/type/express/express.js";
import type { Page } from "@/type/pagination/page.interface.js";

import { AdmissionFieldResponse } from "@/dto/admission/admission-field-response.js";
import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import { AdmissionSearchQuery } from "@/dto/admission/admission-search-query.dto.js";
import {
    AdmissionEntity,
    type AdmissionField,
} from "@/entity/uni_guide/admission.entity.js";
import { AdmissionMapper } from "@/mapper/admission-mapper.js";
import { validateQuery } from "@/middleware/query-validation.middleware.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import { type IAdmissionService } from "@/service/admission-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page-request.js";
import { PageResponse } from "@/type/pagination/page-response.js";

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
        @inject(TYPES.IAdmissionService)
        private readonly admissionService: IAdmissionService,
    ) {
        super();
    }

    /**
     * Retrieves distinct field values for admission filtering for a specific authenticated user's student profile.
     * This endpoint provides all unique values for each filterable admission field, which can be used
     * to populate filter dropdowns or selection lists in the frontend.
     *
     * @summary Get admission field filter options for authenticated user
     * @param {string} studentId - UUID of the student profile to retrieve filter options for
     * @param {AuthenticatedRequest} request - Express request object containing authenticated user information
     * @returns {Promise<AdmissionFieldResponse>} Object containing arrays of distinct values for each filterable admission field
     *
     * @throws {EntityNotFoundException} When the student profile is not found or doesn't belong to the authenticated user
     *
     * @example
     * GET /admission/filter/550e8400-e29b-41d4-a716-446655440000
     * Response: {
     *   "fields": {
     *     "uniName": ["University A", "University B"],
     *     "majorName": ["Computer Science", "Software Engineering"],
     *     "province": ["Ho Chi Minh City", "Hanoi"],
     *     ...
     *   }
     * }
     *
     * @memberof AdmissionController
     */
    @Get("filter/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
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

        const fields: Record<AdmissionField, (number | string)[]> =
            await this.admissionService.getAllDistinctAdmissionFieldValues(
                studentId,
                userId,
            );
        return AdmissionMapper.toAdmissionFieldResponse(fields);
    }

    /**
     * Retrieves distinct field values for admission filtering for a public student profile.
     * This endpoint is accessible without authentication and provides filter options for public student profiles
     * (profiles where userId is null). Used to populate filter dropdowns for guest users.
     *
     * @summary Get admission field filter options for guest user
     * @param {string} studentId - UUID of the public student profile to retrieve filter options for
     * @returns {Promise<AdmissionFieldResponse>} Object containing arrays of distinct values for each filterable admission field
     *
     * @throws {EntityNotFoundException} When the public student profile is not found
     *
     * @example
     * GET /admission/filter/guest/550e8400-e29b-41d4-a716-446655440000
     * Response: {
     *   "fields": {
     *     "uniName": ["University A", "University B"],
     *     "majorName": ["Computer Science", "Software Engineering"],
     *     "admissionType": ["THPTQG", "ĐGNL"],
     *     ...
     *   }
     * }
     *
     * @memberof AdmissionController
     */
    @Get("filter/guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's admissions filter",
    )
    public async getAdmissionFieldsFilterGuest(
        @Path() studentId: string,
    ): Promise<AdmissionFieldResponse> {
        const fields: Record<AdmissionField, (number | string)[]> =
            await this.admissionService.getAllDistinctAdmissionFieldValues(
                studentId,
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
     * @param {AdmissionSearchQuery} searchQuery - Query parameters for pagination, sorting, and filtering
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
        @Queries() searchQuery: AdmissionSearchQuery,
    ): Promise<PageResponse<AdmissionResponse>> {
        // Convert PageableQuery to PageRequest
        const queryDto = plainToInstance(PageableQuery, searchQuery);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        const user: Express.User = request.user;
        const userId = user.id;

        // Pass the search query directly to the service
        const admissionPage: Page<AdmissionEntity> =
            await this.admissionService.getAdmissionsPageByStudentIdAndUserId(
                studentId,
                pageRequest,
                { searchQuery, userId },
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
     * @param {AdmissionSearchQuery} searchQuery - Query parameters for pagination, sorting, and filtering
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
        @Queries() searchQuery: AdmissionSearchQuery,
    ): Promise<PageResponse<AdmissionResponse>> {
        // Convert PageableQuery to PageRequest
        const queryDto = plainToInstance(PageableQuery, searchQuery);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        // Pass the search query directly to the service
        const admissionPage: Page<AdmissionEntity> =
            await this.admissionService.getAdmissionsPageByStudentIdAndUserId(
                studentId,
                pageRequest,
                { searchQuery },
            );

        const admissionResponsePage: PageResponse<AdmissionResponse> =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return admissionResponsePage;
    }
}
