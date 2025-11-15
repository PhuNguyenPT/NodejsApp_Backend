// src/dto/student.info.dto.ts
import { Expose, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    ValidateNested,
} from "class-validator";

import { AcademicPerformanceRequest } from "@/dto/student/academic-performance-request.js";
import { AptitudeExamRequest } from "@/dto/student/aptitude-exam-request.js";
import { AwardRequest } from "@/dto/student/award-request.js";
import { CertificationRequest } from "@/dto/student/certification-request.js";
import { ConductRequest } from "@/dto/student/conduct-request.js";
import { NationalExam, TalentExam, VsatExam } from "@/dto/student/exam.dto.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";
import { IsArrayUnique } from "@/validator/is-array-unique.validator.js";
import { IsValidNationalExamSubjects } from "@/validator/is-national-exam-subject.validator.js";

export class StudentRequest {
    /**
     * Student academic performance assessment
     * Array of academic performance ratings that can include multiple evaluations for different grades/years.
     * Each entry contains an academic performance rating and the corresponding grade level.
     * Valid academic performance values are defined in the AcademicPerformance enum.
     *
     * @type {AcademicPerformanceRequest[]}
     * @required
     * @see AcademicPerformanceRequest for detailed structure and validation rules
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
    @ArrayMaxSize(3)
    @ArrayMinSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique("grade")
    @IsNotEmpty()
    @Type(() => AcademicPerformanceRequest)
    @ValidateNested({ each: true })
    academicPerformances!: AcademicPerformanceRequest[];

    /**
     * Aptitude test information including exam type and score
     * Contains the exam type (DGNL, CCNN, or CCQT) and the numeric score achieved
     * @type {AptitudeExamRequest[]}
     * @optional
     * @see AptitudeExamRequest for detailed structure and validation rules
     *
     * @example
     * [
     *   {
     *     "examType": "VNUHCM",
     *     "score": 700,
     *     "languageScore": 350,
     *     "mathScore": 200,
     *     "scienceLogic": 150
     *   },
     *   {
     *     "examType": "HSA",
     *     "score": 90
     *   }
     * ]
     */
    @ArrayMaxSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique("examType")
    @IsOptional()
    @Type(() => AptitudeExamRequest)
    @ValidateNested({ each: true })
    aptitudeExams?: AptitudeExamRequest[];

    /**
     * List of awards and recognitions received by the student.
     * Optional field that can contain multiple award entries.
     * Each award includes details like name, category, level, and award date.
     *
     * @type {AwardRequest[]}
     * @optional
     * @see AwardRequest for detailed structure and validation rules
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
    @ArrayMaxSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique()
    @IsOptional()
    @Type(() => AwardRequest)
    @ValidateNested({ each: true })
    awards?: AwardRequest[];

    /**
     * List of professional certifications earned by the student.
     * Optional field that can contain multiple certification entries.
     * Each certification includes details like name, issuing organization, and validity dates.
     *
     * @type {CertificationRequest[]}
     * @optional
     * @see CertificationRequest for detailed structure and validation rules
     * @example
     * [
     *   {
     *     "examType": "IELTS",
     *     "level": "6.5"
     *   },
     *   {
     *     "examType": "SAT",
     *     "level": "1200"
     *   }
     * ]
     */
    @ArrayMaxSize(6)
    @Expose()
    @IsArray()
    @IsArrayUnique("examType")
    @IsOptional()
    @Type(() => CertificationRequest)
    @ValidateNested({ each: true })
    certifications?: CertificationRequest[];

    /**
     * Student conduct/behavior assessment
     * Array of conduct ratings that can include multiple evaluations for different grades/years.
     * Each entry contains a conduct rating and the corresponding grade level.
     * Valid conduct values are defined in the Conduct enum.
     *
     * @type {ConductRequest[]}
     * @required
     * @see ConductRequest for detailed structure and validation rules
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
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be an array of ConductDTO objects
     * - Each ConductDTO must have valid conduct enum value and grade (1-12)
     * - Array cannot be empty
     */
    @ArrayMaxSize(3)
    @ArrayMinSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique("grade")
    @IsNotEmpty()
    @Type(() => ConductRequest)
    @ValidateNested({ each: true })
    conducts!: ConductRequest[];

