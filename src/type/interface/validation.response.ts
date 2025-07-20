import { ErrorResponse } from "@/type/interface/error.response.js";

export interface ValidationResponse extends ErrorResponse {
    validationErrors?: Record<string, string>;
}
