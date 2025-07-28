import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { StudentInfoDTO } from "@/dto/student/student.info";
import { AwardEntity } from "@/entity/award";
import { CertificationEntity } from "@/entity/certification";
import { StudentEntity } from "@/entity/student";
import { TYPES } from "@/type/container/types";
import { ValidationException } from "@/type/exception/validation.exception";

@injectable() // ← Missing decorator
export class StudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private studentRepository: Repository<StudentEntity>,
        @inject(TYPES.AwardRepository)
        private awardRepository: Repository<AwardEntity>,
        @inject(TYPES.CertificationRepository)
        private certificationRepository: Repository<CertificationEntity>,
    ) {}

    public async createStudentProfile(
        studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentEntity> {
        if (studentInfoDTO.budget.minBudget > studentInfoDTO.budget.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
            });
        }

        const studentEntity: StudentEntity = new StudentEntity({
            location: studentInfoDTO.location,
            major: studentInfoDTO.major,
            maxBudget: studentInfoDTO.budget.maxBudget,
            minBudget: studentInfoDTO.budget.minBudget,
        });

        const savedStudent: StudentEntity =
            await this.studentRepository.save(studentEntity);

        if (studentInfoDTO.awards && studentInfoDTO.awards.length > 0) {
            const awards: AwardEntity[] = studentInfoDTO.awards.map(
                (awardDTO) => {
                    const award: AwardEntity = plainToInstance(
                        AwardEntity,
                        awardDTO,
                    );
                    award.studentId = savedStudent.id;
                    return award;
                },
            );
            await this.awardRepository.save(awards);
        }

        if (
            studentInfoDTO.certifications &&
            studentInfoDTO.certifications.length > 0
        ) {
            const certifications: CertificationEntity[] =
                studentInfoDTO.certifications.map((certificationDTO) => {
                    const certificationEntity: CertificationEntity =
                        plainToInstance(CertificationEntity, certificationDTO);
                    certificationEntity.studentId = savedStudent.id;
                    return certificationEntity;
                }); // ← Added missing semicolon
            await this.certificationRepository.save(certifications);
        }

        // Return student with populated relations
        return (
            (await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: { id: savedStudent.id },
            })) ?? savedStudent
        );
    }
}
