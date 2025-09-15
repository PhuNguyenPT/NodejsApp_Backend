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

import { EnrollmentResponse } from "@/dto/predict/enrollment.response.js";
import { EnrollmentEntity } from "@/entity/enrollment.entity.js";
import { EnrollmentMapper } from "@/mapper/enrollment.mapper.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware.js";
import { EnrollmentService } from "@/service/enrollment.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { Page } from "@/type/pagination/page.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page.request.js";

@injectable()
@Route("enrollment")
@Tags("Enrollments")
export class EnrollmentController extends Controller {
    constructor(
        @inject(TYPES.EnrollmentService)
        private readonly enrollmentService: EnrollmentService,
    ) {
        super();
    }

    @Get("{studentId}")
    @Middlewares(validateUuidParam("studentId"))
    @Produces("application/json")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile's enrollments",
    )
    public async getEnrollmentResponsePage(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
        @Queries() pageableQuery: PageableQuery,
    ): Promise<Page<EnrollmentResponse>> {
        // Convert PageableQuery to PageRequest (concrete implementation)
        const queryDto = plainToInstance(PageableQuery, pageableQuery);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        const user: Express.User = request.user;
        const enrollmentPage: Page<EnrollmentEntity> =
            await this.enrollmentService.getEnrollmentsPageByStudentIdAndUserId(
                studentId,
                user.id,
                pageRequest,
            );

        return EnrollmentMapper.toEnrollmentPage(enrollmentPage);
    }
}
