import type { StudentRequest } from "@/dto/student/student-request.js";
import type { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

export interface IStudentService {
    /**
     * Creates a student profile for an anonymous user or linked to an authenticated user.
     */
    create(
        studentRequest: StudentRequest,
        userId?: UUID,
    ): Promise<StudentEntity>;

    /**
     * Retrieves a paginated list of student profiles for a specific user.
     */
    getAllByUserId(
        userId: UUID,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>>;

    /**
     * Retrieves a single student profile by its ID and user ID.
     */
    getByIdAndUserId(id: UUID, userId?: UUID): Promise<StudentEntity>;

    /**
     * Retrieves a student profile by ID along with its associated active files.
     */
    getWithFiles(studentId: UUID, userId?: UUID): Promise<StudentEntity>;
}
