import { plainToInstance } from "class-transformer";

import { EnrollmentResponse } from "@/dto/predict/enrollment.response.js";
import { EnrollmentEntity } from "@/entity/enrollment.entity.js";
import { Page } from "@/type/pagination/page.js";

export const EnrollmentMapper = {
    toEnrollmentPage(
        enrollmentEntityPage: Page<EnrollmentEntity>,
    ): Page<EnrollmentResponse> {
        const enrollmentResponses: EnrollmentResponse[] =
            this.toEnrollmentResponseList(enrollmentEntityPage.content);

        return new Page<EnrollmentResponse>(
            enrollmentResponses,
            enrollmentEntityPage.page,
            enrollmentEntityPage.size,
            enrollmentEntityPage.totalElements,
        );
    },

    toEnrollmentResponse(enrollmentEntity: EnrollmentEntity): EnrollmentEntity {
        return plainToInstance(EnrollmentResponse, enrollmentEntity, {
            excludeExtraneousValues: true,
        });
    },

    toEnrollmentResponseList(
        enrollmentEntities: EnrollmentEntity[],
    ): EnrollmentResponse[] {
        return enrollmentEntities.map((entity) =>
            this.toEnrollmentResponse(entity),
        );
    },
};
