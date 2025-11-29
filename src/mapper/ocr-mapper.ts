import { plainToInstance } from "class-transformer";

import { OcrResultResponse } from "@/dto/ocr/ocr.dto.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";

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
