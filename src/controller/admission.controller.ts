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

import { AdmissionResponse } from "@/dto/predict/admission.response.js";
import { AdmissionEntity } from "@/entity/admission.js";
import { AdmissionMapper } from "@/mapper/admission.mapper.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware.js";
import { AdmissionService } from "@/service/admission.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { Page } from "@/type/pagination/page.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page.request.js";

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
    @Middlewares(validateUuidParam("studentId"))
    @Produces("application/json")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's admissions",
    )
    public async getAdmissionResponsePage(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
        @Queries() pageableQuery: PageableQuery,
    ): Promise<Page<AdmissionResponse>> {
        // Convert PageableQuery to PageRequest (concrete implementation)
        const queryDto = plainToInstance(PageableQuery, pageableQuery);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        const user: Express.User = request.user;
        const admissionPage: Page<AdmissionEntity> =
            await this.admissionService.getAdmissionsPageByStudentIdAndUserId(
                studentId,
                user.id,
                pageRequest,
            );

        const admissionResponsePage =
            AdmissionMapper.toAdmissionPage(admissionPage);
        return instanceToPlain(
            admissionResponsePage,
        ) as Page<AdmissionResponse>;
    }
}
