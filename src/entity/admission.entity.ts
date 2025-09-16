import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("admission")
export class AdmissionEntity {
    @Column({ name: "admission_code", nullable: false, type: "varchar" })
    admissionCode!: string;

    @Column({ name: "admission_type", nullable: false, type: "varchar" })
    admissionType!: string;

    @Column({ name: "admission_type_name", nullable: false, type: "varchar" })
    admissionTypeName!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "major_code", nullable: false, type: "integer" })
    majorCode!: number;

    @Column({ name: "major_name", nullable: false, type: "varchar" })
    majorName!: string;

    @Column({ name: "province", nullable: false, type: "varchar" })
    province!: string;

    @Column({ name: "study_program", nullable: false, type: "varchar" })
    studyProgram!: string;

    @Column({ name: "subject_combination", nullable: false, type: "varchar" })
    subjectCombination!: string;

    @Column({ name: "tuition_fee", nullable: false, type: "bigint" })
    tuitionFee!: number;

    @Column({ name: "uni_code", nullable: false, type: "varchar" })
    uniCode!: string;

    @Column({ name: "uni_name", nullable: false, type: "varchar" })
    uniName!: string;

    @Column({ name: "uni_type", nullable: false, type: "varchar" })
    uniType!: string;

    @Column({ name: "uni_web_link", nullable: false, type: "varchar" })
    uniWebLink!: string;
}
