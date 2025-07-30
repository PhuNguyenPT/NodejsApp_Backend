import { inject, injectable } from "inversify";
import {
    Body,
    Controller,
    Middlewares,
    Path,
    Post,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import { StudentInfoDTO } from "@/dto/student/student.info";
import { StudentEntity } from "@/entity/student";
import { StudentMapper } from "@/mapper/student.mapper";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware";
import validateDTO from "@/middleware/validation.middleware";
import { StudentService } from "@/service/student.service";
import { TYPES } from "@/type/container/types";
import { HttpStatus } from "@/type/enum/http.status";
import { AccessDeniedException } from "@/type/exception/access.denied.exception";
import { AuthenticatedRequest } from "@/type/express/express";

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

    @Middlewares(validateDTO(StudentInfoDTO))
    @Post()
    @Response("400", "Validation error")
    @SuccessResponse("200", "Successfully create student")
    public async createStudentProfile(
        @Body() studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentInfoDTO> {
        const studentEntity: StudentEntity =
            await this.studentService.createStudentProfile(studentInfoDTO);
        return StudentMapper.toStudentInfoDTO(studentEntity);
    }

    @Middlewares(validateUuidParam("userId"), validateDTO(StudentInfoDTO))
    @Post("{userId}")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.FORBIDDEN, "Access denied")
    @Security("bearerAuth", ["profile:create:own"])
    @SuccessResponse("200", "Successfully create student with user id")
    public async createStudentProfileByUserId(
        @Path() userId: string,
        @Request() request: AuthenticatedRequest,
        @Body() studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentInfoDTO> {
        if (userId !== request.user.id) {
            throw new AccessDeniedException(
                `Invalid user id ${userId} not the same as validated user id ${request.user.id}`,
            );
        }
        const user: Express.User = request.user;
        const studentEntity: StudentEntity =
            await this.studentService.createStudentProfileByUserId(
                studentInfoDTO,
                user.id,
            );
        return StudentMapper.toStudentInfoDTO(studentEntity);
    }
}
