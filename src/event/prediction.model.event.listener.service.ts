import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";
import z from "zod";

import {
    EventListenerService,
    RedisEventListener,
} from "@/decorator/redis.event.listener.decorator.js";
import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";
import { EnrollmentEntity } from "@/entity/enrollment.entity.js";
import {
    PredictionResultEntity,
    PredictionResultStatus,
} from "@/entity/prediction.result.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import { PredictionModelService } from "@/service/prediction.model.service.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { ILogger } from "@/type/interface/logger.js";
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/util/jwt.options.js";

export const PREDICTION_CHANNEL = "prediction:student_created";

const StudentCreatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type StudentCreatedEvent = z.infer<typeof StudentCreatedEventSchema>;
@EventListenerService(TYPES.PredictionModelEventListenerService)
@injectable()
export class PredictionModelEventListenerService {
    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.PredictionModelService)
        private readonly predictionModelService: PredictionModelService,
        @inject(TYPES.PredictionResultRepository)
        private readonly predictionResultRepository: Repository<PredictionResultEntity>,
        @inject(TYPES.EnrollmentRepository)
        private readonly enrollmentRepository: Repository<EnrollmentEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
    ) {}

    @RedisEventListener(PREDICTION_CHANNEL)
    private async handleStudentCreatedEvent(message: string): Promise<void> {
        try {
            const rawPayload: unknown = JSON.parse(message);
            const parsed = StudentCreatedEventSchema.safeParse(rawPayload);
            if (!parsed.success) {
                this.logger.error("Schema validation failed", {
                    errors: parsed.error.format(),
                    message,
                });
                return;
            }

            const payload = parsed.data;
            const { studentId, userId } = payload;

            let userEntity: null | UserEntity = null;

            if (userId) {
                userEntity = await this.userRepository.findOne({
                    cache: {
                        id: `user_cache_${userId}`,
                        milliseconds:
                            JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                    },
                    where: { id: userId },
                });
            }

            // Step 1: Create initial PredictionResultEntity with PROCESSING status
            const predictionResultEntity: PredictionResultEntity =
                this.predictionResultRepository.create({
                    createdBy: userEntity?.email ?? Role.ANONYMOUS,
                    l1PredictResults: [],
                    l2PredictResults: [],
                    status: PredictionResultStatus.PROCESSING,
                    studentId,
                    userId: userId,
                });

            const savedPredictionResult =
                await this.predictionResultRepository.save(
                    predictionResultEntity,
                );

            this.logger.info(
                "Created prediction result with PROCESSING status",
                {
                    predictionResultId: savedPredictionResult.id,
                    studentId,
                    userId,
                },
            );

            try {
                // Step 2: Get prediction results concurrently with individual error handling
                const [l2Result, l1Result] = await Promise.allSettled([
                    this.predictionModelService.getL2PredictResults(
                        studentId,
                        userId,
                    ),
                    this.predictionModelService.getL1PredictResults(
                        studentId,
                        userId,
                    ),
                ]);

                const l2PredictionResults: L2PredictResult[] =
                    l2Result.status === "fulfilled" ? l2Result.value : [];
                const l1PredictionResults: L1PredictResult[] =
                    l1Result.status === "fulfilled" ? l1Result.value : [];

                // Log any individual failures
                if (l2Result.status === "rejected") {
                    this.logger.error("L2 prediction failed", {
                        error: l2Result.reason,
                        studentId,
                    });
                }
                if (l1Result.status === "rejected") {
                    this.logger.error("L1 prediction failed", {
                        error: l1Result.reason,
                        studentId,
                    });
                }

                // Step 3: Process enrollments from L2 predictions
                await this.processEnrollmentsFromPredictions(
                    studentId,
                    l2PredictionResults,
                );

                // Step 4: Update with results (even if some are empty due to failures)
                savedPredictionResult.l1PredictResults = l1PredictionResults;
                savedPredictionResult.l2PredictResults = l2PredictionResults;

                // Decide status based on results
                const hasL1Results = l1PredictionResults.length > 0;
                const hasL2Results = l2PredictionResults.length > 0;

                if (hasL1Results && hasL2Results) {
                    savedPredictionResult.status =
                        PredictionResultStatus.COMPLETED;
                } else if (hasL1Results || hasL2Results) {
                    savedPredictionResult.status =
                        PredictionResultStatus.PARTIAL;
                } else {
                    savedPredictionResult.status =
                        PredictionResultStatus.FAILED;
                }

                await this.predictionResultRepository.save(
                    savedPredictionResult,
                );

                this.logger.info("Updated prediction result", {
                    l1ResultsCount: l1PredictionResults.length,
                    l2ResultsCount: l2PredictionResults.length,
                    predictionResultId: savedPredictionResult.id,
                    status: savedPredictionResult.status,
                    studentId,
                });
            } catch (error) {
                // This should rarely happen with allSettled
                savedPredictionResult.status = PredictionResultStatus.FAILED;
                await this.predictionResultRepository.save(
                    savedPredictionResult,
                );

                this.logger.error("Unexpected error in prediction handling", {
                    error,
                    predictionResultId: savedPredictionResult.id,
                    studentId,
                });
            }
        } catch (error) {
            this.logger.error("Error handling 'student created' message.", {
                error,
                message,
            });
        }
    }

    /**
     * Process enrollments from L2 prediction results and associate them with the student
     */
    private async processEnrollmentsFromPredictions(
        studentId: string,
        l2PredictionResults: L2PredictResult[],
    ): Promise<void> {
        try {
            if (l2PredictionResults.length === 0) {
                this.logger.info(
                    "No L2 prediction results to process enrollments",
                    {
                        studentId,
                    },
                );
                return;
            }

            const enrollmentCodes: string[] = l2PredictionResults.map(
                (result) => result.ma_xet_tuyen,
            );

            this.logger.info("Processing enrollments from predictions", {
                enrollmentCodes: enrollmentCodes.slice(0, 5),
                enrollmentCodesCount: enrollmentCodes.length,
                studentId,
            });

            const enrollments: EnrollmentEntity[] =
                await this.enrollmentRepository.find({
                    where: {
                        enrollCode: In(enrollmentCodes),
                    },
                });

            this.logger.info("Found matching enrollments", {
                foundEnrollmentsCount: enrollments.length,
                requestedCodesCount: enrollmentCodes.length,
                studentId,
            });

            if (enrollments.length === 0) {
                this.logger.warn(
                    "No matching enrollments found for prediction codes",
                    {
                        enrollmentCodes,
                        studentId,
                    },
                );
                return;
            }

            const student: null | StudentEntity =
                await this.studentRepository.findOne({
                    relations: ["enrollments"],
                    where: { id: studentId },
                });

            if (!student) {
                this.logger.error(
                    "Student not found when processing enrollments",
                    {
                        studentId,
                    },
                );
                return;
            }

            let newEnrollmentsCount = 0;
            enrollments.forEach((enrollment) => {
                if (!student.hasEnrollment(enrollment.id)) {
                    student.addEnrollment(enrollment);
                    newEnrollmentsCount++;
                }
            });

            if (newEnrollmentsCount > 0) {
                await this.studentRepository.save(student);

                this.logger.info(
                    "Successfully associated enrollments with student",
                    {
                        newEnrollmentsAdded: newEnrollmentsCount,
                        studentId,
                        totalEnrollments: student.getEnrollmentCount(),
                    },
                );
            } else {
                this.logger.info(
                    "No new enrollments to add (all already associated)",
                    {
                        studentId,
                        totalEnrollments: student.getEnrollmentCount(),
                    },
                );
            }

            if (enrollments.length > 0) {
                const enrollmentDetails = enrollments.map((e) => ({
                    enrollCode: e.enrollCode,
                    id: e.id,
                    majorName: e.majorName,
                    uniName: e.uniName,
                }));

                this.logger.debug("Processed enrollment details", {
                    enrollments: enrollmentDetails,
                    studentId,
                });
            }
        } catch (error) {
            this.logger.error("Error processing enrollments from predictions", {
                error,
                l2ResultsCount: l2PredictionResults.length,
                studentId,
            });
        }
    }
}
