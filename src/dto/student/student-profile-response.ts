// src/dto/student.profile.response.ts
import { Expose, Transform, Type } from "class-transformer";

import { FileResponse } from "@/dto/file/file-response.js";
import { AcademicPerformanceResponse } from "@/dto/student/academic-performance-response.js";
import { AptitudeExamResponse } from "@/dto/student/aptitude-exam-response.js";
import { AwardResponse } from "@/dto/student/award-response.js";
import { CertificationResponse } from "@/dto/student/certification-response.js";
import { ConductResponse } from "@/dto/student/conduct-response.js";
import { NationalExam, TalentExam, VsatExam } from "@/dto/student/exam.dto.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";

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
     */
    @Expose()
    @Type(() => AptitudeExamResponse)
    aptitudeExams?: AptitudeExamResponse[];
    /**
     * List of awards and recognitions received by the student.
     * Optional field that can contain multiple award entries.
     * Each award includes details like name, category, level, and award date.
     *
     * @type {AwardResponse[]}
     * @optional
     * @see AwardResponse for detailed structure and validation rules
     * @example
     * [
     *   {
     *     "category": "Tiếng Anh",
     *     "level": "Hạng Nhất",
     *     "name": "Học sinh giỏi cấp Quốc Gia"
     *     },
     *   {
     *     "category": "Tiếng Pháp",
     *     "level": "Hạng Nhì",
     *     "name": "Học sinh giỏi cấp Quốc Gia"
     *   }
     * ]
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
     * @example 90000000
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @example 80000000
     */
    @Expose()
    @Transform(({ value }) => (value ? parseInt(String(value)) : undefined))
    minBudget!: number;

    /**
     * List of exactly 4 exam subjects with their scores
     *
     * @type {NationalExam[]}
     * @see NationalExam for detailed structure and validation rules
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @Expose()
    @Type(() => NationalExam)
    nationalExams!: NationalExam[];

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
     * Special student cases indicating unique circumstances or qualifications
     * Optional array field that can be used to specify if the student falls under any special categories
     * Valid values are defined in the SpecialStudentCase enum.
     * Students can have multiple special cases applied simultaneously.
     *
     * @type {SpecialStudentCase[]}
     * @optional
     * @see SpecialStudentCase for valid enum values
     * @example ["Học sinh thuộc huyện nghèo, vùng đặc biệt khó khăn", "Dân tộc thiểu số rất ít người (Mông, La Ha,...)"]
     */
    @Expose()
    @Type(() => String)
    specialStudentCases?: SpecialStudentCase[];

    /**
     * Talent scores (0-10 scale)
     * @example [{ "name": "Đọc kể diễn cảm", "score": 8.0 }, { "name": "Hát", "score": 7.0 }]
     */
    @Expose()
    @Type(() => TalentExam)
    talentExams?: TalentExam[];

    /**
     * @example "Công lập"
     * @description The type of university (public or private).
     * @type {UniType}
     */
    @Expose()
    @Type(() => String)
    uniType!: UniType;

    /**
     * @example "863fe715-f516-4115-b97e-385fa77fd0d0"
     */
    @Expose()
    userId!: string;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of at lease 3 exam subjects, at most 8 subjects, with names and scores (0-150 each)
     * Each subject contains a name and score following the ExamSubject structure
     * @example [
     *     { "name": "Toán", "score": 120 },
     *     { "name": "Ngữ Văn", "score": 130 },
     *     { "name": "Tiếng Anh", "score": 125 }
     * ]
     * @validation
     * - Must be an array of at lease 3 exam subjects, at most 8 subjects,
     * - Each ExamSubject must have a valid name (string) and score (number 0-150)
     * - Optional field (can be null or undefined)
     * @type {VsatExam[]}
     * @see VsatExam for detailed structure and validation rules
     */
    @Expose()
    @Type(() => VsatExam) // Ensure correct type mapping
    vsatExams?: VsatExam[];
}
