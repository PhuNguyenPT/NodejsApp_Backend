import { AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionModelServiceConfig } from "@/config/prediction-model.config.js";
import { ISubjectScore } from "@/dto/ocr/ocr.js";
import { HsgSubject } from "@/dto/prediction/hsg-subject.enum.js";
import { InterCerEnum } from "@/dto/prediction/inter-cert.enum.js";
import { L3NationalSubject } from "@/dto/prediction/l3-national-subject.enum.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import {
    AwardEnglish,
    AwardQG,
    DGNL,
    InterCer,
    NangKhieuScore,
    THPTSubjectScore,
    TNTHPTScores,
    TranscriptRecordL3,
    TranscriptSubjectScoreL3,
    UserInputL3,
} from "@/dto/prediction/l3-request.dto.js";
import { AptitudeExamDTO } from "@/dto/student/aptitude-exam-dto.js";
import { AwardDTO } from "@/dto/student/award-dto.js";
import { CertificationDTO } from "@/dto/student/certification-dto.js";
import { TalentExam } from "@/dto/student/exam.dto.js";
import { StudentInfoDTO } from "@/dto/student/student.dto.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { CCQTType, ExamType, isCCQTType } from "@/type/enum/exam-type.js";
import { getCodeByVietnameseName, MajorGroup } from "@/type/enum/major.js";
import { NationalExamSubject } from "@/type/enum/national-exam-subject.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";
import { VietnameseSubject } from "@/type/enum/subject.js";
import { TalentExamSubject } from "@/type/enum/talent-exam-subject.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";
import { formatValidationErrors } from "@/util/validation.util.js";

import { IPredictionL3Service } from "../prediction-L3-service.interface.js";

@injectable()
export class PredictionL3Service implements IPredictionL3Service {
    /**
     * Mapping from NationalExcellentStudentExamSubject to HsgSubject
     */
    private readonly NATIONAL_EXCELLENT_TO_HSG_SUBJECT_MAPPING: Record<
        NationalExcellentStudentExamSubject,
        HsgSubject
    > = {
        [NationalExcellentStudentExamSubject.BIOLOGY]: HsgSubject.SINH,
        [NationalExcellentStudentExamSubject.CHEMISTRY]: HsgSubject.HOA,
        [NationalExcellentStudentExamSubject.CHINESE]: HsgSubject.TIENG_TRUNG,
        [NationalExcellentStudentExamSubject.ENGLISH]: HsgSubject.ANH,
        [NationalExcellentStudentExamSubject.FRENCH]: HsgSubject.TIENG_PHAP,
        [NationalExcellentStudentExamSubject.GEOGRAPHY]: HsgSubject.DIA,
        [NationalExcellentStudentExamSubject.HISTORY]: HsgSubject.SU,
        [NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY]:
            HsgSubject.TIN,
        [NationalExcellentStudentExamSubject.JAPANESE]: HsgSubject.TIENG_NHAT,
        [NationalExcellentStudentExamSubject.LITERATURE]: HsgSubject.VAN,
        [NationalExcellentStudentExamSubject.MATHEMATICS]: HsgSubject.TOAN,
        [NationalExcellentStudentExamSubject.PHYSICS]: HsgSubject.LY,
        [NationalExcellentStudentExamSubject.RUSSIAN]: HsgSubject.TIENG_NGA,
    };

    /**
     * Mapping from Rank enum to numeric level
     */
    private readonly RANK_TO_LEVEL_MAPPING: Record<Rank, number> = {
        [Rank.CONSOLATION]: 4,
        [Rank.FIRST]: 1,
        [Rank.SECOND]: 2,
        [Rank.THIRD]: 3,
    };

