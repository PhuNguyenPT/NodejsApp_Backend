// src/entity/student.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { UserEntity } from "@/entity/user.js";

@Entity({ name: "students" })
@Index("idx_student_user_id", ["userId"])
@Index("idx_student_major", ["major"])
@Index("idx_student_location", ["location"])
export class StudentEntity {
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

    @Column({ length: 255, nullable: true, type: "varchar" })
    createdBy?: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 500, type: "varchar" })
    location!: string;

    @Column({ length: 200, type: "varchar" })
    major!: string;

    @Column({ precision: 12, scale: 2, type: "decimal" })
    maxBudget!: number;

    @Column({ precision: 12, scale: 2, type: "decimal" })
    minBudget!: number;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
    modifiedBy?: string;

    @JoinColumn({ name: "userId" })
    @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
    user!: UserEntity;

    @Column({ type: "uuid", unique: true })
    userId!: string;

    constructor(student?: Partial<StudentEntity>) {
        if (student) {
            Object.assign(this, student);
        }
    }

    // Helper method to get active certifications (not expired)
    getActiveCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];

        const now = new Date();
        return this.certifications.filter(
            (cert) => !cert.expirationDate || cert.expirationDate > now,
        );
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

    // Helper method to get expired certifications
    getExpiredCertifications(): CertificationEntity[] {
        if (!this.certifications) return [];

        const now = new Date();
        return this.certifications.filter(
            (cert) => cert.expirationDate && cert.expirationDate <= now,
        );
    }

    // Helper method to get recent awards (within specified days)
    getRecentAwards(days = 365): AwardEntity[] {
        if (!this.awards) return [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.awards.filter((award) => award.awardDate >= cutoffDate);
    }

    // Helper method to check if budget range is valid
    isBudgetRangeValid(): boolean {
        return this.minBudget <= this.maxBudget;
    }

    // Helper method to check if a value is within budget range
    isWithinBudget(amount: number): boolean {
        return amount >= this.minBudget && amount <= this.maxBudget;
    }
}
