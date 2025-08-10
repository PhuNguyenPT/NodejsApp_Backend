// src/dto/student.info.ts
import { Expose, Transform, Type } from "class-transformer";

import { FileResponse } from "@/dto/file/file.response.js";
import { AptitudeTestResponse } from "@/dto/student/aptitude.test.response.js";
import { AwardResponse } from "@/dto/student/award.response.js";
import { CertificationResponse } from "@/dto/student/certification.response.js";
import { ExamSubject } from "@/dto/student/exam.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese.provinces.js";

/**
 * Data Transfer Object for student profile response information.
 * Contains all necessary data to return a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 * @example
 * {
 *   "id": "uuid-string",
 *   "userId": "user-uuid-string",
 *   "aptitudeTestScore": {
 *     "examType": {
 *       "type": "DGNL",
 *       "value": "VNUHCM"
 *     },
 *     "score": 700
 *   },
 *   "awards": [
 *     {
 *       "awardDate": "2023-12-15",
 *       "category": "Tiếng Anh",
 *       "level": "Hạng Nhất",
 *       "name": "Học sinh giỏi cấp quốc gia"
 *     }
 *   ],
 *   "certifications": [
 *     {
 *       "examType": {
 *         "type": "CCNN",
 *         "value": "IELTS"
 *       },
 *       "issueDate": "2023-01-15",
 *       "expirationDate": "2025-01-15",
 *       "level": "6.5",
 *       "name": "IELTS Academic"
 *     }
 *   ],
 *   "location": "Ho Chi Minh City, Vietnam",
 *   "major": "Computer Science",
 *   "maxBudget": 20000000,
 *   "minBudget": 5000000,
 *   "province": "HO_CHI_MINH",
 *   "subjectCombination": [
 *     { "name": "Math", "score": 8.0 },
 *     { "name": "Literature", "score": 7.0 },
 *     { "name": "English", "score": 9.5 },
 *     { "name": "Physics", "score": 8.75 }
 *   ],
 *   "talentScore": 8.5,
 *   "vsatScore": [120, 130, 125],
 *   "fileResponses": []
 * }
 */
export class StudentProfileResponse {
    /**
     * Aptitude test information including exam type and score
     * Contains the exam type (DGNL, CCNN, or CCQT) and the numeric score achieved
     */
    @Expose()
    @Type(() => AptitudeTestResponse)
    aptitudeTestScore?: AptitudeTestResponse;

    /**
     * List of awards and recognitions received by the student.
     * Optional field that can contain multiple award entries.
     * Each award includes details like name, category, level, and award date.
     *
     * @type {AwardResponse[]}
     * @optional
     * @see AwardResponse for detailed structure and validation rules
     */
    @Expose()
    @Type(() => AwardResponse)
    awards?: AwardResponse[];

    /**
     * List of professional certifications earned by the student.
     * Optional field that can contain multiple certification entries.
     * Each certification includes details like name, issuing organization, and validity dates.
     *
     * @type {CertificationResponse[]}
     * @optional
     * @see CertificationResponse for detailed structure and validation rules
     */
    @Expose()
    @Type(() => CertificationResponse)
    certifications?: CertificationResponse[];

    @Expose()
    @Type(() => FileResponse)
    fileResponses!: FileResponse[];

    @Expose()
    id!: string;

    /**
     * Geographic location or preferred study location of the student.
     */
    @Expose()
    location?: string;

    /**
     * Primary field of study or academic major of the student.
     */
    @Expose()
    major!: string;

    /**
     * Maximum budget amount that the student is willing or able to spend.
     * Represents the upper limit of the budget range in Vietnamese Dong (VND).
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    minBudget!: number;

    /**
     * Province or city where the student is located
     */
    @Expose()
    @Type(() => String)
    province!: VietnamSouthernProvinces;

    /**
     * List of exactly 4 exam subjects with their scores
     *
     * @type {ExamSubject[]}
     * @see ExamSubject for detailed structure and validation rules
     */
    @Expose()
    @Type(() => ExamSubject)
    subjectCombination!: ExamSubject[];

    /**
     * Talent score (0-10 scale)
     */
    @Expose()
    @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
    talentScore?: number;

    @Expose()
    userId!: string;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of exactly 3 scores (0-150 each)
     */
    @Expose()
    @Transform(({ value }): number[] | undefined => {
        if (Array.isArray(value)) {
            return value.map((score) => parseInt(String(score)));
        }
        if (value === null || value === undefined) {
            return undefined;
        }
        // Handle unexpected types - return undefined for safety
        return undefined;
    })
    vsatScore?: number[];
}
