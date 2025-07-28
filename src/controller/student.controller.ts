import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { Body, Controller, Middlewares, Post, Route, Tags } from "tsoa";

import { StudentInfoDTO } from "@/dto/student/student.info";
import { StudentResponse } from "@/dto/student/student.response";
import { StudentEntity } from "@/entity/student";
import validateDTO from "@/middleware/validation.middleware";
import { StudentService } from "@/service/student.service";
import { TYPES } from "@/type/container/types";

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
    public async createStudentProfile(
        @Body() studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentResponse> {
        const studentEntity: StudentEntity =
            await this.studentService.createStudentProfile(studentInfoDTO);
        return plainToInstance(StudentResponse, studentEntity);
    }
}
