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

import { StudentInfoDTO } from "@/dto/student/student.info.js";
import { StudentResponse } from "@/dto/student/student.js";
import { StudentProfileResponse } from "@/dto/student/student.profile.response.js";
import { StudentEntity } from "@/entity/student.js";
import { StudentMapper } from "@/mapper/student.mapper.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware.js";
import validateDTO from "@/middleware/validation.middleware.js";
import { StudentService } from "@/service/student.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { Page } from "@/type/pagination/page.js";
import { Pageable } from "@/type/pagination/pageable.js";

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
     * Create anonymous student profile (no authentication required)
     */
    @Middlewares(validateDTO(StudentInfoDTO))
    @Post()
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @SuccessResponse(HttpStatus.CREATED, "Successfully create student")
    public async createStudentProfile(
        @Body() studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentProfileResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.createStudentEntity(studentInfoDTO);
        return StudentMapper.toStudentProfileResponse(studentEntity);
    }

    /**
     * Create student profile for authenticated user
     * No userId path parameter needed - user is identified through JWT
     */
    @Middlewares(validateDTO(StudentInfoDTO))
    @Post("profiles")
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["profile:create:own"])
    @SuccessResponse(HttpStatus.CREATED, "Successfully create student profile")
    public async createStudentProfileForUser(
        @Request() request: AuthenticatedRequest,
        @Body() studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.createStudentEntityByUserId(
                studentInfoDTO,
                user.id,
            );
        const studentProfileResponse: StudentProfileResponse =
            StudentMapper.toStudentProfileResponse(studentEntity);
        return studentProfileResponse;
    }

    /**
     * Get all student profiles for authenticated user
     * No userId path parameter needed - user is identified through JWT
     */
    @Get("profiles")
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getAllStudentProfilesByUserId(
        @Request() request: AuthenticatedRequest,
        @Queries() pageableQuery: Pageable,
    ): Promise<Page<StudentResponse>> {
        const pageable = plainToInstance(Pageable, pageableQuery);
        if (!pageable.isValid()) {
            const errors = pageable.getValidationErrors();
            throw new ValidationException(errors); // Now passes Record<string, string> directly
        }
        const user: Express.User = request.user;
        const studentEntities: Page<StudentEntity> =
            await this.studentService.getAllStudentEntitiesByUserId(
                user.id,
                pageable,
            );
        const studentResponsePage: Page<StudentResponse> =
            StudentMapper.toStudentResponsePage(studentEntities);
        return studentResponsePage;
    }

    /**
     * Get single student profile for authenticated user (returns full profile with awards/certifications)
     * This assumes a user has only one profile - if multiple profiles are allowed, you'd need a different approach
     */
    @Get("profiles/{profileId}")
    @Middlewares(validateUuidParam("profileId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieve student profiles")
    public async getStudentProfileByUserId(
        @Path() profileId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.getStudentEntityByUserId(
                profileId,
                user.id,
            );
        return StudentMapper.toStudentProfileResponse(studentEntity);
    }

    @Get("profiles/{profileId}/with-files")
    @Middlewares(validateUuidParam("profileId"))
    @Produces("application/json")
    @Security("bearerAuth", ["profile:read:own"])
    @SuccessResponse(
        HttpStatus.OK,
        "Successfully retrieve student profile with files",
    )
    public async getStudentProfileWithFiles(
        @Path() profileId: string,
        @Request() request: AuthenticatedRequest,
    ): Promise<StudentProfileResponse> {
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.getStudentWithFiles(profileId, user.id);
        return StudentMapper.toStudentProfileWithFilesResponse(studentEntity);
    }
}
