import { Expose } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { MajorGroup } from "@/type/enum/major.js";

export class MajorGroupDTO {
    /**
     * The 3-digit major group code (e.g., "714", "721")
     * @example "714"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    code!: string;

    /**
     * The Vietnamese name of the major group
     * @example "Khoa học giáo dục và đào tạo giáo viên"
     */
    @Expose()
    @IsEnum(MajorGroup)
    @IsNotEmpty()
    name!: MajorGroup;
}
