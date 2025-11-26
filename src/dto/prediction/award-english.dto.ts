import { Expose } from "class-transformer";
import { IsIn, IsString } from "class-validator";

export class AwardEnglish {
    @Expose()
    @IsIn(["A1", "A2", "B1", "B2", "C1", "C2"])
    @IsString()
    level!: string;
}
