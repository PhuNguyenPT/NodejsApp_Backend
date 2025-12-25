import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import {
    Body,
    Controller,
    Get,
    Middlewares,
    Path,
    Post,
    Produces,
    Queries,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import type { IStudentService } from "@/service/student-service.interface.js";
import type { Page } from "@/type/pagination/page.interface.js";

import { StudentProfileResponse } from "@/dto/student/student-profile-response.js";
import { StudentRequest } from "@/dto/student/student-request.js";
import { StudentResponse } from "@/dto/student/student.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { StudentMapper } from "@/mapper/student-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page-request.js";
import { PageResponse } from "@/type/pagination/page-response.js";

@injectable()
@Route("students")
@Tags("Students")
export class StudentController extends Controller {
    constructor(
        @inject(TYPES.IStudentService)
        private studentService: IStudentService,
    ) {
        super();
    }

    /**
     * Create a student profile as a guest user (no authentication required).
     * This endpoint allows anonymous users to submit their profile information.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @summary Create guest student profile
     * @param studentRequest The student profile data to create.
     * @returns {StudentProfileResponse} The newly created student profile.
     * @throws {ValidationException} If the min budget is greater than the max budget.
     */
    @Middlewares(validateDTO(StudentRequest))
    @Post("guest")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @SuccessResponse(HttpStatus.CREATED, "Successfully create student")
    public async createStudentProfile(
        @Body() studentRequest: StudentRequest,
    ): Promise<StudentProfileResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.createStudentEntity(studentRequest);
        return StudentMapper.toStudentProfileResponse(studentEntity);
    }

    /**
     * Create a student profile for the currently authenticated user.
     * The user is identified via their JWT bearer token.
     * Uses TypeORM cascades to save the student and their related awards/certifications in a single operation.
     * @summary Create student profile for authenticated user
     * @param request The authenticated Express request object, containing user details.
     * @param studentRequest The student profile data to create.
     * @returns {StudentProfileResponse} The newly created student profile linked to the user.
     * @throws {ValidationException} If the min budget is greater than the max budget.
     * @throws {EntityNotFoundException} If the user is not found.
     */
    @Middlewares(validateDTO(StudentRequest))
    @Post()
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "User not found")
    @Security("bearerAuth", ["profile:create:own"])
    @SuccessResponse(HttpStatus.CREATED, "Successfully create student profile")
    public async createStudentProfileForUser(
        @Request() request: Express.AuthenticatedRequest,
        @Body() studentRequest: StudentRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.createStudentEntity(
                studentRequest,
                user.id,
            );
        const studentProfileResponse: StudentProfileResponse =
            StudentMapper.toStudentProfileResponse(studentEntity);
        return studentProfileResponse;
    }

    /**
     * Retrieve all student profiles associated with the authenticated user.
     * Results are paginated.
     * @summary Get all profiles for current user
     * @param request The authenticated Express request object.
     * @param pageableQuery Pagination and sorting parameters.
     * @returns {PageResponse<StudentResponse>} A paginated list of the user's student profiles.
     * @throws {ValidationException} If pagination parameters are invalid.
     */
    @Get()
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getAllStudentProfilesByUserId(
        @Request() request: Express.AuthenticatedRequest,
        @Queries() pageableQuery: PageableQuery,
    ): Promise<PageResponse<StudentResponse>> {
        const queryDto = plainToInstance(PageableQuery, pageableQuery);
        const pageRequest = PageRequest.fromQuery(queryDto);

        // Validate the PageRequest
        if (pageRequest.hasValidationErrors()) {
            const errors = pageRequest.getValidationErrors();
            throw new ValidationException(errors);
        }

        const user: Express.User = request.user;
        const studentEntities: Page<StudentEntity> =
            await this.studentService.getAllStudentEntitiesByUserId(
                user.id,
                pageRequest,
            );
        const studentResponsePage: PageResponse<StudentResponse> =
            StudentMapper.toStudentResponsePage(studentEntities);
        return studentResponsePage;
    }

    /**
     * Retrieve a single student profile by its ID for a guest user.
     * Ensures the profile is not owned by any authenticated user.
     * @summary Get a single guest profile by ID
     * @param studentId The UUID of the student profile to retrieve.
     * @returns {StudentProfileResponse} The full student profile including awards and certifications.
     * @throws {EntityNotFoundException} If no matching student profile is found.
     */
    @Get("guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.NOT_FOUND, "Not found")
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getStudentGuest(
        @Path("studentId") studentId: string,
    ): Promise<StudentProfileResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.getStudentEntityByIdAnUserId(studentId);
        return StudentMapper.toStudentProfileResponse(studentEntity);
    }

    /**
     * Retrieve a single student profile by its ID for an authenticated user.
     * The endpoint verifies that the requested profile belongs to the authenticated user.
     * @summary Get a single profile by ID for current user
     * @param studentId The UUID of the student profile to retrieve.
     * @param request The authenticated Express request object.
     * @returns {StudentProfileResponse} The full student profile including awards and certifications.
     * @throws {EntityNotFoundException} If no matching student profile is found.
     */
    @Get("{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getStudentProfileByUserId(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.getStudentEntityByIdAnUserId(
                studentId,
                user.id,
            );
        return StudentMapper.toStudentProfileResponse(studentEntity);
    }

    /**
     * Retrieve a single student profile along with its associated active files for a guest user.
     * Fetches the student profile and only the files with 'active' status.
     * Ensures the profile is not owned by any authenticated user.
     * @summary Get a guest profile with files by ID
     * @param studentId The UUID of the student profile to retrieve.
     * @returns {StudentProfileResponse} The full student profile including associated active files.
     * @throws {EntityNotFoundException} If no matching student profile is found.
     */
    @Get("guest/{studentId}/with-files")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.NOT_FOUND, "Not found")
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile with files",
    )
    public async getStudentProfileGuestWithFiles(
        @Path("studentId") studentId: string,
    ): Promise<StudentProfileResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.getStudentWithFiles(studentId);
        return StudentMapper.toStudentProfileWithFilesResponse(studentEntity);
    }

    /**
     * Retrieve a single student profile along with its associated active files for an authenticated user.
     * The endpoint verifies that the requested profile belongs to the authenticated user.
     * Fetches the student profile and only the files with 'active' status.
     * @summary Get a profile with files by ID for current user
     * @param studentId The UUID of the student profile to retrieve.
     * @param request The authenticated Express request object.
     * @returns {StudentProfileResponse} The full student profile including associated active files.
     * @throws {EntityNotFoundException} If no matching student profile is found or access is denied.
     */
    @Get("{studentId}/with-files")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile with files",
    )
    public async getStudentProfileWithFiles(
        @Path("studentId") studentId: string,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.getStudentWithFiles(studentId, user.id);
        return StudentMapper.toStudentProfileWithFilesResponse(studentEntity);
    }
}
