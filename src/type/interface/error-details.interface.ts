import { ErrorResponse } from "@/type/interface/error-response.interface.js";
import { ValidationResponse } from "@/type/interface/validation-response.interface.js";

export interface ErrorDetails {
    message: string;
    response: ErrorResponse | ValidationResponse;
    status: number;
}
