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

import { ExamProfileDTO } from "@/dto/student/exam.profile.dto.js";
import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { FileEntity, FileType } from "@/entity/file.js";
import { UserEntity } from "@/entity/user.js";
import { ExamType } from "@/type/enum/exam.js";
import { SpecialStudentCase } from "@/type/enum/special.student.case";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese.provinces.js";

interface AcademicPerformanceData {
    academicPerformance: string;
    grade: number;
}

interface AptitudeTestData {
    examType: ExamType;
    score: number;
}

interface ConductData {
    conduct: string;
    grade: number;
}

interface ExamSubjectData {
    name: string;
    score: number;
}

@Entity({ name: "students" })
@Index("idx_student_user_id", ["userId"])
@Index("idx_student_major", ["major"])
@Index("idx_student_location", ["location"])
@Index("idx_student_province", ["province"])
@Index("idx_student_budget", ["minBudget", "maxBudget"])
@Index("idx_student_created_at", ["createdAt"])
@Index("idx_student_modified_at", ["modifiedAt"])
@Index("idx_student_talent_score", ["talentScore"])
export class StudentEntity {
    /**
     * Academic performance data for different grades
     * Array containing academic performance ratings and corresponding grades
     */
    @Column({ nullable: true, type: "jsonb" })
    academicPerformances?: AcademicPerformanceData[];

    /**
     * Aptitude test information including exam type and score
     * Stored as JSON containing examType and score
     */
    @Column({ nullable: true, type: "jsonb" })
    aptitudeTestScore?: AptitudeTestData;

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

