import { Expose } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";

import { HsgSubject } from "./hsg-subject.enum.js";

export class AwardQG {
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    level!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    subject!: HsgSubject;
}
