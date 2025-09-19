import { inject, injectable } from "inversify";

import { JwtEntityService } from "@/service/impl/jwt-entity.service.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.interface.js";

// src/job/token.cleanup.job.ts

@injectable()
export class TokenCleanupJob {
    private isCleanupRunning = false; // 1. Add a state flag

    constructor(
        @inject(TYPES.JwtEntityService)
        private jwtEntityService: JwtEntityService,
        @inject(TYPES.Logger)
        private logger: ILogger,
        private cleanupTimeout: NodeJS.Timeout | null = null,
    ) {}

    /**
     * Run token cleanup job
     * Checks if a cleanup is already in progress.
     */
    async runCleanup(): Promise<void> {
        // 2. Check the flag before running
        if (this.isCleanupRunning) {
            this.logger.info(
                "Token cleanup job is already running. Skipping this run.",
            );
            return;
        }

        this.isCleanupRunning = true; // Set the lock

        try {
            this.logger.info("Starting token cleanup job");
            const deletedCount =
                await this.jwtEntityService.cleanupExpiredTokens();
            this.logger.info(
                `Token cleanup completed. Deleted ${deletedCount.toString()} expired tokens`,
            );
        } catch (error) {
            this.logger.error("Token cleanup job failed:", { error });
        } finally {
            this.isCleanupRunning = false; // 3. Release the lock in a 'finally' block
        }
    }

    startPeriodicCleanup(intervalMinutes: 60): void {
        const intervalMs = intervalMinutes * 60 * 1000;

        const run = async () => {
            try {
                await this.runCleanup();
            } catch (error: unknown) {
                this.logger.error(
                    "Unhandled error in periodic token cleanup execution:",
                    { error },
                );
            } finally {
                // Store the timeout reference so we can cancel it
                this.cleanupTimeout = setTimeout(() => {
                    void run();
                }, intervalMs);
            }
        };

        void run();
        this.logger.info(
            `Started periodic token cleanup every ${intervalMinutes.toString()} minutes`,
        );
    }

    stop(): void {
        if (this.cleanupTimeout) {
            clearTimeout(this.cleanupTimeout);
            this.cleanupTimeout = null;
        }
    }
}
