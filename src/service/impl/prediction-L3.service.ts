import { AxiosInstance } from "axios";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionModelServiceConfig } from "@/config/prediction-model.config.js";
import { HsgSubject } from "@/dto/prediction/hsg-subject.enum.js";
import { InterCerEnum } from "@/dto/prediction/inter-cert.enum.js";
import { L3NationalSubject } from "@/dto/prediction/l3-national-subject.enum.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserInputL3 } from "@/dto/prediction/l3-request.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { CCQTType, ExamType } from "@/type/enum/exam-type.js";
import { NationalExamSubject } from "@/type/enum/national-exam-subject.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national-excellent-exam.js";
import { VietnameseSubject } from "@/type/enum/subject.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";
import { formatValidationErrors } from "@/util/validation.util.js";

import { IPredictionL3Service } from "../prediction-L3-service.interface.js";

@injectable()
export class PredictionL3Service implements IPredictionL3Service {
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

    private mapNationalExcellentStudentExamSubjectToHsgSubject(
        subject: NationalExcellentStudentExamSubject,
    ): HsgSubject {
        switch (subject) {
            case NationalExcellentStudentExamSubject.BIOLOGY:
                return HsgSubject.SINH;
            case NationalExcellentStudentExamSubject.CHEMISTRY:
                return HsgSubject.HOA;
            case NationalExcellentStudentExamSubject.CHINESE:
                return HsgSubject.TIENG_TRUNG;
            case NationalExcellentStudentExamSubject.ENGLISH:
                return HsgSubject.ANH;
            case NationalExcellentStudentExamSubject.FRENCH:
                return HsgSubject.TIENG_PHAP;
            case NationalExcellentStudentExamSubject.GEOGRAPHY:
                return HsgSubject.DIA;
            case NationalExcellentStudentExamSubject.HISTORY:
                return HsgSubject.SU;
            case NationalExcellentStudentExamSubject.INFORMATION_TECHNOLOGY:
                return HsgSubject.TIN;
            case NationalExcellentStudentExamSubject.JAPANESE:
                return HsgSubject.TIENG_NHAT;
            case NationalExcellentStudentExamSubject.LITERATURE:
                return HsgSubject.VAN;
            case NationalExcellentStudentExamSubject.MATHEMATICS:
                return HsgSubject.TOAN;
            case NationalExcellentStudentExamSubject.PHYSICS:
                return HsgSubject.LY;
            case NationalExcellentStudentExamSubject.RUSSIAN:
                return HsgSubject.TIENG_NGA;
            default: {
                const _exhaustiveCheck: never = subject;
                throw new Error(
                    `Unsupported national excellent student exam subject: ${String(_exhaustiveCheck)}`,
                );
            }
        }
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
