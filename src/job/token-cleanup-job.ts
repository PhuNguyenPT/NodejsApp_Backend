import { inject, injectable } from "inversify";
import { Logger } from "winston";

import type { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";

import { TYPES } from "@/type/container/types.js";

@injectable()
export class TokenCleanupJob {
    private isCleanupRunning = false;

    constructor(
        @inject(TYPES.IJwtTokenRepository)
        private jwtTokenRepository: IJwtTokenRepository,
        @inject(TYPES.Logger)
        private logger: Logger,
        private cleanupTimeout: NodeJS.Timeout | null = null,
    ) {}

    async runCleanup(): Promise<void> {
        if (this.isCleanupRunning) {
            this.logger.info(
                "Token cleanup job is already running. Skipping this run.",
            );
            return;
        }

        this.isCleanupRunning = true;

        try {
            await this.jwtTokenRepository.cleanup();
        } catch (error) {
            this.logger.error("Token cleanup job failed:", { error });
        } finally {
            this.isCleanupRunning = false;
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
