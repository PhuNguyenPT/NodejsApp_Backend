import { plainToInstance } from "class-transformer";

import { OcrResultResponse } from "@/dto/predict/ocr.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";

export const OcrResultMapper = {
    toResponse(ocrResultEntity: OcrResultEntity): OcrResultResponse {
        return plainToInstance(OcrResultResponse, ocrResultEntity, {
            excludeExtraneousValues: true,
        });
    },
    toResponseList(ocrResultEntities: OcrResultEntity[]): OcrResultResponse[] {
        return ocrResultEntities.map((entity) => this.toResponse(entity));
    },
};
