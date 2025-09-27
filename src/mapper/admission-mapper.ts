import { plainToInstance } from "class-transformer";

import { AdmissionFieldResponse } from "@/dto/admission/admission-field-response.js";
import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import { AdmissionEntity, AdmissionField } from "@/entity/admission.entity.js";
import { PageResponse } from "@/type/pagination/page-response.js";
import { Page } from "@/type/pagination/page.interface.js";

export const AdmissionMapper = {
    toAdmissionFieldResponse(
        fields: Record<AdmissionField, (number | string)[]>,
    ): AdmissionFieldResponse {
        return plainToInstance(
            AdmissionFieldResponse,
            { fields: fields },
            {
                excludeExtraneousValues: true,
            },
        );
    },

    toAdmissionPage(
        admissionEntityPage: Page<AdmissionEntity>,
    ): PageResponse<AdmissionResponse> {
        const admissionResponses: AdmissionResponse[] =
            this.toAdmissionResponseList(admissionEntityPage.content);

        return PageResponse.fromPage({
            ...admissionEntityPage,
            content: admissionResponses,
        });
    },

    toAdmissionResponse(admissionEntity: AdmissionEntity): AdmissionResponse {
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
