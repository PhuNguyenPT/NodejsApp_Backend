// src/entity/student.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { ExamProfile, ExamSubject } from "@/dto/student/exam";
import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { UserEntity } from "@/entity/user.js";
import { Role } from "@/type/enum/user";

import { FileEntity, FileType } from "./file";

export interface ExamSubjectData {
    name: string;
    score: number;
}

@Entity({ name: "students" })
@Index("idx_student_user_id", ["userId"])
@Index("idx_student_major", ["major"])
@Index("idx_student_location", ["location"])
export class StudentEntity {
    @Column({ nullable: true, precision: 5, scale: 2, type: "decimal" })
    aptitudeTestScore?: number;

    @OneToMany(() => AwardEntity, (award) => award.student, {
        cascade: true,
        eager: false,
    })
    awards?: AwardEntity[];

    @OneToMany(
        () => CertificationEntity,
        (certification) => certification.student,
        {
            cascade: true,
            eager: false,
        },
    )
    certifications?: CertificationEntity[];

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({
        default: Role.ANONYMOUS,
        length: 255,
        nullable: true,
        type: "varchar",
    })
    createdBy?: string;

    @OneToMany(() => FileEntity, (file) => file.student, {
        cascade: true,
        eager: false,
    })
    files?: FileEntity[];

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 500, type: "varchar" })
    location!: string;

    @Column({ length: 200, type: "varchar" })
    major!: string;

    @Column({ precision: 14, scale: 2, type: "decimal" })
    maxBudget!: number;

    @Column({ precision: 14, scale: 2, type: "decimal" })
    minBudget!: number;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({
        default: Role.ANONYMOUS,
        length: 255,
        nullable: true,
        type: "varchar",
    })
    modifiedBy?: string;

    @Column({ nullable: true, type: "json" })
    subjectCombination?: ExamSubjectData[];

    @JoinColumn({ name: "userId" })
    @ManyToOne(() => UserEntity, (user) => user.studentEntities, {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: UserEntity;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;

    @Column({ nullable: true, precision: 5, scale: 2, type: "decimal" })
    vsatScore?: number;

    constructor(student?: Partial<StudentEntity>) {
        if (student) {
            Object.assign(this, student);
        }
    }

    // Helper method to get active certifications (not expired)
    getActiveCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];

        const now = new Date();
        return this.certifications.filter((cert) => cert.expirationDate > now);
    }

    // Helper method to get active files only
    getActiveFiles(): FileEntity[] {
        if (!this.files) return [];
        return this.files.filter((file) => file.isActive());
    }

    // Helper method to get awards by category
    getAwardsByCategory(category: string): AwardEntity[] {
        if (!this.awards) return [];
        return this.awards.filter((award) => award.category === category);
    }

    // Helper method to get budget range as string
    getBudgetRangeString(): string {
        return `$${this.minBudget.toLocaleString()} - $${this.maxBudget.toLocaleString()}`;
    }
    getExamProfile(): ExamProfile | null {
        if (!this.subjectCombination) return null;

        const subjects = this.subjectCombination.map(
            (s) => new ExamSubject(s.name, s.score),
        );

        return new ExamProfile(
            subjects,
            this.aptitudeTestScore,
            this.vsatScore,
        );
    }

    // Helper method to get expired certifications
    getExpiredCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];

        const now = new Date();
        return this.certifications.filter((cert) => cert.expirationDate <= now);
    }

    // Helper method to get files by type
    getFilesByType(fileType: FileType): FileEntity[] {
        if (!this.files) return [];
        return this.files.filter(
            (file) => file.fileType === fileType && file.isActive(),
        );
    }

    // Helper method to get files count by type
    getFilesCountByType(): Record<FileType, number> {
        // Initialize an object with all FileType keys set to 0.
        // We use `as Record<FileType, number>` to assert the type of the initial
        // empty object `{}`, resolving the TypeScript error.
        const initialCounts = Object.values(FileType).reduce(
            (acc, type) => {
                acc[type] = 0;
                return acc;
            },
            {} as Record<FileType, number>,
        );

        if (!this.files) {
            return initialCounts;
        }

        // The second reduce call correctly uses the pre-populated `initialCounts` object.
        return this.files.reduce((counts, file) => {
            if (file.isActive()) {
                counts[file.fileType]++;
            }
            return counts;
        }, initialCounts);
    }

    // Helper method to get recent awards (within specified days)
    getRecentAwards(days = 365): AwardEntity[] {
        if (!this.awards) return [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.awards.filter((award) => award.awardDate >= cutoffDate);
    }

    // Helper method to get recent files (within specified days)
    getRecentFiles(days = 30): FileEntity[] {
        if (!this.files) return [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.files.filter(
            (file) => file.isActive() && file.createdAt >= cutoffDate,
        );
    }

    getSubjectScore(subjectName: string): null | number {
        if (!this.subjectCombination) return null;

        const subject = this.subjectCombination.find(
            (s) => s.name === subjectName,
        );
        return subject?.score ?? null;
    }

    // Helper method to get total file size
    getTotalFileSize(): number {
        if (!this.files) return 0;
        return this.files
            .filter((file) => file.isActive())
            .reduce((total, file) => total + Number(file.fileSize), 0);
    }

    getTotalSubjectScore(): number {
        if (!this.subjectCombination) return 0;
        return this.subjectCombination.reduce(
            (sum, subject) => sum + subject.score,
            0,
        );
    }

    // Helper method to get user email safely
    getUserEmail(): null | string {
        return this.user?.email ?? null;
    }

    // Helper method to check if student has specific file type
    hasFileType(fileType: FileType): boolean {
        return this.getFilesByType(fileType).length > 0;
    }

    // Helper method to check if user is associated
    hasUser(): boolean {
        return !!this.userId && !!this.user;
    }

    hasValidExamData(): boolean {
        return (
            this.subjectCombination !== undefined &&
            this.subjectCombination.length === 4
        );
    }

    // Helper method to check if budget range is valid
    isBudgetRangeValid(): boolean {
        return this.minBudget <= this.maxBudget;
    }

    // Helper method to check if a value is within budget range
    isWithinBudget(amount: number): boolean {
        return amount >= this.minBudget && amount <= this.maxBudget;
    }

    setExamProfile(examProfile: ExamProfile): void {
        this.subjectCombination = examProfile.subjectCombination.map((s) => ({
            name: s.name,
            score: s.score,
        }));
        if (examProfile.aptitudeTestScore !== undefined) {
            this.aptitudeTestScore = examProfile.aptitudeTestScore;
        } else {
            this.aptitudeTestScore = undefined;
        }

        if (examProfile.vsatScore !== undefined) {
            this.vsatScore = examProfile.vsatScore;
        } else {
            this.vsatScore = undefined;
        }
    }
}
