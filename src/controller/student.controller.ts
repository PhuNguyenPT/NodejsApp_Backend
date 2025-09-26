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

import { StudentProfileResponse } from "@/dto/student/student-profile-response.js";
import { StudentRequest } from "@/dto/student/student-request.js";
import { StudentResponse } from "@/dto/student/student.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { StudentMapper } from "@/mapper/student-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { StudentService } from "@/service/impl/student.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { PageableQuery, PageRequest } from "@/type/pagination/page-request.js";
import { PageResponse } from "@/type/pagination/page-response.js";
import { Page } from "@/type/pagination/page.interface.js";

@injectable()
@Route("students")
@Tags("Students")
export class StudentController extends Controller {
    constructor(
        @inject(TYPES.StudentService)
        private studentService: StudentService,
    ) {
        super();
    }

    /**
     * Create a student profile as a guest user (no authentication required).
     * This endpoint allows anonymous users to submit their profile information.
     * @summary Create guest student profile
     * @param studentRequest The student profile data to create.
     * @returns The newly created student profile.
     */
    @Middlewares(validateDTO(StudentRequest))
    @Post("guest")
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
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
     * @summary Create student profile for authenticated user
     * @param request The authenticated Express request object, containing user details.
     * @param studentRequest The student profile data to create.
     * @returns The newly created student profile linked to the user.
     */
    @Middlewares(validateDTO(StudentRequest))
    @Post()
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["profile:create:own"])
    @SuccessResponse(HttpStatus.CREATED, "Successfully create student profile")
    public async createStudentProfileForUser(
        @Request() request: AuthenticatedRequest,
        @Body() studentRequest: StudentRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.createStudentEntityByUserId(
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
     * @returns A paginated list of the user's student profiles.
     */
    @Get()
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getAllStudentProfilesByUserId(
        @Request() request: AuthenticatedRequest,
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
     * @summary Get a single guest profile by ID
     * @param studentId The UUID of the student profile to retrieve.
     * @returns The full student profile including awards and certifications.
     */
    @Get("guest/{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getStudentGuest(
        @Path() studentId: string,
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
     * @returns The full student profile including awards and certifications.
     */
    @Get("{studentId}")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getStudentProfileByUserId(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
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
     * @summary Get a guest profile with files by ID
     * @param studentId The UUID of the student profile to retrieve.
     * @returns The full student profile including associated files.
     */
    @Get("guest/{studentId}/with-files")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile with files",
    )
    public async getStudentProfileGuestWithFiles(
        @Path() studentId: string,
    ): Promise<StudentProfileResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.getStudentGuestWithFiles(studentId);
        return StudentMapper.toStudentProfileWithFilesResponse(studentEntity);
    }

    /**
     * Retrieve a single student profile along with its associated active files for an authenticated user.
     * The endpoint verifies that the requested profile belongs to the authenticated user.
     * @summary Get a profile with files by ID for current user
     * @param studentId The UUID of the student profile to retrieve.
     * @param request The authenticated Express request object.
     * @returns The full student profile including associated files.
     */
    @Get("{studentId}/with-files")
    @Middlewares(validateUuidParams("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.NOT_FOUND, "Not found")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile with files",
    )
    public async getStudentProfileWithFiles(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.getStudentWithFiles(studentId, user.id);
        return StudentMapper.toStudentProfileWithFilesResponse(studentEntity);
    }
}
