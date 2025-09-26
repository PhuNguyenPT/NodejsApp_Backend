import { plainToInstance } from "class-transformer";

import { StudentProfileResponse } from "@/dto/student/student-profile-response.js";
import { StudentResponse } from "@/dto/student/student.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { FileMapper } from "@/mapper/file-mapper.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { PageRequest } from "@/type/pagination/page-request.js";
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
    ): Page<StudentResponse> {
        const studentResponses = this.toStudentResponseList(
            studentEntityPage.content,
        );
        const pageable = PageRequest.of(
            studentEntityPage.getPageNumber(),
            studentEntityPage.size,
            studentEntityPage.sort,
        );
        return PageImpl.of<StudentResponse>(
            studentResponses,
            studentEntityPage.totalElements,
            pageable,
        );
    },
};
