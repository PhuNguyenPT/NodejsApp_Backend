import {
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { UserEntity } from "@/entity/security/user.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { CertificationEntity } from "@/entity/uni_guide/certification.entity.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";

import { AcademicPerformanceEntity } from "./academic-performance.entity.js";
import { AptitudeExamEntity } from "./aptitude-exam.entity.js";
import { ConductEntity } from "./conduct.entity.js";
import { NationalExamEntity } from "./national-exam.enity.js";
import { StudentAdmissionEntity } from "./student-admission.entity.js";
import { StudentMajorGroupEntity } from "./student-major-group.entity.js";
import { TalentExamEntity } from "./talent-exam.entity.js";
import { TranscriptEntity } from "./transcript.entity.js";
import { VsatExamEntity } from "./vsat-exam.entity.js";

@Entity({ name: "students", schema: "uni_guide" })
@Index("idx_students_user_id", ["userId"])
@Index("idx_students_province", ["province"])
@Index("idx_students_budget", ["minBudget", "maxBudget"])
@Index("idx_students_created_at", ["createdAt"])
@Index("idx_students_created_by", ["createdBy"])
@Index("idx_students_updated_at", ["updatedAt"])
@Index("idx_students_updated_by", ["updatedBy"])
export class StudentEntity {
    @OneToMany("AcademicPerformanceEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    academicPerformances?: Relation<AcademicPerformanceEntity[]>;

    @OneToMany("AptitudeExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    aptitudeExams?: Relation<AptitudeExamEntity[]>;

    @OneToMany("AwardEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    awards?: Relation<AwardEntity[]>;

    @OneToMany("CertificationEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    certifications?: Relation<CertificationEntity[]>;

    @OneToMany("ConductEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    conducts?: Relation<ConductEntity[]>;

    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        name: "created_by",
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @OneToMany("FileEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    files?: Relation<FileEntity[]>;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "majors", nullable: true, type: "jsonb" })
    majors?: MajorGroup[];

    @Column({
        name: "max_budget",
        nullable: true,
        precision: 14,
        scale: 2,
        transformer: {
            from: (value: string) => parseFloat(value),
            to: (value: number) => value,
        },
        type: "numeric",
    })
    maxBudget?: number;

    @Column({
        name: "min_budget",
        nullable: true,
        precision: 14,
        scale: 2,
        transformer: {
            from: (value: string) => parseFloat(value),
            to: (value: number) => value,
        },
        type: "numeric",
    })
    minBudget?: number;

    @OneToMany("NationalExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    nationalExams?: Relation<NationalExamEntity[]>;

    @OneToOne("PredictionResultEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    predictionResult?: Relation<PredictionResultEntity>;

    @Column({
        enum: VietnamSouthernProvinces,
        name: "province",
        nullable: true,
        type: "varchar",
    })
    province?: VietnamSouthernProvinces;

    @Column({
        name: "special_student_cases",
        nullable: true,
        type: "jsonb",
    })
    specialStudentCases?: SpecialStudentCase[];

    @OneToMany("StudentAdmissionEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    studentAdmissions?: Relation<StudentAdmissionEntity[]>;

    @OneToMany("StudentMajorGroupEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    studentMajorGroups?: Relation<StudentMajorGroupEntity[]>;

    @OneToMany("TalentExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    talentExams?: Relation<TalentExamEntity[]>;

    @OneToMany("TranscriptEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    transcripts?: Relation<TranscriptEntity[]>;

    @Column({ enum: UniType, name: "uni_type", nullable: true, type: "enum" })
    uniType?: UniType;

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        name: "updated_by",
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy?: string;

    @JoinColumn({ name: "user_id" })
    @ManyToOne("UserEntity", "studentEntities", {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: Relation<UserEntity>;

    @Column({ name: "user_id", nullable: true, type: "uuid" })
    userId?: string;

    @OneToMany("VsatExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    vsatExams?: Relation<VsatExamEntity[]>;

    constructor(entityLike?: DeepPartial<StudentEntity>) {
        Object.assign(this, entityLike);
    }
}
