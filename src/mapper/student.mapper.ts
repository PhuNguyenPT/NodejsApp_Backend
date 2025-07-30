import { plainToInstance } from "class-transformer";

import { StudentInfoDTO } from "@/dto/student/student.info";
import { StudentEntity } from "@/entity/student";

export const StudentMapper = {
    toStudentInfoDTO(studentEntity: StudentEntity): StudentInfoDTO {
        return plainToInstance(StudentInfoDTO, studentEntity, {
            excludeExtraneousValues: true,
        });
    },
};
