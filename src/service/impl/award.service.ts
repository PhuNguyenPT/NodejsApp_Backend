import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { AwardRequest } from "@/dto/student/award-request.js";
import { AwardEntity } from "@/entity/award.entity.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";

import { IAwardService } from "../award-service.interface.js";

@injectable()
export class AwardService implements IAwardService {
    constructor(
        @inject(TYPES.AwardRepository)
        private readonly awardRepository: Repository<AwardEntity>,
    ) {}

    public createAwardEntities(awards: AwardRequest[]): AwardEntity[] {
        const awardEntities: AwardEntity[] = awards.map((award) =>
            this.createAwardEntity(award),
        );
        return awardEntities;
    }
    public createAwardEntity(awardRequest: AwardRequest): AwardEntity {
        const awardEntity: AwardEntity =
            this.awardRepository.create(awardRequest);
        awardEntity.createdBy ??= Role.ANONYMOUS;
        return awardEntity;
    }
}
