import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { AwardDTO } from "@/dto/student/award.dto";
import { AwardEntity } from "@/entity/award";
import { TYPES } from "@/type/container/types";

@injectable()
export class AwardService {
    constructor(
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
    ) {}

    public create(awards: AwardDTO[]): AwardEntity[] {
        const awardEntities: AwardEntity[] = awards.map((award) =>
            this.awardRepository.create(award),
        );
        return awardEntities;
    }
}
