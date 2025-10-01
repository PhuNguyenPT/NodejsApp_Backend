import { StudentRequest } from "@/dto/student/student-request.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

export interface IStudentService {
    createStudentEntity(
        studentRequest: StudentRequest,
        userId?: string,
    ): Promise<StudentEntity>;
    getAllStudentEntitiesByUserId(
        userId: string,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>>;
    getStudentEntityByIdAnUserId(
        id: string,
        userId?: string,
    ): Promise<StudentEntity>;
    getStudentWithFiles(
        studentId: string,
        userId?: string,
    ): Promise<StudentEntity>;
}