    /**
     * Mapping from TalentExamSubject to NangKhieuScore properties
     */
    private readonly TALENT_SUBJECT_MAPPING: Record<
        TalentExamSubject,
        keyof NangKhieuScore
    > = {
        [VietnameseSubject.BIEU_DIEN_NGHE_THUAT]: "BIEU_DIEN_NGHE_THUAT",
        [VietnameseSubject.CHI_HUY_TAI_CHO]: "CHI_HUY_TAI_CHO",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC]: "CHUYEN_MON_AM_NHAC",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC_1]: "CHUYEN_MON_AM_NHAC_1",
        [VietnameseSubject.CHUYEN_MON_AM_NHAC_2]: "CHUYEN_MON_AM_NHAC_2",
        [VietnameseSubject.DOC_DIEN_CAM]: "DOC_DIEN_CAM",
        [VietnameseSubject.DOC_HIEU]: "DOC_HIEU",
        [VietnameseSubject.GHI_AM_XUONG_AM]: "GHI_AM_XUONG_AM",
        [VietnameseSubject.HAT]: "HAT",
        [VietnameseSubject.HAT_BIEU_DIEN_NHAC_CU]: "HAT_BIEU_DIEN_NHAC_CU",
        [VietnameseSubject.HAT_MUA]: "HAT_MUA",
        [VietnameseSubject.HAT_XUONG_AM]: "HAT_XUONG_AM",
        [VietnameseSubject.HOA_THANH]: "HOA_THANH",
        [VietnameseSubject.KY_XUONG_AM]: "KY_XUONG_AM",
        [VietnameseSubject.NANG_KHIEU]: "NANG_KHIEU",
        [VietnameseSubject.NANG_KHIEU_1]: "NANG_KHIEU_1",
        [VietnameseSubject.NANG_KHIEU_2]: "NANG_KHIEU_2",
        [VietnameseSubject.NANG_KHIEU_AM_NHAC_1]: "NANG_KHIEU_AM_NHAC_1",
        [VietnameseSubject.NANG_KHIEU_AM_NHAC_2]: "NANG_KHIEU_AM_NHAC_2",
        [VietnameseSubject.NANG_KHIEU_ANH_BAO_CHI]: "NANG_KHIEU_ANH_BAO_CHI",
        [VietnameseSubject.NANG_KHIEU_BAO_CHI]: "NANG_KHIEU_BAO_CHI",
        [VietnameseSubject.NANG_KHIEU_BIEU_DIEN_NGHE_THUAT]:
            "NANG_KHIEU_BIEU_DIEN_NGHE_THUAT",
        [VietnameseSubject.NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT]:
            "NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT",
        [VietnameseSubject.NANG_KHIEU_MAM_NON]: "NANG_KHIEU_MAM_NON",
        [VietnameseSubject.NANG_KHIEU_MAM_NON_1]: "NANG_KHIEU_MAM_NON_1",
        [VietnameseSubject.NANG_KHIEU_MAM_NON_2]: "NANG_KHIEU_MAM_NON_2",
        [VietnameseSubject.NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH]:
            "NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH",
        [VietnameseSubject.NANG_KHIEU_SKDA_1]: "NANG_KHIEU_SKDA_1",
        [VietnameseSubject.NANG_KHIEU_SKDA_2]: "NANG_KHIEU_SKDA_2",
        [VietnameseSubject.NANG_KHIEU_TDTT]: "NANG_KHIEU_TDTT",
        [VietnameseSubject.NANG_KHIEU_THUYET_TRINH]: "NANG_KHIEU_THUYET_TRINH",
        [VietnameseSubject.NANG_KHIEU_VE_1]: "NANG_KHIEU_VE_1",
        [VietnameseSubject.NANG_KHIEU_VE_2]: "NANG_KHIEU_VE_2",
        [VietnameseSubject.PHAT_TRIEN_CHU_DE_PHO_THO]:
            "PHAT_TRIEN_CHU_DE_PHO_THO",
        [VietnameseSubject.TU_DUY_GIAI_QUYET_NGU_VAN_DE]:
            "TU_DUY_GIAI_QUYET_NGU_VAN_DE",
        [VietnameseSubject.VE_HINH_HOA]: "VE_HINH_HOA",
        [VietnameseSubject.VE_HINH_HOA_MY_THUAT]: "VE_HINH_HOA_MY_THUAT",
        [VietnameseSubject.VE_MY_THUAT]: "VE_MY_THUAT",
        [VietnameseSubject.VE_NANG_KHIEU]: "VE_NANG_KHIEU",
        [VietnameseSubject.VE_TRANG_TRI]: "VE_TRANG_TRI",
        [VietnameseSubject.VE_TRANG_TRI_MAU]: "VE_TRANG_TRI_MAU",
        [VietnameseSubject.XAY_DUNG_KICH_BAN_SU_KIEN]:
            "XAY_DUNG_KICH_BAN_SU_KIEN",
    };

    /**
     * Mapping from TranscriptSubject enum to TranscriptSubjectScoreL3 properties
     * All foreign languages map to "anh" as there's only one language field
     */
    private readonly TRANSCRIPT_SUBJECT_MAPPING: Record<
        TranscriptSubject,
        keyof TranscriptSubjectScoreL3
    > = {
        [TranscriptSubject.CONG_NGHE]: "cong_nghe",
        [TranscriptSubject.DIA_LY]: "dia",
        [TranscriptSubject.GDKTPL]: "gdkt_pl",
        [TranscriptSubject.HOA_HOC]: "hoa",
        [TranscriptSubject.LICH_SU]: "su",
        [TranscriptSubject.NGU_VAN]: "van",
        [TranscriptSubject.SINH_HOC]: "sinh",
        [TranscriptSubject.TIENG_ANH]: "anh",
        [TranscriptSubject.TIENG_DUC]: "anh",
        [TranscriptSubject.TIENG_NGA]: "anh",
        [TranscriptSubject.TIENG_NHAT]: "anh",
        [TranscriptSubject.TIENG_PHAP]: "anh",
        [TranscriptSubject.TIENG_TRUNG]: "anh",
        [TranscriptSubject.TIN_HOC]: "tin",
        [TranscriptSubject.TOAN]: "toan",
        [TranscriptSubject.VAT_LY]: "ly",
    };

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.PredictionModelServiceConfig)
        private readonly config: PredictionModelServiceConfig,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.PredictHttpClient)
        private readonly httpClient: AxiosInstance,
        @inject(TYPES.ConcurrencyUtil)
        private readonly concurrencyUtil: ConcurrencyUtil,
        @inject(TYPES.PredictionUtil)
        private readonly predictionUtil: PredictionUtil,
    ) {}

    public async generateL3UserInputCombinations(
        studentEntity: StudentEntity,
        fileEntities: FileEntity[],
    ): Promise<UserInputL3[]> {
        const studentInfoDTO: StudentInfoDTO = plainToInstance(
            StudentInfoDTO,
            studentEntity,
            { excludeExtraneousValues: true },
        );
        await validate(studentInfoDTO);

        // Get certifications and aptitude exams by type
        const ccnnCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCNN");

        const ccqtCertifications: CertificationDTO[] =
            studentInfoDTO.getCertificationsByExamType("CCQT");

        const dgnlAptitudeExams: AptitudeExamDTO[] =
            studentInfoDTO.getAptitudeTestScoresByExamType("ĐGNL");

        // Create base template for user inputs
        const baseTemplate = this.createBaseL3UserInputTemplate(studentInfoDTO);

        const thptScores: TNTHPTScores = new TNTHPTScores();
        const electiveSubjects: THPTSubjectScore[] = [];

        studentInfoDTO.nationalExams.forEach((nationalExam) => {
            const l3Subject = this.mapNationalExamSubjectToL3NationalSubject(
                nationalExam.name,
            );

            switch (nationalExam.name) {
                case VietnameseSubject.NGU_VAN:
                    thptScores.literature_score = plainToInstance(
                        THPTSubjectScore,
                        {
                            score: nationalExam.score,
                            subject_name: l3Subject,
                        },
                    );
                    break;
                case VietnameseSubject.TOAN:
                    thptScores.math_score = plainToInstance(THPTSubjectScore, {
                        score: nationalExam.score,
                        subject_name: l3Subject,
                    });
                    break;
                default:
                    // Collect remaining subjects as potential electives
                    electiveSubjects.push({
                        score: nationalExam.score,
                        subject_name: l3Subject,
                    });
                    break;
            }
        });

        // Assign the first 2 elective subjects to elective_1_score and elective_2_score
        if (electiveSubjects.length >= 2) {
            thptScores.elective_1_score = plainToInstance(THPTSubjectScore, {
                score: electiveSubjects[0].score,
                subject_name: electiveSubjects[0].subject_name,
            });

            thptScores.elective_2_score = plainToInstance(THPTSubjectScore, {
                score: electiveSubjects[1].score,
                subject_name: electiveSubjects[1].subject_name,
            });
        }

        const transcriptRecordL3: TranscriptRecordL3 = new TranscriptRecordL3();

        fileEntities.forEach((fileEntity) => {
            // Determine which grade this file represents
            const grade = this.extractGradeFromFile(fileEntity);

            if (!grade) return;

            const ocrResultEntity: OcrResultEntity | undefined =
                fileEntity.ocrResult;
            if (!ocrResultEntity?.scores) return;

            // Map OCR scores to transcript subject scores
            const subjectScoresMap = this.mapOcrScoresToTranscriptSubjects(
                ocrResultEntity.scores,
            );

            // Assign scores to the appropriate grade
            const transcriptSubjectScore =
                this.assignScoresToTranscriptSubjectScoreL3(subjectScoresMap);

            switch (grade) {
                case 10:
                    transcriptRecordL3.grade_10 = transcriptSubjectScore;
                    break;
                case 11:
                    transcriptRecordL3.grade_11 = transcriptSubjectScore;
                    break;
                case 12:
                    transcriptRecordL3.grade_12 = transcriptSubjectScore;
                    break;
            }
        });

        const awardQG: AwardQG[] = studentInfoDTO.awards
            ? this.mapAwardsToAwardQG(studentInfoDTO.awards)
            : [];

        const nangKhieuScore: NangKhieuScore | undefined =
            this.mapTalentExamsToNangKhieu(studentInfoDTO.talentExams);

        // Map all possible combinations
        const awardEnglishOptions: (AwardEnglish | undefined)[] =
            ccnnCertifications.length > 0
                ? ccnnCertifications.map((cert) =>
                      this.mapCCNNCertificationToAwardEnglish(cert),
                  )
                : [undefined];

        const interCerOptions: (InterCer | undefined)[] =
            ccqtCertifications.length > 0
                ? ccqtCertifications.map((cert) =>
                      this.mapCCQTCertificationToInterCer(cert),
                  )
                : [undefined];

        const dgnlOptions: (DGNL | undefined)[] =
            dgnlAptitudeExams.length > 0
                ? dgnlAptitudeExams.map((exam) =>
                      this.mapDGNLAptitudeExamToDGNL(exam),
                  )
                : [undefined];

        const majors: MajorGroup[] = studentInfoDTO.majors;
        const combinations: UserInputL3[] = [];

        // Generate all combinations
        for (const major of majors) {
            const majorCode = getCodeByVietnameseName(major);
            if (!majorCode) {
                this.logger.warn(
                    `L3 Prediction: Cannot find code for major: ${major}`,
                );
                continue;
            }

            for (const awardEnglish of awardEnglishOptions) {
                for (const interCer of interCerOptions) {
                    for (const dgnl of dgnlOptions) {
                        const userInput: UserInputL3 = plainToInstance(
                            UserInputL3,
                            {
                                ...baseTemplate,
                                award_english: awardEnglish,
                                award_qg:
                                    awardQG.length > 0 ? awardQG : undefined,
                                dgnl: dgnl,
                                hoc_ba: transcriptRecordL3,
                                int_cer: interCer,
                                nang_khieu: nangKhieuScore,
                                nhom_nganh: majorCode,
                                thpt: thptScores,
                            },
                        );

                        combinations.push(userInput);
                    }
                }
            }
        }

        this.logger.info("L3 Prediction: Generated combinations", {
            awardEnglishOptions: awardEnglishOptions.length,
            dgnlOptions: dgnlOptions.length,
            generatedCombinations: combinations.length,
            interCerOptions: interCerOptions.length,
            majors: majors.length,
        });

        return combinations;
    }

    public async predictMajorsL3(
        userInput: UserInputL3,
    ): Promise<L3PredictResult> {
        const response = await this.httpClient.post<L3PredictResult>(
            `/calculate/l3`,
            userInput,
        );

        const validatedResult = await this.validateL3PredictResponse(
            response.data,
        );

        this.logger.info("L3 Prediction: Completed", {
            majorGroup: userInput.nhom_nganh,
            resultsCount: Object.keys(validatedResult.result).length,
        });

        return validatedResult;
    }

    public async predictMajorsL3Batch(
        userInputs: UserInputL3[],
    ): Promise<L3PredictResult[]> {
        const response = await this.httpClient.post<L3PredictResult[]>(
            `/calculate/l3/batch`,
            userInputs,
        );

        // Validate each result in the array
        const validatedResults: L3PredictResult[] = [];
        for (const data of response.data) {
            const validatedResult = await this.validateL3PredictResponse(data);
            validatedResults.push(validatedResult);
        }

        this.logger.info("L3 Prediction Batch: Completed", {
            inputCount: userInputs.length,
            resultCount: validatedResults.length,
        });

        return validatedResults;
    }

    /**
     * Assign mapped scores to TranscriptSubjectScoreL3
     * @param subjectScoresMap Map of subject to score
     * @returns Populated TranscriptSubjectScoreL3 instance
     */
    private assignScoresToTranscriptSubjectScoreL3(
        subjectScoresMap: Map<TranscriptSubject, number>,
    ): TranscriptSubjectScoreL3 {
        const scoreData: Partial<
            Record<keyof TranscriptSubjectScoreL3, number>
        > = {};

        subjectScoresMap.forEach((score, subject) => {
            const propertyName = this.TRANSCRIPT_SUBJECT_MAPPING[subject];
            scoreData[propertyName] = score;
        });

        return plainToInstance(TranscriptSubjectScoreL3, scoreData);
    }

    private createBaseL3UserInputTemplate(
        studentInfoDTO: StudentInfoDTO,
    ): Omit<
        UserInputL3,
        | "award_english"
        | "award_qg"
        | "dgnl"
        | "hoc_ba"
        | "int_cer"
        | "nang_khieu"
        | "nhom_nganh"
        | "thpt"
    > {
        return {
            cong_lap: this.predictionUtil.mapUniTypeToBinaryFlag(
                studentInfoDTO.uniType,
            ),
            hoc_phi: studentInfoDTO.maxBudget,
            priority_object: 0,
            priority_region: 0,
            tinh_tp: studentInfoDTO.province,
        };
    }

    /**
     * Extract grade number (10, 11, 12) from file entity
     */
    private extractGradeFromFile(fileEntity: FileEntity): null | number {
        // Check description
        if (fileEntity.description) {
            const match = /\b(10|11|12)\b/.exec(fileEntity.description);
            if (match) return parseInt(match[1]);
        }

        // Check tags
        if (fileEntity.tags?.length) {
            for (const tag of fileEntity.tags) {
                if (["10", "11", "12"].includes(tag)) {
                    return parseInt(tag);
                }
            }
        }

        return null;
    }

    /**
     * Convert AwardDTO array to AwardQG array
     * @param awards Array of AwardDTO objects
     * @returns Array of AwardQG objects
     */
    private mapAwardsToAwardQG(awards: AwardDTO[]): AwardQG[] {
        return awards
            .map((award) => {
                const hsgSubject =
                    this.NATIONAL_EXCELLENT_TO_HSG_SUBJECT_MAPPING[
                        award.category
                    ];
                const level = this.RANK_TO_LEVEL_MAPPING[award.level];

                if (!level) {
                    return null;
                }

                return plainToInstance(AwardQG, {
                    level: level,
                    subject: hsgSubject,
                });
            })
            .filter((award) => award !== null);
    }

    /**
     * Map a single CCNN certification to AwardEnglish (CEFR level)
     * @param certification CertificationDTO object
     * @returns AwardEnglish instance or undefined if no CEFR
     */
    private mapCCNNCertificationToAwardEnglish(
        certification: CertificationDTO,
    ): AwardEnglish | undefined {
        if (!certification.cefr) {
            this.logger.warn(
                "L3 Prediction: CCNN certification missing CEFR level",
                {
                    examType: certification.examType,
                    level: certification.level,
                },
            );
            return undefined;
        }

        return plainToInstance(AwardEnglish, {
            level: certification.cefr,
        });
    }

    /**
     * Map a single CCQT certification to InterCer
     * @param certification CertificationDTO object
     * @returns InterCer instance or undefined if invalid
     */
    private mapCCQTCertificationToInterCer(
        certification: CertificationDTO,
    ): InterCer | undefined {
        // Type guard to ensure it's a CCQT type
        if (!isCCQTType(certification.examType)) {
            this.logger.warn(
                "L3 Prediction: Certification is not a CCQT type",
                {
                    examType: certification.examType,
                },
            );
            return undefined;
        }

        // Now TypeScript knows certification.examType is CCQTType
        const interCerName = this.mapCCQTTypeToInterCerEnum(
            certification.examType,
        );

        // Parse the level string to a number
        const score = parseFloat(certification.level);

        if (isNaN(score)) {
            this.logger.warn(
                `L3 Prediction: Invalid score for CCQT certification: ${certification.level}`,
                {
                    examType: certification.examType,
                    level: certification.level,
                },
            );
            return undefined;
        }

        return plainToInstance(InterCer, {
            name: interCerName,
            score: score,
        });
    }

    private mapCCQTTypeToInterCerEnum(examType: CCQTType): InterCerEnum {
        switch (examType) {
            case ExamType.A_Level:
                return InterCerEnum.A_LEVEL;
            case ExamType.ACT:
                return InterCerEnum.ACT;
            case ExamType.Duolingo_English_Test:
                return InterCerEnum.DOULINGO_ENGLISH_TEST;
            case ExamType.IB:
                return InterCerEnum.IB;
            case ExamType.OSSD:
                return InterCerEnum.OSSD;
            case ExamType.PTE_Academic:
                return InterCerEnum.PTE_ACADEMIC;
            case ExamType.SAT:
                return InterCerEnum.SAT;
            default: {
                const _exhaustiveCheck: never = examType;
                throw new Error(
                    `Unsupported CCQT exam type: ${String(_exhaustiveCheck)}`,
                );
            }
        }
    }

    /**
     * Map a single DGNL aptitude exam to DGNL scores
     * @param aptitudeExam AptitudeExamDTO object
     * @returns DGNL instance or undefined if missing required scores
     */
    private mapDGNLAptitudeExamToDGNL(
        aptitudeExam: AptitudeExamDTO,
    ): DGNL | undefined {
        // Check if it has the required scores
        if (
            aptitudeExam.languageScore === undefined ||
            aptitudeExam.mathScore === undefined ||
            aptitudeExam.scienceLogic === undefined
        ) {
            this.logger.warn(
                "L3 Prediction: DGNL exam missing required component scores",
                {
                    examType: aptitudeExam.examType,
                },
            );
            return undefined;
        }

        return plainToInstance(DGNL, {
            language_score: aptitudeExam.languageScore,
            math_score: aptitudeExam.mathScore,
            science_logic: aptitudeExam.scienceLogic,
        });
    }

    private mapNationalExamSubjectToL3NationalSubject(
        nationalExamSubject: NationalExamSubject,
    ): L3NationalSubject {
        switch (nationalExamSubject) {
            case VietnameseSubject.CONG_NGHE_CONG_NGHIEP:
                return L3NationalSubject.CONG_NGHE_CONG_NGHIEP;
            case VietnameseSubject.CONG_NGHE_NONG_NGHIEP:
                return L3NationalSubject.CONG_NGHE_NONG_NGHIEP;
            case VietnameseSubject.DIA_LY:
                return L3NationalSubject.DIA_LY;
            case VietnameseSubject.GDKTPL:
                return L3NationalSubject.GDKTPL;
            case VietnameseSubject.HOA_HOC:
                return L3NationalSubject.HOA_HOC;
            case VietnameseSubject.LICH_SU:
                return L3NationalSubject.LICH_SU;
            case VietnameseSubject.NGU_VAN:
                return L3NationalSubject.NGU_VAN;
            case VietnameseSubject.SINH_HOC:
                return L3NationalSubject.SINH_HOC;
            case VietnameseSubject.TIENG_ANH:
                return L3NationalSubject.TIENG_ANH;
            case VietnameseSubject.TIENG_DUC:
                return L3NationalSubject.TIENG_DUC;
            case VietnameseSubject.TIENG_HAN:
                return L3NationalSubject.TIENG_HAN;
            case VietnameseSubject.TIENG_NGA:
                return L3NationalSubject.TIENG_NGA;
            case VietnameseSubject.TIENG_NHAT:
                return L3NationalSubject.TIENG_NHAT;
            case VietnameseSubject.TIENG_PHAP:
                return L3NationalSubject.TIENG_PHAP;
            case VietnameseSubject.TIENG_TRUNG:
                return L3NationalSubject.TIENG_TRUNG;
            case VietnameseSubject.TIN_HOC:
                return L3NationalSubject.TIN_HOC;
            case VietnameseSubject.TOAN:
                return L3NationalSubject.TOAN;
            case VietnameseSubject.VAT_LY:
                return L3NationalSubject.VAT_LY;
            default: {
                const _exhaustiveCheck: never = nationalExamSubject;
                throw new Error(
                    `Unsupported national exam subject: ${String(_exhaustiveCheck)}`,
                );
            }
        }
    }

    /**
     * Map OCR subject scores to TranscriptSubject enum
     */
    private mapOcrScoresToTranscriptSubjects(
        ocrScores: ISubjectScore[],
    ): Map<TranscriptSubject, number> {
        const scoreMap = new Map<TranscriptSubject, number>();

        ocrScores.forEach((score) => {
            const transcriptSubject = score.name;
            if (Object.values(TranscriptSubject).includes(transcriptSubject)) {
                scoreMap.set(transcriptSubject, score.score);
            }
        });

        return scoreMap;
    }
    /**
     * Map TalentExam array to NangKhieuScore
     * @param talentExams Array of TalentExam objects
     * @returns NangKhieuScore instance or undefined if no talent exams
     */
    private mapTalentExamsToNangKhieu(
        talentExams?: TalentExam[],
    ): NangKhieuScore | undefined {
        if (!talentExams || talentExams.length === 0) {
            return undefined;
        }

        const scoreData: Partial<Record<keyof NangKhieuScore, number>> = {};

        talentExams.forEach((exam) => {
            const propertyName = this.TALENT_SUBJECT_MAPPING[exam.name];
            scoreData[propertyName] = exam.score;
        });

        // Only return if we have at least one score mapped
        if (Object.keys(scoreData).length === 0) {
            return undefined;
        }

        return plainToInstance(NangKhieuScore, scoreData);
    }

    private async validateL3PredictResponse(
        data: unknown,
    ): Promise<L3PredictResult> {
        const instance = plainToInstance(L3PredictResult, data);
        const errors = await validate(instance);

        if (errors.length > 0) {
            const validationErrors = formatValidationErrors(errors);

            throw new ValidationException(
                validationErrors,
                "Invalid L3 prediction response",
            );
        }

        return instance;
    }
}
