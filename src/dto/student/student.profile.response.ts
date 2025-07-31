// src/dto/student.info.ts
import { Expose, Type } from "class-transformer";

import { AwardResponse } from "@/dto/student/award.response.js";

import { CertificationResponse } from "./certification.response";
import { ExamSubject } from "./exam";

/**
 * Data Transfer Object for creating or updating student profile information.
 * Contains all necessary data to establish a comprehensive student profile including
 * academic background, budget preferences, achievements, and certifications.
 * @example
 * {
 *   "aptitudeTestScore": 700,
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
 *       "issueDate": "2023-01-15",
 *       "expirationDate": "2025-01-15",
 *       "level": "6.5",
 *       "name": "IELTS"
 *     }
 *   ],
 *   "location": "Thành phố Hồ Chí Minh, Việt Nam",
 *   "major": "Khoa học Máy tính",
 *   "maxBudget": 20000000,
 *   "minBudget": 10000000,
 *   "subjectCombination": [
 *     { "name": "Toán", "score": 8.0 },
 *     { "name": "Ngữ Văn", "score": 7.0 },
 *     { "name": "Tiếng Anh", "score": 9.5 },
 *     { "name": "Vật Lý", "score": 8.75 }
 *   ],
 *   "vsatScore": 85
 * }
 * @example
 * {
 *   "aptitudeTestScore": 700,
 *   "awards": [
 *     {
 *       "name": "Dean's List Award",
 *       "category": "Academic Excellence",
 *       "level": "University",
 *       "awardDate": "2023-12-15"
 *     }
 *   ],
 *   "certifications": [
 *     {
 *       "name": "AWS Solutions Architect",
 *       "issuingOrganization": "Amazon Web Services",
 *       "issueDate": "2023-06-01",
 *       "expirationDate": "2026-06-01"
 *     }
 *   ]
 *   "location": "Ho Chi Minh City, Vietnam",
 *   "major": "Computer Science",
 *   "maxBudget": 20000000,
 *   "minBudget": 5000000,
 *   "subjectCombination": [
 *     { "name": "Math", "score": 8.0 },
 *     { "name": "Literature", "score": 7.0 },
 *     { "name": "English", "score": 9.5 },
 *     { "name": "Physics", "score": 8.75 }
 *   ],
 *   "vsatScore": 85
 * }
 */
export class StudentProfileResponse {
    @Expose()
    aptitudeTestScore?: number;

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
    id!: string;

    @Expose()
    location!: string;

    @Expose()
    major!: string;

    @Expose()
    maxBudget!: number;

    @Expose()
    minBudget!: number;

    /**
     * List of exam subjects
     *
     * @type {ExamSubject[]}
     * @optional
     * @see ExamSubject for detailed structure and validation rules
     */
    @Expose()
    @Type(() => ExamSubject)
    subjectCombination!: ExamSubject[];

    @Expose()
    userId!: string;

    @Expose()
    vsatScore?: number;
}
