import { plainToInstance } from "class-transformer";

import { AptitudeExamResponse } from "@/dto/student/aptitude-exam-response.js";
import { StudentAptitudeExamEntity } from "@/entity/uni_guide/student-aptitude-exam.entity.js";
import { ExamType } from "@/type/enum/exam-type.js";

export const StudentAptitudeExamMapper = {
    /**
     * Maps a StudentAptitudeExamEntity to AptitudeExamResponse
     * Includes VNUHCM component scores when available
     */
    toStudentAptitudeExamResponse(
        entity: StudentAptitudeExamEntity,
    ): AptitudeExamResponse {
        const response = plainToInstance(AptitudeExamResponse, entity, {
            excludeExtraneousValues: true,
        });

        // If it's a VNUHCM exam and has component scores, include them
        if (
            entity.examType === ExamType.VNUHCM &&
            entity.vnuhcmScoreComponents
        ) {
            response.languageScore = entity.vnuhcmScoreComponents.languageScore;
            response.mathScore = entity.vnuhcmScoreComponents.mathScore;
            response.scienceLogic = entity.vnuhcmScoreComponents.scienceLogic;
        }

        return response;
    },
    /**
     * Maps array of StudentAptitudeExamEntity to AptitudeExamResponse array
     */
    toStudentAptitudeExamResponses(
        entities: StudentAptitudeExamEntity[],
    ): AptitudeExamResponse[] {
        return entities.map((entity) =>
            this.toStudentAptitudeExamResponse(entity),
        );
    },
};
