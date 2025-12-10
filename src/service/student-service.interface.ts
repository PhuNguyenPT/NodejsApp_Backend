import type { StudentRequest } from "@/dto/student/student-request.js";
import type { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

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
