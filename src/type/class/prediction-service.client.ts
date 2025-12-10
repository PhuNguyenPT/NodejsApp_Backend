import axios, { type AxiosInstance } from "axios";
import { inject, injectable } from "inversify";

import { TYPES } from "@/type/container/types.js";

export interface ClientConfig {
    SERVICE_SERVER_HOSTNAME: string;
    SERVICE_SERVER_PATH: string;
    SERVICE_SERVER_PORT: number;
    SERVICE_TIMEOUT_IN_MS: number;
}

@injectable()
export class PredictionServiceClient {
    private readonly httpClient: AxiosInstance;

    constructor(@inject(TYPES.ClientConfig) config: ClientConfig) {
        const baseUrl = `http://${config.SERVICE_SERVER_HOSTNAME}:${config.SERVICE_SERVER_PORT.toString()}${config.SERVICE_SERVER_PATH}`;
        this.httpClient = axios.create({
            baseURL: baseUrl,
            headers: { "Content-Type": "application/json" },
            timeout: config.SERVICE_TIMEOUT_IN_MS,
        });
    }

    getHttpClient(): AxiosInstance {
        return this.httpClient;
    }

    /**
     * Checks the health of the server.
     * @returns {Promise<boolean>} A promise that resolves to true if the server is healthy.
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.httpClient.get("/health", {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            console.error("Health check failed:", error);
            return false;
        }
    }
}
