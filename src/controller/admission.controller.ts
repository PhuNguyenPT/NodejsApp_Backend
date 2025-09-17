import { instanceToPlain, plainToInstance } from "class-transformer";
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

import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import {
    AdmissionSearchQuery,
    buildSearchFilters,
} from "@/dto/admission/admission-search-query.dto.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import { AdmissionMapper } from "@/mapper/admission-mapper.js";
import { validateQuery } from "@/middleware/query-validation.middleware.js";
import { validateUuidParam } from "@/middleware/uuid-validation-middleware.js";
import { AdmissionService } from "@/service/admission.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page-request.js";
import { Page } from "@/type/pagination/page.js";

@injectable()
@Route("admission")
@Tags("Admissions")
export class AdmissionController extends Controller {
    constructor(
        @inject(TYPES.AdmissionService)
        private readonly admissionService: AdmissionService,
    ) {
        super();
    }

    @Get("{studentId}")
    @Middlewares(
        validateUuidParam("studentId"),
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
    ): Promise<Page<AdmissionResponse>> {
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

        const admissionResponsePage =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return instanceToPlain(
            admissionResponsePage,
        ) as Page<AdmissionResponse>;
    }

    @Get("guest/{studentId}")
    @Middlewares(
        validateUuidParam("studentId"),
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
    ): Promise<Page<AdmissionResponse>> {
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

        const admissionResponsePage =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return instanceToPlain(
            admissionResponsePage,
        ) as Page<AdmissionResponse>;
    }
}
