import { injectable } from "inversify";

import { logger } from "@/config/logger.config.js";

@injectable()
export class ConcurrencyUtil {
    public calculateDynamicBatchConcurrency(
        userInputCount: number,
        inputsPerWorker = 3, // Default to 3 inputs per worker
        maxConcurrency?: number,
        minConcurrency = 1,
    ): number {
        // Calculate needed workers based on inputs per worker
        const neededWorkers = Math.ceil(userInputCount / inputsPerWorker);

        // Apply constraints
        let concurrency = Math.max(neededWorkers, minConcurrency);

        if (maxConcurrency) {
            concurrency = Math.min(concurrency, maxConcurrency);
        }

        logger.debug("Calculated dynamic batch concurrency", {
            finalConcurrency: concurrency,
            inputsPerWorker,
            maxConcurrency: maxConcurrency ?? "none",
            minConcurrency,
            neededWorkers,
            userInputCount,
        });

        return concurrency;
    }

    public chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    public determineLimitingFactor(factors: {
        concurrencyAdjusted: number;
        finalOptimal: number;
        maxChunkSize: number;
        memoryBased: number;
        networkOptimal: number;
    }): string {
        const {
            concurrencyAdjusted,
            finalOptimal,
            maxChunkSize,
            memoryBased,
            networkOptimal,
        } = factors;

        // Find which factor produced the final result
        if (finalOptimal === concurrencyAdjusted) {
            return "concurrency_complexity";
        } else if (finalOptimal === networkOptimal) {
            return "network_latency";
        } else if (finalOptimal === memoryBased) {
            return "memory_constraint";
        } else if (finalOptimal === maxChunkSize) {
            return "max_chunk_size_limit";
        } else {
            return "total_inputs_constraint";
        }
    }

    public getOptimalChunkSize(
        totalInputs: number,
        maxChunkSize = 10,
        factors?: {
            memoryLimit?: number;
            networkLatency?: number;
            processingComplexity?: "high" | "low" | "medium";
            serverConcurrency?: number;
        },
    ): number {
        const {
            memoryLimit = 1000, // Default memory limit per chunk
            networkLatency = 100, // ms
            processingComplexity = "medium",
            serverConcurrency = 2,
        } = factors ?? {};

        // For small datasets, prioritize parallelism
        const smallDatasetThreshold = serverConcurrency * 2;
        if (totalInputs <= smallDatasetThreshold) {
            const optimalSize = 1;
            const numChunks = totalInputs;
            const efficiency = 100;

            logger.debug(
                "Small dataset detected - using maximum parallelism strategy",
                {
                    efficiency: `${efficiency.toString()}%`,
                    factors: {
                        concurrencyUtilization: `${Math.min((numChunks / serverConcurrency) * 100, 100).toFixed(1)}%`,
                        smallDatasetOptimization: true,
                    },
                    numChunks,
                    optimalSize,
                    reasoning:
                        "Maximizing parallelism for small dataset to minimize latency",
                    serverConcurrency,
                    strategy: "small_dataset_parallelism",
                    threshold: smallDatasetThreshold,
                    totalInputs,
                },
            );

            return optimalSize;
        }

        // Standard algorithm for larger datasets
        // Factor 1: Balance with server concurrency
        // Aim for chunks that can be processed efficiently in parallel
        const concurrencyBasedSize = Math.ceil(totalInputs / serverConcurrency);

        // Factor 2: Processing complexity adjustment
        const complexityMultiplier = {
            high: 0.7,
            low: 1.5,
            medium: 1.0,
        }[processingComplexity];

        // Factor 3: Network efficiency - avoid too many small requests
        const networkOptimalSize = Math.max(
            3,
            Math.min(maxChunkSize, networkLatency / 10),
        );

        // Factor 4: Memory constraints
        const memoryBasedSize = Math.floor(memoryLimit / 50); // Assuming ~50 memory units per input

        // Calculate optimal size considering all factors
        let optimalSize = Math.floor(
            Math.min(
                concurrencyBasedSize * complexityMultiplier,
                networkOptimalSize,
                memoryBasedSize,
                maxChunkSize,
            ),
        );

        // Ensure minimum viable chunk size
        optimalSize = Math.max(optimalSize, 1);

        // If total inputs is small, don't over-chunk
        if (totalInputs <= maxChunkSize) {
            optimalSize = Math.min(optimalSize, totalInputs);
        }

        // Calculate efficiency metrics
        const numChunks = Math.ceil(totalInputs / optimalSize);
        const remainder = totalInputs % optimalSize;
        const efficiency = 1 - remainder / totalInputs;

        // Determine which factor was the limiting constraint
        const limitingFactor = this.determineLimitingFactor({
            concurrencyAdjusted: Math.floor(
                concurrencyBasedSize * complexityMultiplier,
            ),
            finalOptimal: optimalSize,
            maxChunkSize,
            memoryBased: memoryBasedSize,
            networkOptimal: networkOptimalSize,
        });

        logger.debug("Calculated optimal chunk size with factors", {
            concurrencyUtilization: `${Math.min((numChunks / serverConcurrency) * 100, 100).toFixed(1)}%`,
            config: {
                maxChunkSize,
                memoryLimit,
                networkLatency,
                serverConcurrency,
            },
            efficiency: `${(efficiency * 100).toFixed(1)}%`,
            factors: {
                complexityAdjusted: Math.floor(
                    concurrencyBasedSize * complexityMultiplier,
                ),
                concurrencyBased: concurrencyBasedSize,
                limitingFactor: limitingFactor,
                memoryBased: memoryBasedSize,
                networkOptimal: networkOptimalSize,
            },
            numChunks,
            optimalSize,
            processingComplexity,
            strategy: "standard_algorithm",
            totalInputs,
        });

        return optimalSize;
    }
}
