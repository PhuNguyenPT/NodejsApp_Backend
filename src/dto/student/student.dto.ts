// src/dto/student.info.dto.ts
import { Expose, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    ValidateIf,
    ValidateNested,
} from "class-validator";

import { AcademicPerformanceDTO } from "@/dto/student/academic-performance-dto.js";
import { AptitudeExamDTO } from "@/dto/student/aptitude-exam-dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { ConductDTO } from "@/dto/student/conduct-dto.js";
import { NationalExam, TalentExam, VsatExam } from "@/dto/student/exam.dto.js";
import {
    ExamType,
    isCCNNType,
    isCCQTType,
    isDGNLType,
} from "@/type/enum/exam-type.js";
import { MajorGroup } from "@/type/enum/major.js";
import { SpecialStudentCase } from "@/type/enum/special-student-case.js";
import { VietnameseSubject } from "@/type/enum/subject.js";
import { UniType } from "@/type/enum/uni-type.js";
import { VietnamSouthernProvinces } from "@/type/enum/vietnamese-provinces.js";
import { IsArrayUnique } from "@/validator/is-array-unique.validator.js";
import { IsValidNationalExamSubjects } from "@/validator/is-national-exam-subject.validator.js";

import { MajorGroupDTO } from "./major-group.dto.js";

export class StudentInfoDTO {
    /**
     * Student academic performance assessment
     * Array of academic performance ratings that can include multiple evaluations for different grades/years.
     * Each entry contains an academic performance rating and the corresponding grade level.
     * Valid academic performance values are defined in the AcademicPerformance enum.
     *
     * @type {AcademicPerformanceDTO[]}
     * @required
     * @see AcademicPerformanceDTO for detailed structure and validation rules
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
    @Type(() => AcademicPerformanceDTO)
    @ValidateNested({ each: true })
    academicPerformances!: AcademicPerformanceDTO[];

    /**
     * Aptitude test information including exam type and score
     * Contains the exam type (DGNL, CCNN, or CCQT) and the numeric score achieved
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
    @Type(() => AptitudeExamDTO)
    @ValidateNested({ each: true })
    aptitudeExams?: AptitudeExamDTO[];

    /**
     * List of awards and recognitions received by the student.
     * Optional field that can contain multiple award entries.
     * Each award includes details like name, category, level, and award date.
     *
     * @type {AwardDTO[]}
     * @optional
     * @see AwardDTO for detailed structure and validation rules
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
    @Type(() => AwardDTO)
    @ValidateNested({ each: true })
    awards?: AwardDTO[];

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
    @Type(() => CertificationDTO)
    @ValidateNested({ each: true })
    certifications?: CertificationDTO[];

    /**
     * Student conduct/behavior assessment
     * Array of conduct ratings that can include multiple evaluations for different grades/years.
     * Each entry contains a conduct rating and the corresponding grade level.
     * Valid conduct values are defined in the Conduct enum.
     *
     * @type {ConductDTO[]}
     * @required
     * @see ConductDTO for detailed structure and validation rules
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
     *     "conduct": "Chưa Đạt",
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
    @Type(() => ConductDTO)
    @ValidateNested({ each: true })
    conducts!: ConductDTO[];

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
    @Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
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
    @Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        const num = Number(value);
        return isNaN(num) ? value : num;
    })
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
     * Major group entities with codes for filtering admissions
     * These represent the detailed major group classifications with their 3-digit codes
     *
     * @type {MajorGroupDTO[]}
     * @optional
     * @example [
     *   { "code": "714", "name": "Khoa học giáo dục và đào tạo giáo viên" },
     *   { "code": "748", "name": "Máy tính và công nghệ thông tin" }
     * ]
     */
    @Expose()
    @IsArray()
    @IsOptional()
    @Type(() => MajorGroupDTO)
    @ValidateNested({ each: true })
    studentMajorGroups?: MajorGroupDTO[];

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
    @ArrayMaxSize(12)
    @Expose()
    @IsArray()
    @IsArrayUnique("name")
    @IsOptional()
    @Type(() => TalentExam)
    @ValidateNested({ each: true })
    talentExams?: TalentExam[];

