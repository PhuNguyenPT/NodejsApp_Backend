import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
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
import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";

import { StudentAcademicPerformanceEntity } from "./student-academic-performance.entity.js";
import { StudentAdmissionEntity } from "./student-admission.entity.js";
import { StudentAptitudeExamEntity } from "./student-aptitude-exam.entity.js";
import { StudentConductEntity } from "./student-conduct.entity.js";
import { StudentNationalExamEntity } from "./student-national-exam.enity.js";
import { StudentTalentExamEntity } from "./student-talent-exam.entity.js";
import { StudentVsatExamEntity } from "./student-vsat-exam.entity.js";

@Entity({ name: "students", schema: "uni_guide" })
@Index("idx_students_user_id", ["userId"])
@Index("idx_students_province", ["province"])
@Index("idx_students_budget", ["minBudget", "maxBudget"])
@Index("idx_students_created_at", ["createdAt"])
@Index("idx_students_created_by", ["createdBy"])
@Index("idx_students_updated_at", ["updatedAt"])
@Index("idx_students_updated_by", ["updatedBy"])
export class StudentEntity {
    @OneToMany("StudentAcademicPerformanceEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    academicPerformances?: Relation<StudentAcademicPerformanceEntity[]>;

    @OneToMany("StudentAptitudeExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    aptitudeExams?: Relation<StudentAptitudeExamEntity[]>;

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

    @OneToMany("StudentConductEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    conducts?: Relation<StudentConductEntity[]>;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
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

    @JoinTable({
        inverseJoinColumn: {
            name: "major_group_id",
            referencedColumnName: "id",
        },
        joinColumn: {
            name: "student_id",
            referencedColumnName: "id",
        },
        name: "student_major_groups",
    })
    @ManyToMany("MajorGroupEntity", "students", {
        nullable: true,
    })
    majorGroupsEntities?: Relation<MajorGroupEntity[]>;

    @Column({ nullable: true, type: "jsonb" })
    majors?: MajorGroup[];

    @Column({ nullable: true, precision: 14, scale: 2, type: "decimal" })
    maxBudget?: number;

    @Column({ nullable: true, precision: 14, scale: 2, type: "decimal" })
    minBudget?: number;

    @OneToMany("StudentNationalExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    nationalExams?: Relation<StudentNationalExamEntity[]>;

    @OneToOne("PredictionResultEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    predictionResult?: Relation<PredictionResultEntity>;

    @Column({
        enum: VietnamSouthernProvinces,
        nullable: true,
        type: "varchar",
    })
    province?: VietnamSouthernProvinces;

    @Column({
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

    @OneToMany("StudentTalentExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    talentExams?: Relation<StudentTalentExamEntity[]>;

    @Column({ enum: UniType, nullable: true, type: "enum" })
    uniType?: UniType;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy?: string;

    @JoinColumn({ name: "userId" })
    @ManyToOne("UserEntity", "studentEntities", {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: Relation<UserEntity>;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;

    @OneToMany("StudentVsatExamEntity", "student", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    vsatExams?: Relation<StudentVsatExamEntity[]>;

    constructor(student?: Partial<StudentEntity>) {
        if (student) {
            Object.assign(this, student);
        }
    }
}
