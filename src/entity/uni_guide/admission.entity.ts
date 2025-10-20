import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { StudentAdmissionEntity } from "./student-admission.entity.js";

// Define field categories
export const ADMISSION_TEXT_FIELDS = [
    "admissionCode",
    "admissionType",
    "admissionTypeName",
    "majorName",
    "province",
    "studyProgram",
    "subjectCombination",
    "uniCode",
    "uniName",
    "uniType",
    "uniWebLink",
] as const;

export const ADMISSION_NUMERIC_FIELDS = ["majorCode", "tuitionFee"] as const;

// Combine all allowed fields
export const ALLOWED_ADMISSION_FIELDS = [
    ...ADMISSION_TEXT_FIELDS,
    ...ADMISSION_NUMERIC_FIELDS,
] as const;

export type AdmissionField = (typeof ALLOWED_ADMISSION_FIELDS)[number];
export type AdmissionNumericField = (typeof ADMISSION_NUMERIC_FIELDS)[number];
export type AdmissionTextField = (typeof ADMISSION_TEXT_FIELDS)[number];

export function isAdmissionField(field: string): field is AdmissionField {
    return ALLOWED_ADMISSION_FIELDS.includes(field as AdmissionField);
}

export function isAdmissionNumericField(
    field: string,
): field is AdmissionNumericField {
    return ADMISSION_NUMERIC_FIELDS.includes(field as AdmissionNumericField);
}

export function isAdmissionTextField(
    field: string,
): field is AdmissionTextField {
    return ADMISSION_TEXT_FIELDS.includes(field as AdmissionTextField);
}
@Entity({ name: "admissions", schema: "uni_guide" })
@Index("idx_admissions_code", ["admissionCode"])
@Index("idx_admissions_type", ["admissionType"])
@Index("idx_admissions_major_code", ["majorCode"])
@Index("idx_admissions_major_name", ["majorName"])
@Index("idx_admissions_province", ["province"])
@Index("idx_admissions_study_program", ["studyProgram"])
@Index("idx_admissions_uni_code", ["uniCode"])
@Index("idx_admissions_uni_name", ["uniName"])
@Index("idx_admissions_uni_type", ["uniType"])
@Index("idx_admissions_tuition_fee", ["tuitionFee"])
@Index("idx_admissions_uni_major", ["uniCode", "majorCode"])
@Index("idx_admissions_province_uni_type", ["province", "uniType"])
@Index("idx_admissions_admission_type_major", ["admissionType", "majorCode"])
@Index("idx_admissions_study_program_admission_type", [
    "studyProgram",
    "admissionType",
])
@Index("idx_admissions_province_tuition_fee", ["province", "tuitionFee"])
@Index("idx_admissions_uni_type_tuition_fee", ["uniType", "tuitionFee"])
@Index("idx_admissions_created_at", ["createdAt"])
@Index("idx_admissions_updated_at", ["updatedAt"])
export class AdmissionEntity {
    @Column({ name: "admission_code", nullable: false, type: "varchar" })
    admissionCode!: string;

    @Column({ name: "admission_type", nullable: false, type: "varchar" })
    admissionType!: string;

    @Column({ name: "admission_type_name", nullable: false, type: "varchar" })
    admissionTypeName!: string;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "major_code", nullable: false, type: "integer" })
    majorCode!: number;

    @Column({ name: "major_name", nullable: false, type: "varchar" })
    majorName!: string;

    @Column({ name: "province", nullable: false, type: "varchar" })
    province!: string;

    @OneToMany("StudentAdmissionEntity", "admission")
    studentAdmissions!: Relation<StudentAdmissionEntity[]>;

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

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
