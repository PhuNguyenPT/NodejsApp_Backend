import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { CertificationRequest } from "@/dto/student/certification-request.js";
import { CEFR, CertificationEntity } from "@/entity/certification.entity.js";
import { TYPES } from "@/type/container/types.js";
import {
    CCNNType,
    CCQTType,
    ExamType,
    handleExamValidation,
} from "@/type/enum/exam.js";

@injectable()
export class CertificationService {
    constructor(
        @inject(TYPES.CertificationRepository)
        private readonly certificationRepository: Repository<CertificationEntity>,
    ) {}

    public createCertificationEntities(
        certificationRequests: CertificationRequest[],
    ): CertificationEntity[] {
        const certificationEntities: CertificationEntity[] =
            certificationRequests.map((certificationRequest) =>
                this.createCertificationEntity(certificationRequest),
            );
        return certificationEntities;
    }

    public createCertificationEntity(
        certificationRequest: CertificationRequest,
    ): CertificationEntity {
        handleExamValidation(
            certificationRequest.examType,
            certificationRequest.level,
        );

        const certificationEntity: CertificationEntity =
            this.certificationRepository.create(certificationRequest);

        certificationEntity.cefr = this.getCEFRLevel(
            certificationRequest.examType,
            certificationRequest.level,
        );

        const isExcludedExam: boolean = this.isExcludedExamType(
            certificationRequest.examType,
        );

        if (!isExcludedExam) {
            certificationEntity.name ??= certificationRequest.examType.value;
        }

        return certificationEntity;
    }

    /**
     * Get CEFR level based on exam type and level
     * @param examType - The type of the exam
     * @param level - The score or level of the exam
     * @returns CEFR level or undefined if not applicable
     */
    public getCEFRLevel(examType: ExamType, level: string): CEFR | undefined {
        // For CCNN exams, level must be a number. For others, it might not apply.
        if (examType.type !== "CCNN") {
            return undefined;
        }

        const numberLevel = parseFloat(level);
        if (isNaN(numberLevel)) {
            // If level is not a number for a CCNN exam, it's invalid for CEFR mapping.
            return undefined;
        }

        switch (examType.value) {
            case CCNNType.IELTS:
                return this.get_IELTS_CEFR_level(numberLevel);
            case CCNNType.TOEFL_CBT:
                return this.get_TOEFL_CBT_level(numberLevel);
            case CCNNType.TOEFL_iBT:
                return this.get_TOEFL_iBT_level(numberLevel);
            case CCNNType.TOEFL_Paper:
                return this.get_TOEFL_Paper_level(numberLevel);
            case CCNNType.TOEIC:
                return this.get_TOEIC_level(numberLevel);
            default:
                return undefined; // Unsupported CCNN type for CEFR mapping
        }
    }

    private get_IELTS_CEFR_level(level: number): CEFR | undefined {
        if (level < 1.0 || level > 9.0) {
            return undefined;
        } else if (level < 3.5) {
            return CEFR.A1;
        } else if (level < 4.0) {
            return CEFR.A2;
        } else if (level <= 5.0) {
            return CEFR.B1;
        } else if (level <= 6.5) {
            return CEFR.B2;
        } else if (level <= 8.0) {
            return CEFR.C1;
        } else if (level <= 9.0) {
            return CEFR.C2;
        }
        return undefined;
    }

    private get_TOEFL_CBT_level(level: number): CEFR | undefined {
        if (level < 33 || level > 300) {
            return undefined;
        } else if (level <= 60) {
            return CEFR.A1;
        } else if (level <= 90) {
            return CEFR.A2;
        } else if (level <= 150) {
            return CEFR.B1;
        } else if (level <= 210) {
            return CEFR.B2;
        } else if (level <= 240) {
            return CEFR.C1;
        } else if (level <= 300) {
            return CEFR.C2;
        }
        return undefined;
    }

    private get_TOEFL_iBT_level(level: number): CEFR | undefined {
        if (level < 0 || level > 120) {
            return undefined;
        } else if (level < 7) {
            return CEFR.A1;
        } else if (level < 14) {
            return CEFR.A2;
        } else if (level < 50) {
            return CEFR.B1;
        } else if (level < 90) {
            return CEFR.B2;
        } else if (level < 114) {
            return CEFR.C1;
        } else if (level <= 120) {
            return CEFR.C2;
        }
        return undefined;
    }

    private get_TOEFL_Paper_level(level: number): CEFR | undefined {
        if (level < 310 || level > 677) {
            return undefined;
        } else if (level < 347) {
            return CEFR.A1;
        } else if (level < 397) {
            return CEFR.A2;
        } else if (level < 477) {
            return CEFR.B1;
        } else if (level < 507) {
            return CEFR.B2;
        } else if (level < 560) {
            return CEFR.C1;
        } else if (level <= 677) {
            return CEFR.C2;
        }
        return undefined;
    }

    private get_TOEIC_level(level: number): CEFR | undefined {
        if (level < 60 || level > 990) {
            return undefined;
        } else if (level < 225) {
            return CEFR.A1;
        } else if (level < 550) {
            return CEFR.A2;
        } else if (level < 785) {
            return CEFR.B1;
        } else if (level < 945) {
            return CEFR.B2;
        } else if (level <= 980) {
            return CEFR.C1;
        } else if (level <= 990) {
            return CEFR.C2;
        }
        return undefined;
    }

    private isExcludedExamType(examType: ExamType): boolean {
        return (
            // Case 1: The exam type is "CCQT" and the value is "OTHER"
            (examType.type === "CCQT" && examType.value === CCQTType.OTHER) ||
            // Case 2: The exam type is "CCNN" and the value is "OTHER"
            (examType.type === "CCNN" && examType.value === CCNNType.OTHER)
        );
    }
}
