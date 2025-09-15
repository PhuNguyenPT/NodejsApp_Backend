import { Expose, Type } from "class-transformer";

export class EnrollmentResponse {
    @Expose()
    @Type(() => String)
    enrollCode!: string;

    @Expose()
    @Type(() => String)
    enrollType!: string;

    @Expose()
    @Type(() => String)
    enrollTypeName!: string;

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
