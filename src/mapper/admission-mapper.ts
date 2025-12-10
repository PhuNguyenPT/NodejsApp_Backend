import { plainToInstance } from "class-transformer";

import type { Page } from "@/type/pagination/page.interface.js";

import { AdmissionFieldResponse } from "@/dto/admission/admission-field-response.js";
import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import {
    AdmissionEntity,
    type AdmissionField,
} from "@/entity/uni_guide/admission.entity.js";
import { PageResponse } from "@/type/pagination/page-response.js";

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
