import type { CertificationRequest } from "@/dto/student/certification-request.js";
import type {
    CEFR,
    CertificationEntity,
} from "@/entity/uni_guide/certification.entity.js";
import type { ExamType } from "@/type/enum/exam-type.js";

export interface ICertificationService {
    createCertificationEntities(
        certificationRequests: CertificationRequest[],
    ): CertificationEntity[];

    createCertificationEntity(
        certificationRequest: CertificationRequest,
    ): CertificationEntity;

    getCEFRLevel(examType: ExamType, level: string): CEFR | undefined;
}
