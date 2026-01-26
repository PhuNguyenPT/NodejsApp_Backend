import type { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IPredictionResultService {
    findByStudentIdAndUserId(
        studentId: UUID,
        userId?: UUID,
    ): Promise<PredictionResultEntity>;
}
