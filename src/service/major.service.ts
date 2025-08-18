import { inject, injectable } from "inversify";
import { EntityNotFoundError, In, Repository } from "typeorm";

import { MajorEntity } from "@/entity/major.entity.js";
import { MajorGroupEntity } from "@/entity/major.group.entity.js";
import { TYPES } from "@/type/container/types.js";
import { MajorGroup } from "@/type/enum/major.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";

@injectable()
export class MajorService {
    constructor(
        @inject(TYPES.MajorRepository)
        private readonly majorRepository: Repository<MajorEntity>,
        @inject(TYPES.MajorGroupRepository)
        private readonly majorGroupRepository: Repository<MajorGroupEntity>,
    ) {}

    public async findMajorGroupEntitiesBy(
        majorGroups: MajorGroup[],
    ): Promise<MajorGroupEntity[]> {
        const majorGroupEntities: MajorGroupEntity[] =
            await this.majorGroupRepository.findBy({
                englishName: In(majorGroups),
            });
        if (majorGroupEntities.length !== majorGroups.length) {
            const foundNames: string[] = majorGroupEntities.map(
                (entity) => entity.englishName,
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

    public async findMajorGroupEntityBy(
        majorGroup: MajorGroup,
    ): Promise<MajorGroupEntity> {
        try {
            const majorGroupEntity: MajorGroupEntity =
                await this.majorGroupRepository.findOneByOrFail({
                    englishName: majorGroup,
                });
            return majorGroupEntity;
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                throw new EntityNotFoundException(
                    `Major group with name ${majorGroup}`,
                );
            }
            throw error;
        }
    }
}
