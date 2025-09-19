import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { AwardRequest } from "@/dto/student/award-request.js";
import { AwardEntity } from "@/entity/award.entity.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class AwardService {
    constructor(
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
    ) {}

    public create(awards: AwardRequest[]): AwardEntity[] {
        const awardEntities: AwardEntity[] = awards.map((award) =>
            this.awardRepository.create(award),
        );
        return awardEntities;
    }
}
