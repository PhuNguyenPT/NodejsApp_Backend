import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { CEFR, CertificationEntity } from "@/entity/certification";
import { TYPES } from "@/type/container/types";
import { CCNNType, ExamType } from "@/type/enum/exam";
import { ValidationException } from "@/type/exception/validation.exception";

@injectable()
export class CertificationService {
    constructor(
        @inject(TYPES.CertificationRepository)
        private certificationRepository: Repository<CertificationEntity>,
    ) {}

    /**
     * Get CEFR level based on exam type and level
     * @param examType - The type of the exam
     * @param level - The score or level of the exam
     * @returns CEFR level or undefined if not applicable
     */
    public getCEFRLevel(examType: ExamType, level: string): CEFR | undefined {
        const numberLevel = parseFloat(level);
        if (isNaN(numberLevel)) {
            throw new ValidationException({
                level: `Invalid level format: ${level}`,
            });
        }
        // First check if it's a CCNN type exam
        if (examType.type === "CCNN") {
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
                    return undefined; // Unsupported CCNN type
            }
        }

        // Handle other exam types (CCQT, DGNL) if needed
        // For now, these don't have CEFR mappings based on your current implementation
        throw new ValidationException({
            examType: `Unsupported exam type: ${examType.type}, value: ${examType.value}`,
        });
    }

    private get_IELTS_CEFR_level(level: number): CEFR | undefined {
        if (level < 1.0 || level > 9.0) {
            return undefined;
        } else if (1.0 <= level && level < 3.5) {
            return CEFR.A1;
        } else if (3.5 <= level && level < 4.0) {
            return CEFR.A2;
        } else if (4.0 <= level && level <= 5.0) {
            return CEFR.B1;
        } else if (5.5 <= level && level <= 6.5) {
            return CEFR.B2;
        } else if (7.0 <= level && level <= 8.0) {
            return CEFR.C1;
        } else if (8.0 < level && level <= 9.0) {
            return CEFR.C2;
        } else {
            throw new ValidationException({
                level: `Invalid IELTS level: ${level.toString()}`,
            });
        }
    }

    private get_TOEFL_CBT_level(level: number): CEFR | undefined {
        if (level < 33 || level > 677) {
            return undefined;
        } else if (33 <= level && level <= 60) {
            return CEFR.A1;
        } else if (63 <= level && level <= 90) {
            return CEFR.A2;
        } else if (93 <= level && level <= 150) {
            return CEFR.B1;
        } else if (153 <= level && level <= 210) {
            return CEFR.B2;
        } else if (213 <= level && level <= 240) {
            return CEFR.C1;
        } else if (243 <= level && level <= 300) {
            return CEFR.C2;
        } else {
            throw new ValidationException({
                level: `Invalid TOEFL CBT level: ${level.toString()}`,
            });
        }
    }

    private get_TOEFL_iBT_level(level: number): CEFR | undefined {
        if (level < 0 || level > 120) {
            return undefined;
        } else if (0 <= level && level < 7) {
            return CEFR.A1;
        } else if (7 <= level && level < 14) {
            return CEFR.A2;
        } else if (14 <= level && level < 50) {
            return CEFR.B1;
        } else if (51 <= level && level < 90) {
            return CEFR.B2;
        } else if (91 <= level && level < 114) {
            return CEFR.C1;
        } else if (115 <= level && level <= 120) {
            return CEFR.C2;
        } else {
            throw new ValidationException({
                level: `Invalid TOEFL iBT level: ${level.toString()}`,
            });
        }
    }

    private get_TOEFL_Paper_level(level: number): CEFR | undefined {
        if (level < 310 || level > 677) {
            return undefined;
        } else if (310 <= level && level < 347) {
            return CEFR.A1;
        } else if (347 <= level && level < 397) {
            return CEFR.A2;
        } else if (397 <= level && level < 477) {
            return CEFR.B1;
        } else if (477 <= level && level < 507) {
            return CEFR.B2;
        } else if (507 <= level && level < 560) {
            return CEFR.C1;
        } else if (560 <= level && level <= 677) {
            return CEFR.C2;
        } else {
            throw new ValidationException({
                level: `Invalid TOEFL Paper level: ${level.toString()}`,
            });
        }
    }

    private get_TOEIC_level(level: number): CEFR | undefined {
        if (level < 60 || level > 990) {
            return undefined;
        } else if (60 <= level && level < 225) {
            return CEFR.A1;
        } else if (225 <= level && level < 550) {
            return CEFR.A2;
        } else if (550 <= level && level < 785) {
            return CEFR.B1;
        } else if (785 <= level && level < 945) {
            return CEFR.B2;
        } else if (945 <= level && level <= 980) {
            return CEFR.C1;
        } else if (980 < level && level <= 990) {
            return CEFR.C2;
        } else {
            throw new ValidationException({
                level: `Invalid TOEIC level: ${level.toString()}`,
            });
        }
    }
}
