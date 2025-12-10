import type { ErrorResponse } from "@/type/interface/error-response.interface.js";

export interface ValidationResponse extends ErrorResponse {
    validationErrors?: Record<string, string>;
}
