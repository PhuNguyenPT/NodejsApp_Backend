import type {
    AdmissionEntity,
    AdmissionField,
} from "@/entity/uni_guide/admission.entity.js";
import type { AdmissionQueryOptions } from "@/service/impl/admission.service.js";
import type { UUID } from "@/type/common/uuid.type.js";
import type { Page } from "@/type/pagination/page.interface.js";
import type { Pageable } from "@/type/pagination/pageable.interface.js";

export interface IAdmissionService {
    getAdmissionsPageByStudentIdAndUserId(
        studentId: UUID,
        pageable: Pageable,
        options: AdmissionQueryOptions,
    ): Promise<Page<AdmissionEntity>>;

    getAllDistinctAdmissionFieldValues(
        studentId: UUID,
        userId?: UUID,
    ): Promise<Record<AdmissionField, (number | string)[]>>;
}
