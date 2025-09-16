import { Expose, Type } from "class-transformer";

export class AdmissionResponse {
    @Expose()
    @Type(() => String)
    admissionCode!: string;

    @Expose()
    @Type(() => String)
    admissionType!: string;

    @Expose()
    @Type(() => String)
    admissionTypeName!: string;

    @Expose()
    @Type(() => String)
    id!: string;

    @Expose()
    @Type(() => String)
    majorCode!: number;

    @Expose()
    @Type(() => String)
    majorName!: string;

    @Expose()
    @Type(() => String)
    province!: string;

    @Expose()
    @Type(() => String)
    studyProgram!: string;

    @Expose()
    @Type(() => String)
    subjectCombination!: string;

    @Expose()
    @Type(() => String)
    tuitionFee!: number;

    @Expose()
    @Type(() => String)
    uniCode!: string;

    @Expose()
    @Type(() => String)
    uniName!: string;

    @Expose()
    @Type(() => String)
    uniType!: string;

    @Expose()
    @Type(() => String)
    uniWebLink!: string;
}