    /**
     * Student's major group classifications using standardized Vietnamese categories.
     * Array of major group values that the student is interested in pursuing.
     * Must contain at least 1 and at most 3 valid MajorGroup values.
     *
     * @type {MajorGroup[]}
     * @required
     * @example ["Kỹ thuật", "Máy tính và công nghệ thông tin", "Toán và thống kê"]
     * @example ["Kinh doanh và quản lý"]
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be an array with 1-3 valid MajorGroup values
     * - Each value must correspond to official Vietnamese education major group classifications
     * - Array cannot be empty
     * - Maximum 3 major groups allowed
     * - Minimum 1 major group required
     */
    @ArrayMaxSize(3)
    @ArrayMinSize(1)
    @Expose()
    @IsArray()
    @IsArrayUnique()
    @IsEnum(MajorGroup, {
        each: true,
    })
    @IsNotEmpty()
    majors!: MajorGroup[];

    /**
     * Maximum budget amount that the student is willing or able to spend.
     * Represents the upper limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     * @example 90000000
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     */
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    maxBudget!: number;

    /**
     * Minimum budget amount that the student requires or prefers to spend.
     * Represents the lower limit of the budget range in Vietnamese Dong (VND).
     *
     * @type {number}
     * @required
     * @minimum 1
     * @example 80000000
     * @validation
     * - Required field (cannot be null or undefined)
     * - Must be a valid number
     * - Must be greater than 0
     *
     * Note: The relationship validation (minBudget <= maxBudget) is handled in the service layer
     */
    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    minBudget!: number;

    /**
     * Array of exactly 4 national exam subjects
     * @example [{ "name": "Toán", "score": 8.0 }, { "name": "Ngữ Văn", "score": 7.0 }, { "name": "Tiếng Anh", "score": 9.5 }, { "name": "Vật Lý", "score": 8.75 }]
     */
    @Expose()
    @IsArrayUnique("name")
    @IsValidNationalExamSubjects()
    @Type(() => NationalExam)
    @ValidateNested({ each: true })
    nationalExams!: NationalExam[];

    /**
     * Province or city where the student's university/college is located
     * @type {VietnamSouthernProvinces}
     * @see VietnamSouthernProvinces for valid enum values
     */
    @Expose()
    @IsEnum(VietnamSouthernProvinces)
    @IsNotEmpty({ message: "Province is required" })
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
    @IsArray()
    @IsArrayUnique()
    @IsEnum(SpecialStudentCase, {
        each: true,
    })
    @IsOptional()
    specialStudentCases?: SpecialStudentCase[];

    /**
     * Talent score representing the student's aptitude or potential
     * Optional field that can be used to indicate the student's talent level
     * Only accepts subjects that are valid talent exam subjects
     *
     * @type {TalentExam[]}
     * @optional
     * @see TalentExam
     * @example [{ "name": "Đọc diễn cảm", "score": 8.0 }, { "name": "Hát", "score": 7.0 }]
     */
    @Expose()
    @IsArray()
    @IsArrayUnique("name")
    @IsOptional()
    @Type(() => TalentExam)
    @ValidateNested({ each: true })
    talentExams?: TalentExam[];

    /**
     * @type {UniType}
     * @see UniType For the list of possible university types.
     * @example "Công lập"
     * @description The type of university (public or private).
     */
    @Expose()
    @IsEnum(UniType)
    @IsNotEmpty()
    uniType!: UniType;

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
    @ArrayMaxSize(8)
    @ArrayMinSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique("name")
    @IsOptional()
    @Type(() => VsatExam)
    @ValidateNested({ each: true })
    vsatExams?: VsatExam[];
}
