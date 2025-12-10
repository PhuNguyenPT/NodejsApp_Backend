import { EntityManager } from "typeorm";

export interface IPredictionL3ProcessorService {
    processL3PredictionInTransaction(
        manager: EntityManager,
        studentId: string,
        userId?: string,
    ): Promise<void>;
}
