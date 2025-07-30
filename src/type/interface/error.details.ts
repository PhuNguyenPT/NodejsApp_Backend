import { ErrorResponse } from "@/type/interface/error.response.js";
import { ValidationResponse } from "@/type/interface/validation.response.js";

export interface ErrorDetails {
    message: string;
    response: ErrorResponse | ValidationResponse;
    status: number;
}