    /**
     * @example "Công lập"
     * @description The type of university (public or private).
     * @type {UniType}
     * @see UniType For the list of possible university types.
     */
    @Expose()
    @IsEnum(UniType)
    @IsNotEmpty()
    uniType!: UniType;

    /**
     * VSAT score (Vietnamese Scholastic Aptitude Test)
     * Array of at least 3 exam subjects, at most 8 subjects, with names and scores (0-150 each)
     * @validation
     * - If provided, must have 3-8 exam subjects
     * - Optional field (can be null, undefined, or omitted)
     * - Empty arrays or arrays with <3 items are treated as undefined
     * @example [
     *     { "name": "Toán", "score": 120 },
     *     { "name": "Ngữ Văn", "score": 130 },
     *     { "name": "Tiếng Anh", "score": 125 }
     * ]
     */
    @ArrayMaxSize(8)
    @ArrayMinSize(3)
    @Expose()
    @IsArray()
    @IsArrayUnique("name")
    @IsOptional()
    @Transform(({ value }: { value: unknown }): undefined | VsatExam[] => {
        if (!Array.isArray(value) || value.length < 3) {
            return undefined;
        }
        return value as VsatExam[];
    })
    @Type(() => VsatExam)
    @ValidateIf((obj: StudentInfoDTO) => {
        return obj.vsatExams !== undefined && obj.vsatExams.length >= 3;
    })
    @ValidateNested({ each: true })
    vsatExams?: VsatExam[];

    getAptitudeTestScoresByExamType(
        type: "CCNN" | "CCQT" | "ĐGNL",
    ): AptitudeExamDTO[] {
        if (!this.aptitudeExams) return [];

        return this.aptitudeExams.filter(
            (cert) => this.getExamCategory(cert.examType) === type,
        );
    }

    getCertificationsByExamType(
        type: "CCNN" | "CCQT" | "ĐGNL",
    ): CertificationDTO[] {
        if (!this.certifications) return [];

        return this.certifications.filter(
            (cert) => this.getExamCategory(cert.examType) === type,
        );
    }

    getExamCategory(examType: ExamType): "CCNN" | "CCQT" | "ĐGNL" | null {
        if (isCCNNType(examType)) {
            return "CCNN";
        }
        if (isCCQTType(examType)) {
            return "CCQT";
        }
        if (isDGNLType(examType)) {
            return "ĐGNL";
        }
        return null;
    }

    /**
     * Get all major group codes as a Set for efficient filtering
     */
    getMajorGroupCodes(): Set<string> {
        if (!this.studentMajorGroups) return new Set();
        return new Set(this.studentMajorGroups.map((mg) => mg.code));
    }

    getTotalVSATScore(): number {
        if (!this.vsatExams || !Array.isArray(this.vsatExams)) return 0;
        return this.vsatExams.reduce(
            (sum, examSubject) => sum + examSubject.score,
            0,
        );
    }

    hasCertificationExamType(type: "CCNN" | "CCQT" | "ĐGNL"): boolean {
        return this.getCertificationsByExamType(type).length > 0;
    }

    hasValidNationalExam(): boolean {
        return this.nationalExams.length === 4;
    }

    hasValidVSATScores(): boolean {
        return (
            this.vsatExams !== undefined &&
            Array.isArray(this.vsatExams) &&
            this.vsatExams.length >= 3 &&
            this.vsatExams.length <= 8 &&
            this.vsatExams.every(
                (examSubject) =>
                    typeof examSubject === "object" &&
                    Object.values(VietnameseSubject).includes(
                        examSubject.name,
                    ) &&
                    typeof examSubject.score === "number" &&
                    examSubject.score >= 0 &&
                    examSubject.score <= 150,
            )
        );
    }
}
