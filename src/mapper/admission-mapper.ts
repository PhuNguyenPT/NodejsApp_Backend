import { plainToInstance } from "class-transformer";

import { AdmissionResponse } from "@/dto/admission/admission-response.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import { PageImpl } from "@/type/pagination/page-impl.js";
import { PageRequest } from "@/type/pagination/page-request.js";
import { Page } from "@/type/pagination/page.interface.js";

export const AdmissionMapper = {
    toAdmissionPage(
        admissionEntityPage: Page<AdmissionEntity>,
    ): Page<AdmissionResponse> {
        const admissionResponses: AdmissionResponse[] =
            this.toAdmissionResponseList(admissionEntityPage.content);

        const pageable = PageRequest.of(
            admissionEntityPage.getPageNumber(),
            admissionEntityPage.size,
            admissionEntityPage.sort,
        );

        return PageImpl.of<AdmissionResponse>(
            admissionResponses,
            admissionEntityPage.totalElements,
            pageable,
        );
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
