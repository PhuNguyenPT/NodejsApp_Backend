import { plainToInstance } from "class-transformer";

import { AdmissionResponse } from "@/dto/predict/admission-response.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import { Page } from "@/type/pagination/page.js";

export const AdmissionMapper = {
    toAdmissionPage(
        admissionEntityPage: Page<AdmissionEntity>,
    ): Page<AdmissionResponse> {
        const admissionResponses: AdmissionResponse[] =
            this.toAdmissionResponseList(admissionEntityPage.content);

        return new Page<AdmissionResponse>(
            admissionResponses,
            admissionEntityPage.page,
            admissionEntityPage.size,
            admissionEntityPage.totalElements,
        );
    },

    toAdmissionResponse(admissionEntity: AdmissionEntity): AdmissionEntity {
        return plainToInstance(AdmissionResponse, admissionEntity, {
            excludeExtraneousValues: true,
        });
    },

    toAdmissionResponseList(
        admissionEntities: AdmissionEntity[],
    ): AdmissionResponse[] {
        return admissionEntities.map((entity) =>
            this.toAdmissionResponse(entity),
        );
    },
};
