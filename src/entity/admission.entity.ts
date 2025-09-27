import {
    Column,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
} from "typeorm";

import { StudentAdmissionEntity } from "./student-admission.entity.js";

// Define field categories
export const ADMISSION_TEXT_SEARCH_FIELDS = [
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

export const ADMISSION_NUMERIC_SEARCH_FIELDS = [
    "majorCode",
    "tuitionFee",
] as const;

// Combine all allowed fields
export const ALLOWED_ADMISSION_SEARCH_FIELDS = [
    ...ADMISSION_TEXT_SEARCH_FIELDS,
    ...ADMISSION_NUMERIC_SEARCH_FIELDS,
] as const;

export type AdmissionNumericSearchField =
    (typeof ADMISSION_NUMERIC_SEARCH_FIELDS)[number];
export type AdmissionSearchField =
    (typeof ALLOWED_ADMISSION_SEARCH_FIELDS)[number];
// Create union types
export type AdmissionTextSearchField =
    (typeof ADMISSION_TEXT_SEARCH_FIELDS)[number];

export function isAdmissionNumericSearchField(
    field: string,
): field is AdmissionNumericSearchField {
    return ADMISSION_NUMERIC_SEARCH_FIELDS.includes(
        field as AdmissionNumericSearchField,
    );
}

// Type guards
export function isAdmissionSearchField(
    field: string,
): field is AdmissionSearchField {
    return ALLOWED_ADMISSION_SEARCH_FIELDS.includes(
        field as AdmissionSearchField,
    );
}

export function isAdmissionTextSearchField(
    field: string,
): field is AdmissionTextSearchField {
    return ADMISSION_TEXT_SEARCH_FIELDS.includes(
        field as AdmissionTextSearchField,
    );
}
@Entity("admissions")
@Index("idx_admission_code", ["admissionCode"])
@Index("idx_admission_type", ["admissionType"])
@Index("idx_major_code", ["majorCode"])
@Index("idx_major_name", ["majorName"])
@Index("idx_province", ["province"])
@Index("idx_study_program", ["studyProgram"])
@Index("idx_uni_code", ["uniCode"])
@Index("idx_uni_name", ["uniName"])
@Index("idx_uni_type", ["uniType"])
@Index("idx_tuition_fee", ["tuitionFee"])
@Index("idx_uni_major", ["uniCode", "majorCode"])
@Index("idx_province_uni_type", ["province", "uniType"])
@Index("idx_admission_type_major", ["admissionType", "majorCode"])
@Index("idx_study_program_admission_type", ["studyProgram", "admissionType"])
@Index("idx_province_tuition_fee", ["province", "tuitionFee"])
@Index("idx_uni_type_tuition_fee", ["uniType", "tuitionFee"])
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
}
