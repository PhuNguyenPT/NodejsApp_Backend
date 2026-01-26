import type { StudentRequest } from "@/dto/student/student-request.js";
import type { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

export interface IStudentService {
    createStudentEntity(
        studentRequest: StudentRequest,
        userId?: UUID,
    ): Promise<StudentEntity>;
    getAllStudentEntitiesByUserId(
        userId: UUID,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>>;
    getStudentEntityByIdAnUserId(
        id: UUID,
        userId?: UUID,
    ): Promise<StudentEntity>;
    getStudentWithFiles(studentId: UUID, userId?: UUID): Promise<StudentEntity>;
}
