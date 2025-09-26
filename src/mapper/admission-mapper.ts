import { plainToInstance } from "class-transformer";

import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import { PageResponse } from "@/type/pagination/page-response.js";
import { Page } from "@/type/pagination/page.interface.js";

export const AdmissionMapper = {
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
