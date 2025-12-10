import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";

import type { IMajorService } from "@/service/major-service.interface.js";

import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { TYPES } from "@/type/container/types.js";
import { MajorGroup } from "@/type/enum/major.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

@injectable()
export class MajorService implements IMajorService {
    constructor(
        @inject(TYPES.MajorGroupRepository)
        private readonly majorGroupRepository: Repository<MajorGroupEntity>,
    ) {}

    public async findMajorGroupEntitiesBy(
        majorGroups: MajorGroup[],
    ): Promise<MajorGroupEntity[]> {
        const majorGroupEntities: MajorGroupEntity[] =
            await this.majorGroupRepository.findBy({
                name: In(majorGroups),
            });
        if (majorGroupEntities.length !== majorGroups.length) {
            const foundNames: string[] = majorGroupEntities.map(
                (entity) => entity.name,
            );
            const missingNames: string[] = majorGroups.filter(
                (major) => !foundNames.includes(major),
            );
            throw new EntityNotFoundException(
                `Major group not found: ${missingNames.join(", ")}`,
            );
        }
        return majorGroupEntities;
    }
}
