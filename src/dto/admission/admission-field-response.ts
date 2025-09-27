import { Expose } from "class-transformer";

import { AdmissionSearchField } from "@/entity/admission.entity.js";

export class AdmissionFieldResponse {
    @Expose()
    fields!: Record<AdmissionSearchField, (number | string)[]>;
}
