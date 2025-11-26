import { Expose } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class DGNL {
    @Expose()
    @IsInt()
    @Max(400)
    @Min(0)
    language_score!: number;

    @Expose()
    @IsInt()
    @Max(300)
    @Min(0)
    math_score!: number;

    @Expose()
    @IsInt()
    @Max(500)
    @Min(0)
    science_logic!: number;
}
