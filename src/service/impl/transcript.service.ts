// Updated TranscriptService
import { plainToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { OcrRequest } from "@/dto/ocr/ocr-request.dto.js";
import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import { SubjectScore } from "@/dto/ocr/subject-score.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TranscriptSubjectEntity } from "@/entity/uni_guide/transcript-subject.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { ITranscriptEventListener } from "@/event/transcript-event-listener.interface.js";
import { TYPES } from "@/type/container/types.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";

import { ITranscriptService } from "../transcript-service.interface.js";

@injectable()
export class TranscriptService implements ITranscriptService {
    private readonly ALLOWED_TRANSCRIPT_COUNTS = [3, 6];
    private readonly MAX_SEMESTER_TRANSCRIPTS = 6;
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
        @inject(TYPES.ITranscriptEventListener)
        private readonly transcriptEventListener: ITranscriptEventListener,
    ) {}

    public async findByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<TranscriptEntity[]> {
        const student = await this.studentRepository.findOne({
            where: {
                id: studentId,
                userId: userId ?? IsNull(),
            },
        });

        if (!student) {
            throw new EntityNotFoundException(
                `Student not found for id ${studentId}`,
            );
        }

        const transcripts = await this.transcriptRepository.find({
            order: {
                grade: "ASC",
                semester: "ASC",
            },
            relations: ["transcriptSubjects", "ocrResult", "ocrResult.file"],
            where: {
                studentId: studentId,
            },
        });

        if (transcripts.length === 0) {
            throw new EntityNotFoundException(
                `Transcripts not found for student id ${studentId}`,
            );
        }

        transcripts.forEach((transcript) => {
            if (transcript.transcriptSubjects) {
                transcript.transcriptSubjects.sort((a, b) =>
                    a.subject.localeCompare(b.subject),
                );
            }
        });

        const hasNullGradeOrSemester = transcripts.some(
            (transcript) =>
                transcript.grade == null || transcript.semester == null,
        );

        if (hasNullGradeOrSemester) {
            return this.sortTranscripts(transcripts);
        }

        return transcripts;
    }

    public async patchByIdAndCreatedBy(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        createdBy?: string,
    ): Promise<{ id: string; subjectScores: SubjectScore[] }> {
        const transcript: null | TranscriptEntity =
            await this.transcriptRepository.findOne({
                relations: [
                    "transcriptSubjects",
                    "student",
                    "student.transcripts",
                ],
                where: {
                    createdBy: createdBy ?? Role.ANONYMOUS,
                    id,
                },
            });

        if (transcript === null) {
            throw new EntityNotFoundException(
                `Transcript with id ${id} not found`,
            );
        }

        const updater = createdBy ?? Role.ANONYMOUS;

        const subjectMap = new Map<TranscriptSubject, TranscriptSubjectEntity>(
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

        transcript.transcriptSubjects = Array.from(subjectMap.values()).sort(
            (a, b) => a.subject.localeCompare(b.subject),
        );

        await this.transcriptRepository.save(transcript);

        const subjectScores: SubjectScore[] = transcript.transcriptSubjects.map(
            (subject) =>
                plainToInstance(SubjectScore, {
                    name: subject.subject,
                    score: subject.score,
                }),
        );

        const updatedStudent = await this.studentRepository.findOne({
            relations: ["transcripts"],
            where: { id: transcript.student.id },
        });

        if (updatedStudent) {
            this._publishTranscriptUpdatedEvent(updatedStudent);
        }

        return {
            id: transcript.id,
            subjectScores,
        };
    }

    public async saveByStudentIdAndUserId(
        studentId: string,
        ocrRequest: OcrRequest,
        userId?: string,
    ): Promise<TranscriptEntity> {
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: [
                    "transcripts",
                    "transcripts.transcriptSubjects",
                    "transcripts.ocrResult",
                    "transcripts.ocrResult.file",
                    "files",
                    "user",
                ],
                where: {
                    id: studentId,
                    userId: userId ?? IsNull(),
                },
            });

        if (student === null) {
            throw new EntityNotFoundException(
                `No Student Profile found for id ${studentId}`,
            );
        }

        const filesCount: number = student.files?.length ?? 0;
        const ocrResultsCount: number =
            student.transcripts?.filter((t) => t.ocrResult != null).length ?? 0;
        const transcriptsCount: number = student.transcripts?.length ?? 0;

        this.logger.debug(
            `Validating transcript creation for student ${studentId}`,
            {
                filesCount,
                ocrResultsCount,
                transcriptsCount,
            },
        );

        this.validateTranscriptCreation(
            filesCount,
            ocrResultsCount,
            transcriptsCount,
        );

        let createdBy: string = Role.ANONYMOUS;
        if (student.user) createdBy = student.user.email;

        const transcriptEntity: TranscriptEntity =
            this.transcriptRepository.create(ocrRequest);
        transcriptEntity.createdBy = createdBy;
        transcriptEntity.student = student;

        const transcriptSubjects: TranscriptSubjectEntity[] = [];
        for (const subjectScore of ocrRequest.subjectScores) {
            const transcriptSubjectEntity: TranscriptSubjectEntity =
                this.transcriptSubjectRepository.create({
                    createdBy,
                    score: subjectScore.score,
                    subject: subjectScore.name,
                });
            transcriptSubjects.push(transcriptSubjectEntity);
        }

        transcriptEntity.transcriptSubjects = transcriptSubjects;
        const savedTranscript =
            await this.transcriptRepository.save(transcriptEntity);

        this.logger.info(
            `Successfully created transcript for student ${studentId}`,
            {
                filesCount,
                ocrResultsCount,
                subjectsCount: transcriptSubjects.length,
                transcriptId: savedTranscript.id,
                transcriptsCount,
            },
        );

        // Reload student with updated transcripts count
        const updatedStudent = await this.studentRepository.findOne({
            relations: ["transcripts"],
            where: {
                id: studentId,
                userId: userId ?? IsNull(),
            },
        });

        this._publishTranscriptCreatedEvent(updatedStudent, userId);

        return savedTranscript;
    }

    private _publishTranscriptCreatedEvent(
        student: null | StudentEntity,
        userId?: string,
    ): void {
        if (!student) {
            this.logger.warn(
                "Cannot publish TranscriptCreatedEvent: student not found",
            );
            return;
        }

        const transcriptCount = student.transcripts?.length ?? 0;

        if (!this.ALLOWED_TRANSCRIPT_COUNTS.includes(transcriptCount)) {
            this.logger.debug(
                `Skipping TranscriptCreatedEvent: transcript count is ${transcriptCount.toString()}, expected 3 or 6`,
                {
                    allowedCounts: this.ALLOWED_TRANSCRIPT_COUNTS,
                    studentId: student.id,
                    transcriptCount,
                },
            );
            return;
        }

        // Validate transcript data consistency
        const validationResult = this._validateTranscriptConsistency(
            student.transcripts ?? [],
        );

        if (!validationResult.isValid) {
            // Use the explicit isDebug flag: true = debug, false = warn
            const logLevel = validationResult.isDebug ? "debug" : "warn";
            this.logger[logLevel](
                "Skipping TranscriptCreatedEvent: transcripts have inconsistent data",
                {
                    hasAllGrades: validationResult.hasAllGrades,
                    hasConsistentSemesters:
                        validationResult.hasConsistentSemesters,
                    isDebug: validationResult.isDebug,
                    missingGrades: validationResult.missingGrades,
                    reason: validationResult.reason,
                    studentId: student.id,
                    transcriptCount,
                },
            );
            return;
        }

        const transcriptIds = student.transcripts?.map((t) => t.id) ?? [];

        // Fire-and-forget: don't await, let it run in background
        this.transcriptEventListener
            .handleTranscriptCreatedEvent({
                studentId: student.id,
                transcriptIds,
                userId,
            })
            .catch((error: unknown) => {
                this.logger.error(
                    "Failed to handle TranscriptCreatedEvent in background",
                    {
                        error,
                        studentId: student.id,
                        transcriptIds,
                        userId,
                    },
                );
            });

        this.logger.info(
            `Triggered TranscriptCreatedEvent for studentId ${student.id}` +
                (userId ? ` and userId ${userId}` : ""),
            {
                transcriptCount,
                transcriptIds,
            },
        );
    }

    private _publishTranscriptUpdatedEvent(student: StudentEntity): void {
        const transcriptCount = student.transcripts?.length ?? 0;

        if (!this.ALLOWED_TRANSCRIPT_COUNTS.includes(transcriptCount)) {
            this.logger.debug(
                `Skipping TranscriptUpdatedEvent: transcript count is ${transcriptCount.toString()}, expected 3 or 6`,
                {
                    allowedCounts: this.ALLOWED_TRANSCRIPT_COUNTS,
                    studentId: student.id,
                    transcriptCount,
                },
            );
            return;
        }

        // Validate transcript data consistency
        const validationResult = this._validateTranscriptConsistency(
            student.transcripts ?? [],
        );

        if (!validationResult.isValid) {
            // Use the explicit isDebug flag: true = debug, false = warn
            const logLevel = validationResult.isDebug ? "debug" : "warn";
            this.logger[logLevel](
                "Skipping TranscriptUpdatedEvent: transcripts have inconsistent data",
                {
                    hasAllGrades: validationResult.hasAllGrades,
                    hasConsistentSemesters:
                        validationResult.hasConsistentSemesters,
                    isDebug: validationResult.isDebug,
                    missingGrades: validationResult.missingGrades,
                    reason: validationResult.reason,
                    studentId: student.id,
                    transcriptCount,
                },
            );
            return;
        }

        // NEW: Validate that at least one transcript has been updated (has updatedBy)
        const hasUpdatedTranscripts = (student.transcripts ?? []).some(
            (t) => t.updatedBy != null,
        );

        if (!hasUpdatedTranscripts) {
            this.logger.debug(
                "Skipping TranscriptUpdatedEvent: no transcripts have been updated (all updatedBy are null)",
                {
                    studentId: student.id,
                    transcriptCount,
                },
            );
            return;
        }

        const transcriptIds = student.transcripts?.map((t) => t.id) ?? [];
        const userId = student.userId;

        // Fire-and-forget: don't await, let it run in background
        this.transcriptEventListener
            .handleTranscriptUpdatedEvent({
                studentId: student.id,
                transcriptIds,
                userId,
            })
            .catch((error: unknown) => {
                this.logger.error(
                    "Failed to handle TranscriptUpdatedEvent in background",
                    {
                        error,
                        studentId: student.id,
                        transcriptIds,
                        userId,
                    },
                );
            });

        this.logger.info(
            `Triggered TranscriptUpdatedEvent for studentId ${student.id}` +
                (userId ? ` and userId ${userId}` : ""),
            {
                transcriptCount,
                transcriptIds,
            },
        );
    }

    /**
     * Validate transcript data consistency before publishing events
     * @param transcripts Array of TranscriptEntity to validate
     * @returns Validation result with detailed information
     */
    private _validateTranscriptConsistency(transcripts: TranscriptEntity[]): {
        hasAllGrades: boolean;
        hasConsistentSemesters: boolean;
        isDebug: boolean;
        isValid: boolean;
        missingGrades: number[];
        reason?: string;
    } {
        // Group transcripts by grade
        const transcriptsByGrade = new Map<number, TranscriptEntity[]>();
        transcripts.forEach((transcript) => {
            if (transcript.grade == null) {
                return;
            }
            const gradeTranscripts =
                transcriptsByGrade.get(transcript.grade) ?? [];
            gradeTranscripts.push(transcript);
            transcriptsByGrade.set(transcript.grade, gradeTranscripts);
        });

        // Check if all required grades (10, 11, 12) are present
        const hasAllGrades =
            transcriptsByGrade.has(10) &&
            transcriptsByGrade.has(11) &&
            transcriptsByGrade.has(12);

        const missingGrades = [10, 11, 12].filter(
            (grade) => !transcriptsByGrade.has(grade),
        );

        if (!hasAllGrades) {
            return {
                hasAllGrades: false,
                hasConsistentSemesters: true, // Not a mixing issue, just missing grades
                isDebug: true, // Use debug logging
                isValid: false,
                missingGrades,
                reason: `Missing required grades: ${missingGrades.join(", ")}`,
            };
        }

        // Check consistency - either all semester-based or all full-year
        const allHaveSemesters = Array.from(transcriptsByGrade.values()).every(
            (gradeTranscripts) =>
                gradeTranscripts.every((t) => t.semester != null),
        );

        const allHaveNoSemesters = Array.from(
            transcriptsByGrade.values(),
        ).every((gradeTranscripts) =>
            gradeTranscripts.every((t) => t.semester == null),
        );

        const hasConsistentSemesters = allHaveSemesters || allHaveNoSemesters;

        if (!hasConsistentSemesters) {
            const gradeDetails = Array.from(transcriptsByGrade.entries()).map(
                ([grade, transcripts]) => ({
                    grade,
                    hasSemester: transcripts.some((t) => t.semester != null),
                    transcriptCount: transcripts.length,
                }),
            );

            return {
                hasAllGrades: true,
                hasConsistentSemesters: false,
                isDebug: false,
                isValid: false,
                missingGrades: [],
                reason: `Inconsistent semester data: mixing semester-based and full-year transcripts. Details: ${JSON.stringify(gradeDetails)}`,
            };
        }

        // Additional validation for semester-based transcripts
        if (allHaveSemesters) {
            // Each grade should have exactly 2 transcripts (semester 1 and 2)
            for (const [
                grade,
                gradeTranscripts,
            ] of transcriptsByGrade.entries()) {
                if (gradeTranscripts.length !== 2) {
                    return {
                        hasAllGrades: true,
                        hasConsistentSemesters: true,
                        isDebug: true, // Use debug logging
                        isValid: false,
                        missingGrades: [],
                        reason: `Grade ${grade.toString()} has ${gradeTranscripts.length.toString()} transcripts, expected 2 for semester-based data`,
                    };
                }

                // Check that we have both semester 1 and 2
                const semesters = gradeTranscripts
                    .map((t) => t.semester)
                    .sort();
                if (semesters[0] !== 1 || semesters[1] !== 2) {
                    return {
                        hasAllGrades: true,
                        hasConsistentSemesters: true,
                        isDebug: false,
                        isValid: false,
                        missingGrades: [],
                        reason: `Grade ${grade.toString()} has semesters [${semesters.join(", ")}], expected [1, 2]`,
                    };
                }
            }
        }

        // Additional validation for full-year transcripts
        if (allHaveNoSemesters) {
            // Each grade should have exactly 1 transcript
            for (const [
                grade,
                gradeTranscripts,
            ] of transcriptsByGrade.entries()) {
                if (gradeTranscripts.length !== 1) {
                    return {
                        hasAllGrades: true,
                        hasConsistentSemesters: true,
                        isDebug: false,
                        isValid: false,
                        missingGrades: [],
                        reason: `Grade ${grade.toString()} has ${gradeTranscripts.length.toString()} transcripts, expected 1 for full-year data`,
                    };
                }
            }
        }

        return {
            hasAllGrades: true,
            hasConsistentSemesters: true,
            isDebug: true, // Valid data, no logging of validation result
            isValid: true,
            missingGrades: [],
        };
    }

    private extractGradeFromTranscript(transcript: TranscriptEntity): number {
        const file = transcript.ocrResult?.file;
        if (!file) return this.NO_GRADE_SORT_VALUE;

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

    private validateTranscriptCreation(
        filesCount: number,
        ocrResultsCount: number,
        transcriptsCount: number,
    ): void {
        // Hard limit: Maximum 6 transcripts total
        if (transcriptsCount >= this.MAX_SEMESTER_TRANSCRIPTS) {
            throw new IllegalArgumentException(
                `Cannot create more transcripts. Maximum of ${this.MAX_SEMESTER_TRANSCRIPTS.toString()} transcripts reached.`,
            );
        }

        // Case 1: Files and OCR results exist (OCR-based transcripts)
        if (filesCount > 0 && ocrResultsCount > 0) {
            // Files and OCR results must match
            if (filesCount !== ocrResultsCount) {
                throw new IllegalArgumentException(
                    `Files count (${filesCount.toString()}) must match OCR results count (${ocrResultsCount.toString()}).`,
                );
            }

            // Dynamic 2n pattern: max transcripts = filesCount
            // For even numbers (2, 4, 6): semester-based
            // For odd numbers (3, 5): grade-based
            const maxAllowed = filesCount;
            if (transcriptsCount >= maxAllowed) {
                throw new IllegalArgumentException(
                    `Cannot create more transcripts. Maximum of ${maxAllowed.toString()} transcripts allowed for ${filesCount.toString()} files.`,
                );
            }

            return;
        }

        // Case 2: Manual entry (no files/OCR results)
        if (filesCount === 0 && ocrResultsCount === 0) {
            // Allow creation up to MAX_SEMESTER_TRANSCRIPTS
            return;
        }

        // If none of the valid cases match, throw error
        throw new IllegalArgumentException(
            `Invalid transcript creation: Files=${filesCount.toString()}, OCR Results=${ocrResultsCount.toString()}, Transcripts=${transcriptsCount.toString()}. ` +
                `Valid scenarios: ` +
                `(1) OCR-based: Files must equal OCR results, max transcripts = file count (2n pattern supports 2, 4, 6 files for semester-based or 3, 5 files for grade-based). ` +
                `(2) Manual entry: 0 files and 0 OCR results, max ${this.MAX_SEMESTER_TRANSCRIPTS.toString()} transcripts total.`,
        );
    }
}
