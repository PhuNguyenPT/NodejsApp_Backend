import {
    AdmissionEntity,
    AdmissionField,
} from "@/entity/uni_guide/admission.entity.js";
import { AdmissionQueryOptions } from "@/service/impl/admission.service.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

export interface IAdmissionService {
    getAdmissionsPageByStudentIdAndUserId(
        studentId: string,
        pageable: Pageable,
        options: AdmissionQueryOptions,
    ): Promise<Page<AdmissionEntity>>;

    getAllDistinctAdmissionFieldValues(
        studentId: string,
        userId?: string,
    ): Promise<Record<AdmissionField, (number | string)[]>>;
}
