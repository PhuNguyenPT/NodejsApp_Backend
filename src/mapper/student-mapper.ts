import { plainToInstance } from "class-transformer";

import { StudentProfileResponse } from "@/dto/student/student-profile-response.js";
import { StudentResponse } from "@/dto/student/student.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { FileMapper } from "@/mapper/file-mapper.js";
import { PageResponse } from "@/type/pagination/page-response.js";
import { Page } from "@/type/pagination/page.interface.js";

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

    toStudentProfileWithFilesResponse(
        studentEntity: StudentEntity,
    ): StudentProfileResponse {
        const studentProfileResponse: StudentProfileResponse = plainToInstance(
            StudentProfileResponse,
            studentEntity,
            {
                excludeExtraneousValues: true,
            },
        );
        if (studentEntity.files) {
            studentProfileResponse.fileResponses =
                FileMapper.toFileResponseList(studentEntity.files);
        }
        return studentProfileResponse;
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
    ): PageResponse<StudentResponse> {
        const studentResponses = this.toStudentResponseList(
            studentEntityPage.content,
        );

        return PageResponse.fromPage({
            ...studentEntityPage,
            content: studentResponses,
        });
    },
};
