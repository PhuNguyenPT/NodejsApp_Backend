import { Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

import { InterCerEnum } from "./inter-cert.enum.js";

export class InterCer {
    @Expose()
    @IsNotEmpty()
    @IsString()
    name!: InterCerEnum;

    @Expose()
    @IsNotEmpty()
    @IsString()
    score!: string;
}
