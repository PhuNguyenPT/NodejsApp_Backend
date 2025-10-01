import { MajorGroupEntity } from "@/entity/major-group.entity.js";
import { MajorGroup } from "@/type/enum/major.js";

export interface IMajorService {
    findMajorGroupEntitiesBy(
        majorGroups: MajorGroup[],
    ): Promise<MajorGroupEntity[]>;
}
