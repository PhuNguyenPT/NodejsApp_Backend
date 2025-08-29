// src/dto/student.profile.response.ts
import { Expose, Transform, Type } from "class-transformer";

import { FileResponse } from "@/dto/file/file.response.js";
import { AcademicPerformanceResponse } from "@/dto/student/academic.performance.response.js";
import { AptitudeTestResponse } from "@/dto/student/aptitude.test.response.js";
import { AwardResponse } from "@/dto/student/award.response.js";
import { CertificationResponse } from "@/dto/student/certification.response.js";
import { ConductResponse } from "@/dto/student/conduct.response.js";
import {
    ExamSubject,
    VsatExamSubject,
} from "@/dto/student/exam.profile.dto.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special.student.case.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese.provinces.js";

export class StudentProfileResponse {
    /**
     * Student academic performance assessment
     * Array of academic performance ratings that can include multiple evaluations for different grades/years.
     * Each entry contains an academic performance rating and the corresponding grade level.
     *
     * @type {AcademicPerformanceResponse[]}
     * @optional
     * @see AcademicPerformanceResponse for detailed structure
     * @example [
     *   {
     *     "academicPerformance": "Tốt",
     *     "grade": 10
     *   },
     *   {
     *     "academicPerformance": "Khá",
     *     "grade": 11
     *   },
     *   {
     *     "academicPerformance": "Đạt",
     *     "grade": 12
     *   }
     * ]
     */
    @Expose()
    @Type(() => AcademicPerformanceResponse)
    academicPerformances?: AcademicPerformanceResponse[];

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

    /**
     * Student conduct/behavior assessment
     * Array of conduct ratings that can include multiple evaluations for different grades/years.
     * Each entry contains a conduct rating and the corresponding grade level.
     *
     * @type {ConductResponse[]}
     * @optional
     * @see ConductResponse for detailed structure
     * @example [
     *   {
     *     "conduct": "Tốt",
     *     "grade": 10
     *   },
     *   {
     *     "conduct": "Khá",
     *     "grade": 11
     *   },
     *   {
     *     "conduct": "Đạt",
     *     "grade": 12
     *   }
     * ]
     */
    @Expose()
    @Type(() => ConductResponse)
    conducts?: ConductResponse[];

    @Expose()
    @Type(() => FileResponse)
    fileResponses!: FileResponse[];

    /**
     * @example "f24a03b2-2448-441e-8702-eb577638fb82"
     */
    @Expose()
    id!: string;

    // /**
    //  * Geographic location or preferred study location of the student.
    //  */
    // @Expose()
    // location?: string;

    /**
     * Primary field of study or academic major of the student.
     * @example ["Kỹ thuật", "Máy tính và công nghệ thông tin", "Toán và thống kê"]
     */
    @Expose()
    @Type(() => String)
    majors!: MajorGroup[];

    /**
     * Maximum budget amount that the student is willing or able to spend.
     * Represents the upper limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @example 20000000
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @example 10000000
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    minBudget!: number;

    /**
     * List of exactly 4 exam subjects with their scores
     *
     * @type {ExamSubject[]}
     * @see ExamSubject for detailed structure and validation rules
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @Expose()
    @Type(() => ExamSubject)
    nationalExam!: ExamSubject[];

    /**
     * Province or city where the student's university/college is located
     * @type {VietnamSouthernProvinces}
     * @see VietnamSouthernProvinces for valid enum values
     */
    @Expose()
    @Expose()
    @Type(() => String)
    province!: VietnamSouthernProvinces;

    /**
     * Special student case indicating unique circumstances or qualifications
     * Optional field that can be used to specify if the student falls under any special category
     * Valid values are defined in the SpecialStudentCase enum.
     * @type {SpecialStudentCase}
     * @optional
     * @see SpecialStudentCase for valid enum values
     */
    @Expose()
    @Transform(({ value }) => (value ? String(value) : undefined))
    @Type(() => String)
    specialStudentCase?: SpecialStudentCase;

    /**
     * Talent score (0-10 scale)
     * @example 9.5
     */
    @Expose()
    @Transform(({ value }) => (value ? parseFloat(String(value)) : undefined))
    talentScore?: number;

    /**
     * @example "863fe715-f516-4115-b97e-385fa77fd0d0"
     */
    @Expose()
    userId!: string;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of exactly 3 exam subjects with names and scores (0-150 each)
     * Each subject contains a name and score following the ExamSubject structure
     * @example [
     *     { "name": "Toán", "score": 120 },
     *     { "name": "Ngữ Văn", "score": 130 },
     *     { "name": "Tiếng Anh", "score": 125 }
     * ]
     */
    @Expose()
    @Type(() => VsatExamSubject) // Ensure correct type mapping
    vsatScore?: VsatExamSubject[];
}
