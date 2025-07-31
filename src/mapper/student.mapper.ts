import { plainToInstance } from "class-transformer";

import { StudentResponse } from "@/dto/student/student";
import { StudentProfileResponse } from "@/dto/student/student.profile.response";
import { StudentEntity } from "@/entity/student";
import { Page } from "@/type/pagination/page";

export const StudentMapper = {
    toStudentProfileResponse(
        studentEntity: StudentEntity,
    ): StudentProfileResponse {
        return plainToInstance(StudentProfileResponse, studentEntity, {
            excludeExtraneousValues: true,
        });
    },

    toStudentProfileResponseList(
        studentEntities: StudentEntity[],
    ): StudentProfileResponse[] {
        return studentEntities.map((studentEntity) =>
            this.toStudentProfileResponse(studentEntity),
        );
    },

    toStudentResponse(studentEntity: StudentEntity): StudentResponse {
        return plainToInstance(StudentResponse, studentEntity, {
            excludeExtraneousValues: true,
        });
    },

    toStudentResponseList(studentEntities: StudentEntity[]): StudentResponse[] {
        return studentEntities.map((studentEntity) =>
            this.toStudentResponse(studentEntity),
        );
    },

    toStudentResponsePage(
        studentEntityPage: Page<StudentEntity>,
    ): Page<StudentResponse> {
        const studentResponses = this.toStudentResponseList(
            studentEntityPage.content,
        );

        return new Page<StudentResponse>(
            studentResponses,
            studentEntityPage.page,
            studentEntityPage.size,
            studentEntityPage.totalElements,
        );
    },
};
