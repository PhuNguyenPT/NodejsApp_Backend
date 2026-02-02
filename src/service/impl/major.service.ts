import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";

import type { IMajorService } from "@/service/major-service.interface.js";

import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { TYPES } from "@/type/container/types.js";
import { MajorGroup } from "@/type/enum/major.enum.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";

@injectable()
export class MajorService implements IMajorService {
    constructor(
        @inject(TYPES.MajorGroupRepository)
        private readonly majorGroupRepository: Repository<MajorGroupEntity>,
    ) {}

    public async findMajorGroupEntitiesBy(
        majorGroups: MajorGroup[],
    ): Promise<MajorGroupEntity[]> {
        if (!Array.isArray(majorGroups)) {
            throw new IllegalArgumentException("majorGroups must be an array");
        }
        const uniqueMajorGroups = [...new Set(majorGroups)];

        const majorGroupEntities: MajorGroupEntity[] =
            await this.majorGroupRepository.findBy({
                name: In(uniqueMajorGroups),
            });

        if (majorGroupEntities.length !== uniqueMajorGroups.length) {
            const foundNames: string[] = majorGroupEntities.map(
                (entity) => entity.name,
            );
            const missingNames: string[] = uniqueMajorGroups.filter(
                (major) => !foundNames.includes(major),
            );
            throw new EntityNotFoundException(
                `Major group not found: ${missingNames.join(", ")}`,
            );
        }
        return majorGroupEntities;
    }
}
