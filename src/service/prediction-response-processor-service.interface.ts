import type { EntityManager } from "typeorm";

import type { UUID } from "@/type/common/uuid.type.js";

export interface IPredictionL3ProcessorService {
    processL3PredictionInTransaction(
        manager: EntityManager,
        studentId: UUID,
        userId?: UUID,
    ): Promise<void>;
}
