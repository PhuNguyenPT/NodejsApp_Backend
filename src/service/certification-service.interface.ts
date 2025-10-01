import { CertificationRequest } from "@/dto/student/certification-request.js";
import { CEFR, CertificationEntity } from "@/entity/certification.entity.js";
import { ExamType } from "@/type/enum/exam.js";

export interface ICertificationService {
    createCertificationEntities(
        certificationRequests: CertificationRequest[],
    ): CertificationEntity[];

    createCertificationEntity(
        certificationRequest: CertificationRequest,
    ): CertificationEntity;

    getCEFRLevel(examType: ExamType, level: string): CEFR | undefined;
}
