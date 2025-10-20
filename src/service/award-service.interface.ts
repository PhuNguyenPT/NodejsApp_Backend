import { AwardRequest } from "@/dto/student/award-request.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";

export interface IAwardService {
    createAwardEntities(awards: AwardRequest[]): AwardEntity[];
    createAwardEntity(awardRequest: AwardRequest): AwardEntity;
}
