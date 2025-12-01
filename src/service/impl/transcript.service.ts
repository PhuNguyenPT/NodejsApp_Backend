import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import { SubjectScore } from "@/dto/ocr/ocr.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TranscriptSubjectEntity } from "@/entity/uni_guide/transcript-subject.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { TYPES } from "@/type/container/types.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

import { ITranscriptService } from "../transcript-service.interface.js";

@injectable()
export class TranscriptService implements ITranscriptService {
    private readonly NO_GRADE_SORT_VALUE = Number.MAX_SAFE_INTEGER;
    private readonly NO_SEMESTER_SORT_VALUE = Number.MAX_SAFE_INTEGER;

    constructor(
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.TranscriptRepository)
        private readonly transcriptRepository: Repository<TranscriptEntity>,
        @inject(TYPES.TranscriptSubjectRepository)
        private readonly transcriptSubjectRepository: Repository<TranscriptSubjectEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    public async findByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<TranscriptEntity[]> {
        const student = await this.studentRepository.findOne({
            relations: [
                "transcripts",
                "transcripts.transcriptSubjects",
                "transcripts.ocrResult",
                "transcripts.ocrResult.file",
            ],
            where: {
                id: studentId,
                userId: userId ?? IsNull(),
            },
        });

        if (!student?.transcripts || student.transcripts.length === 0) {
            return [];
        }

        student.transcripts.forEach((transcript) => {
            if (transcript.transcriptSubjects) {
                transcript.transcriptSubjects.sort((a, b) =>
                    a.subject.localeCompare(b.subject),
                );
            }
        });

        return this.sortTranscripts(student.transcripts);
    }

    public async patchByIdAndCreatedBy(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        createdBy?: string,
    ): Promise<{ id: string; subjectScores: SubjectScore[] }> {
        const transcript: null | TranscriptEntity =
            await this.transcriptRepository.findOne({
                relations: ["transcriptSubjects"],
                where: { createdBy: createdBy ?? Role.ANONYMOUS, id },
            });

        if (transcript === null) {
            throw new EntityNotFoundException(
                `Transcript with id ${id} not found`,
            );
        }

        const updater = createdBy ?? Role.ANONYMOUS;

        const subjectMap: Map<TranscriptSubject, TranscriptSubjectEntity> =
            new Map<TranscriptSubject, TranscriptSubjectEntity>(
                (transcript.transcriptSubjects ?? []).map((subject) => [
                    subject.subject,
                    subject,
                ]),
            );

        if (
            ocrUpdateRequest.subjectScores &&
            ocrUpdateRequest.subjectScores.length > 0
        ) {
            transcript.updatedBy = updater;

            for (const updateScore of ocrUpdateRequest.subjectScores) {
                const existingSubject = subjectMap.get(updateScore.name);

                if (existingSubject) {
                    existingSubject.score = updateScore.score;
                    existingSubject.updatedBy = updater;
                    await this.transcriptSubjectRepository.save(
                        existingSubject,
                    );
                } else {
                    const newSubject = this.transcriptSubjectRepository.create({
                        createdBy: createdBy,
                        score: updateScore.score,
                        subject: updateScore.name,
                        transcriptId: transcript.id,
                    });
                    await this.transcriptSubjectRepository.save(newSubject);
                    subjectMap.set(updateScore.name, newSubject);
                }
            }
        }

        // Convert to array and SORT alphabetically
        transcript.transcriptSubjects = Array.from(subjectMap.values()).sort(
            (a, b) => a.subject.localeCompare(b.subject),
        );

        await this.transcriptRepository.save(transcript);

        // Map current subjects to SubjectScore format (already sorted)
        const subjectScores: SubjectScore[] = transcript.transcriptSubjects.map(
            (subject) =>
                plainToInstance(SubjectScore, {
                    name: subject.subject,
                    score: subject.score,
                }),
        );

        return {
            id: transcript.id,
            subjectScores,
        };
    }

    private extractGradeFromTranscript(transcript: TranscriptEntity): number {
        const file = transcript.ocrResult?.file;
        if (!file) return this.NO_GRADE_SORT_VALUE;

        // Priority: tags > description > filename
        return (
            this.extractNumberFromPattern(file.tags, /grade-(\d+)/i) ??
            this.extractNumberFromPattern(file.description, /grade\s*(\d+)/i) ??
            this.extractNumberFromPattern(file.fileName, /hb(\d+)/i) ??
            this.NO_GRADE_SORT_VALUE
        );
    }

    private extractNumberFromPattern(
        text: null | string | undefined,
        pattern: RegExp,
    ): null | number {
        if (!text) return null;

        const match = text.match(pattern);
        return match ? parseInt(match[1], 10) : null;
    }

    private extractSemesterFromTranscript(
        transcript: TranscriptEntity,
    ): number {
        const file = transcript.ocrResult?.file;
        if (!file) return this.NO_SEMESTER_SORT_VALUE;

        return (
            this.extractNumberFromPattern(file.tags, /semester-(\d+)/i) ??
            this.extractNumberFromPattern(
                file.description,
                /semester\s*(\d+)/i,
            ) ??
            this.extractNumberFromPattern(file.fileName, /k(\d+)/i) ??
            this.NO_SEMESTER_SORT_VALUE
        );
    }

    private sortTranscripts(
        transcripts: TranscriptEntity[],
    ): TranscriptEntity[] {
        return transcripts.sort((a, b) => {
            const gradeA = this.extractGradeFromTranscript(a);
            const gradeB = this.extractGradeFromTranscript(b);

            if (gradeA !== gradeB) {
                return gradeA - gradeB;
            }

            const semesterA = this.extractSemesterFromTranscript(a);
            const semesterB = this.extractSemesterFromTranscript(b);

            if (semesterA !== semesterB) {
                return semesterA - semesterB;
            }

            return 0;
        });
    }
}
