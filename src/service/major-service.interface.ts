import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { MajorGroup } from "@/type/enum/major.js";

export interface IMajorService {
    findMajorGroupEntitiesBy(
        majorGroups: MajorGroup[],
    ): Promise<MajorGroupEntity[]>;
}