    /**
     * Conduct/behavior data for different grades
     * Array containing conduct ratings and corresponding grades
     */
    @Column({ nullable: true, type: "jsonb" })
    conducts?: ConductData[];

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @OneToMany(() => FileEntity, (file) => file.student, {
        cascade: true,
        eager: false,
    })
    files?: FileEntity[];

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 500, nullable: true, type: "varchar" })
    location?: string;

    @Column({ length: 200, nullable: true, type: "varchar" })
    major?: string;

    @Column({ nullable: true, precision: 14, scale: 2, type: "decimal" })
    maxBudget?: number;

    @Column({ nullable: true, precision: 14, scale: 2, type: "decimal" })
    minBudget?: number;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
    modifiedBy?: string;

    @Column({
        enum: VietnamSouthernProvinces,
        length: 50,
        nullable: true,
        type: "varchar",
    })
    province?: VietnamSouthernProvinces;

    @Column({
        enum: SpecialStudentCase,
        length: 255,
        nullable: true,
        type: "varchar",
    })
    specialStudentCase?: SpecialStudentCase;

    @Column({ nullable: true, type: "jsonb" })
    subjectCombination?: ExamSubjectData[];

    /**
     * Talent score (0-10 scale with up to 2 decimal places)
     */
    @Column({ nullable: true, precision: 4, scale: 2, type: "decimal" })
    talentScore?: number;

    @JoinColumn({ name: "userId" })
    @ManyToOne(() => UserEntity, (user) => user.studentEntities, {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: UserEntity;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;

    /**
     * VSAT score - array of exactly 3 scores (0-150 each)
     * Stored as JSON array
     */
    @Column({ nullable: true, type: "jsonb" })
    vsatScore?: number[];

    constructor(student?: Partial<StudentEntity>) {
        if (student) {
            Object.assign(this, student);
        }
    }

    // Helper method to add academic performance for a specific grade
    addAcademicPerformance(academicPerformance: string, grade: number): void {
        this.academicPerformances ??= [];

        // Remove existing entry for the same grade if it exists
        this.academicPerformances = this.academicPerformances.filter(
            (ap) => ap.grade !== grade,
        );

        // Add new entry
        this.academicPerformances.push({ academicPerformance, grade });
    }

    // Helper method to add conduct for a specific grade
    addConduct(conduct: string, grade: number): void {
        this.conducts ??= [];

        // Remove existing entry for the same grade if it exists
        this.conducts = this.conducts.filter((c) => c.grade !== grade);

        // Add new entry
        this.conducts.push({ conduct, grade });
    }

    // Helper method to get academic performance by grade
    getAcademicPerformanceByGrade(
        grade: number,
    ): AcademicPerformanceData | null {
        if (!this.academicPerformances) return null;
        return (
            this.academicPerformances.find((ap) => ap.grade === grade) ?? null
        );
    }

    // Helper method to get active certifications (not expired)
    getActiveCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];

        const now = new Date();
        return this.certifications.filter(
            (cert) => !cert.expirationDate || cert.expirationDate >= now,
        );
    }

    // Helper method to get active files only
    getActiveFiles(): FileEntity[] {
        if (!this.files) return [];
        return this.files.filter((file) => file.isActive());
    }

    // Helper method to get aptitude test score (backward compatibility)
    getAptitudeTestScore(): number | undefined {
        return this.aptitudeTestScore?.score;
    }

    // Helper method to get aptitude test type
    getAptitudeTestType(): ExamType | undefined {
        return this.aptitudeTestScore?.examType;
    }

    // Helper method to get awards by category
    getAwardsByCategory(category: string): AwardEntity[] {
        if (!this.awards) return [];
        return this.awards.filter((award) => award.category === category);
    }

    // Helper method to get budget range as string
    getBudgetRangeString(): string {
        if (this.minBudget === undefined || this.maxBudget === undefined) {
            return "No budget defined";
        }
        if (this.minBudget < 0 || this.maxBudget < 0) {
            return "Invalid budget range";
        }
        if (this.minBudget === this.maxBudget) {
            return `$${this.minBudget.toLocaleString()}`;
        }
        if (this.minBudget > this.maxBudget) {
            return "Invalid budget range";
        }
        return `$${this.minBudget.toLocaleString()} - $${this.maxBudget.toLocaleString()}`;
    }

    // Helper method to get conduct by grade
    getConductByGrade(grade: number): ConductData | null {
        if (!this.conducts) return null;
        return this.conducts.find((c) => c.grade === grade) ?? null;
    }

    getExamProfileDTO(): ExamProfileDTO | null {
        if (!this.subjectCombination) return null;

        return ExamProfileDTO.fromStudentEntity(
            this.subjectCombination,
            this.aptitudeTestScore,
            this.vsatScore,
        );
    }

    // Helper method to get expired certifications
    getExpiredCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];
        const now = new Date();

        return this.certifications.filter(
            (cert) => cert.expirationDate && cert.expirationDate < now,
        );
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

        return this.files.reduce((counts, file) => {
            if (file.isActive()) {
                counts[file.fileType]++;
            }
            return counts;
        }, initialCounts);
    }

    // Helper method to get latest academic performance
    getLatestAcademicPerformance(): AcademicPerformanceData | null {
        if (
            !this.academicPerformances ||
            this.academicPerformances.length === 0
        )
            return null;
        return this.academicPerformances.reduce((latest, current) =>
            current.grade > latest.grade ? current : latest,
        );
    }

    // Helper method to get latest conduct
    getLatestConduct(): ConductData | null {
        if (!this.conducts || this.conducts.length === 0) return null;
        return this.conducts.reduce((latest, current) =>
            current.grade > latest.grade ? current : latest,
        );
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
            .reduce((total, file) => total + file.fileSize, 0);
    }

    getTotalSubjectScore(): number {
        if (!this.subjectCombination) return 0;
        return this.subjectCombination.reduce(
            (sum, subject) => sum + subject.score,
            0,
        );
    }

    // Helper method to get total VSAT score
    getTotalVSATScore(): number {
        if (!this.vsatScore || !Array.isArray(this.vsatScore)) return 0;
        return this.vsatScore.reduce((sum, score) => sum + score, 0);
    }

    // Helper method to get user email safely
    getUserEmail(): null | string {
        return this.user?.email ?? null;
    }

    // Helper method to get VSAT score by index
    getVSATScore(index: number): number | undefined {
        if (!this.vsatScore || !Array.isArray(this.vsatScore)) return undefined;
        return this.vsatScore[index];
    }

    // Helper method to check if academic performance data exists
    hasAcademicPerformanceData(): boolean {
        return !!(
            this.academicPerformances && this.academicPerformances.length > 0
        );
    }

    // Helper method to check if conduct data exists
    hasConductData(): boolean {
        return !!(this.conducts && this.conducts.length > 0);
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

    // Helper method to check if VSAT scores are valid
    hasValidVSATScores(): boolean {
        return (
            this.vsatScore !== undefined &&
            Array.isArray(this.vsatScore) &&
            this.vsatScore.length === 3 &&
            this.vsatScore.every(
                (score) =>
                    typeof score === "number" && score >= 0 && score <= 150,
            )
        );
    }

    // Helper method to check if budget range is valid
    isBudgetRangeValid(): boolean {
        if (this.minBudget === undefined || this.maxBudget === undefined) {
            return false; // Budget not defined
        }
        if (this.minBudget < 0 || this.maxBudget < 0) {
            return false; // Negative budgets are not allowed
        }
        // Check if minBudget is less than or equal to maxBudget
        if (this.minBudget > this.maxBudget) {
            return false; // Invalid budget range
        }
        // Valid budget range
        return true;
    }

    // Helper method to check if a value is within budget range
    isWithinBudget(amount: number): boolean {
        if (this.minBudget === undefined || this.maxBudget === undefined) {
            return false; // Budget not defined
        }
        if (amount < 0) {
            return false; // Negative amounts are not allowed
        }
        // Check if amount is within the defined budget range
        if (this.minBudget > this.maxBudget) {
            return false; // Invalid budget range
        }
        // Check if amount is within the budget range
        if (this.minBudget === this.maxBudget) {
            return amount === this.minBudget; // Exact match required
        }
        // Check if amount is between minBudget and maxBudget
        if (this.minBudget < this.maxBudget) {
            return amount > this.minBudget && amount < this.maxBudget;
        }
        // If minBudget is greater than maxBudget, return false
        // This case should not happen if budget range is valid
        if (this.minBudget > this.maxBudget) {
            return false; // Invalid budget range
        }
        // Default case: return true if amount is within the range
        // This case should not happen if budget range is valid
        // but added for completeness
        return amount >= this.minBudget && amount <= this.maxBudget;
    }

    // Helper method to set academic performance data
    setAcademicPerformance(
        academicPerformanceDataArray: AcademicPerformanceData[],
    ): void {
        this.academicPerformances = academicPerformanceDataArray;
    }

    // Helper method to set aptitude test with both type and score
    setAptitudeTest(examType: ExamType, score: number): void {
        this.aptitudeTestScore = { examType, score };
    }

    // Helper method to set conduct data
    setConduct(conductData: ConductData[]): void {
        this.conducts = conductData;
    }

    setExamProfileDTO(examProfile: ExamProfileDTO): void {
        const data = examProfile.toStudentEntityData();
        this.subjectCombination = data.subjectCombination;
        this.aptitudeTestScore = data.aptitudeTestScore;
        this.vsatScore = data.vsatScore;
    }

    // Helper method to set VSAT scores
    setVSATScores(scores: number[]): void {
        if (scores.length === 3) {
            this.vsatScore = scores;
        } else {
            throw new Error(
                "VSAT scores must be an array of exactly 3 numbers",
            );
        }
    }
}
