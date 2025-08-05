import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { defaultPaginationConfig } from "@/config/pagination.config";
import { StudentInfoDTO } from "@/dto/student/student.info";
import { AwardEntity } from "@/entity/award";
import { CertificationEntity } from "@/entity/certification";
import { StudentEntity } from "@/entity/student";
import { TYPES } from "@/type/container/types";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception";
import { ValidationException } from "@/type/exception/validation.exception";
import { ILogger } from "@/type/interface/logger";
import { Page } from "@/type/pagination/page";
import { Pageable } from "@/type/pagination/pageable";
@injectable() // ← Missing decorator
export class StudentService {
    constructor(
        @inject(TYPES.StudentRepository)
        private studentRepository: Repository<StudentEntity>,
        @inject(TYPES.AwardRepository)
        private awardRepository: Repository<AwardEntity>,
        @inject(TYPES.CertificationRepository)
        private certificationRepository: Repository<CertificationEntity>,
        @inject(TYPES.Logger)
        private logger: ILogger,
    ) {}

    public async createStudentEntity(
        studentInfoDTO: StudentInfoDTO,
    ): Promise<StudentEntity> {
        if (studentInfoDTO.minBudget > studentInfoDTO.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
            });
        }

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentInfoDTO);

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

        this.logger.info(
            `Create Anonymous Student Profile id: ${studentEntity.id} successfully`,
        );
        // Return student with populated relations
        return (
            (await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: { id: savedStudent.id },
            })) ?? savedStudent
        );
    }

    public async createStudentEntityByUserId(
        studentInfoDTO: StudentInfoDTO,
        userId: string,
    ): Promise<StudentEntity> {
        if (studentInfoDTO.minBudget > studentInfoDTO.maxBudget) {
            throw new ValidationException({
                "budget.minBudget":
                    "Min budget cannot be greater than max budget",
            });
        }
        if (!userId) {
            throw new ValidationException({
                userId: "User ID is required to create a student profile",
            });
        }

        const studentEntity: StudentEntity =
            this.studentRepository.create(studentInfoDTO);
        studentEntity.userId = userId; // Set userId for the student entity

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

        this.logger.info(
            `Create Student Profile id: ${studentEntity.id} with User id: ${userId} successfully`,
        );
        // Return student with populated relations
        return (
            (await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: { id: savedStudent.id, userId: userId },
            })) ?? savedStudent
        );
    }

    public async getAllStudentEntitiesByUserId(
        userId: string,
        pageable: Pageable,
    ): Promise<Page<StudentEntity>> {
        const queryBuilder = this.studentRepository
            .createQueryBuilder("student")
            .leftJoinAndSelect("student.awards", "awards")
            .leftJoinAndSelect("student.certifications", "certifications")
            .where("student.userId = :userId", { userId });

        const totalElements = await queryBuilder.getCount();

        const page = pageable.page ?? defaultPaginationConfig.defaultPage;
        const size = pageable.getLimit();

        if (totalElements === 0) {
            return new Page<StudentEntity>([], page, size, 0);
        }

        const totalPages = Math.ceil(totalElements / size);

        if (page > totalPages) {
            return new Page<StudentEntity>([], page, size, totalElements);
        }

        const sortConfig = pageable.getParsedSort();
        if (sortConfig) {
            const fieldMapping: Record<string, string> = {
                createdAt: "student.createdAt",
                location: "student.location",
                major: "student.major",
                maxBudget: "student.maxBudget",
                minBudget: "student.minBudget",
                modifiedAt: "student.modifiedAt",
            };
            const sortField =
                fieldMapping[sortConfig.field] || `student.${sortConfig.field}`;
            queryBuilder.orderBy(sortField, sortConfig.direction);
        } else {
            queryBuilder.orderBy("student.createdAt", "DESC");
        }

        const entities = await queryBuilder
            .skip(pageable.getOffset())
            .take(size)
            .getMany();

        return new Page<StudentEntity>(entities, page, size, totalElements);
    }

    public async getStudentEntityByUserId(
        profileId: string,
        userId: string,
    ): Promise<StudentEntity> {
        const studentEntity: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["awards", "certifications"],
                where: {
                    id: profileId,
                    userId: userId,
                },
            });
        if (!studentEntity) {
            throw new EntityNotFoundException(
                `Student profile with user id: ${userId} not found`,
            );
        }
        return studentEntity;
    }

    async getStudentWithFiles(
        studentId: string,
        userId?: string,
    ): Promise<StudentEntity> {
        const queryBuilder = this.studentRepository
            .createQueryBuilder("student")
            .leftJoinAndSelect(
                "student.files",
                "files",
                "files.status = :status",
                { status: "active" },
            )
            .leftJoinAndSelect("student.awards", "awards")
            .leftJoinAndSelect("student.certifications", "certifications")
            .leftJoinAndSelect("student.user", "user")
            .where("student.id = :studentId", { studentId });

        if (userId) {
            queryBuilder.andWhere("student.userId = :userId", { userId });
        }

        const student = await queryBuilder.getOne();

        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${studentId} not found`,
            );
        }

        return student;
    }
}
