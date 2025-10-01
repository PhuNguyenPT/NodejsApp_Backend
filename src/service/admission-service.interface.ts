import { AdmissionEntity, AdmissionField } from "@/entity/admission.entity.js";
import { Page } from "@/type/pagination/page.interface.js";
import { Pageable } from "@/type/pagination/pageable.interface.js";

import { AdmissionQueryOptions } from "./impl/admission.service.js";

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
