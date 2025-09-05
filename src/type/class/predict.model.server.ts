import axios, { AxiosInstance } from "axios";
import { inject, injectable } from "inversify";

import { TYPES } from "@/type/container/types.js";

export interface PredictModelServerConfig {
    SERVICE_SERVER_HOSTNAME: string;
    SERVICE_SERVER_PATH: string;
    SERVICE_SERVER_PORT: number;
    SERVICE_TIMEOUT_IN_MS: number;
}

@injectable()
export class PredictModelServer {
    private readonly config: PredictModelServerConfig;
    private readonly httpClient: AxiosInstance;

    constructor(
        @inject(TYPES.PredictModelServerConfig)
        config: PredictModelServerConfig,
    ) {
        this.config = config;
        const baseUrl = `http://${this.config.SERVICE_SERVER_HOSTNAME}:${this.config.SERVICE_SERVER_PORT.toString()}${this.config.SERVICE_SERVER_PATH}`;
        this.httpClient = axios.create({
            baseURL: baseUrl,
            headers: { "Content-Type": "application/json" },
            timeout: this.config.SERVICE_TIMEOUT_IN_MS,
        });
    }

    getHttpClient(): AxiosInstance {
        return this.httpClient;
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.httpClient.get("/health", {
                timeout: 5000,
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }
}
