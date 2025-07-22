import { inject, injectable } from "inversify";

import { TYPES } from "@/type/container/types";
import { ILogger } from "@/type/interface/logger";

@injectable()
export class AuthService {
    constructor(
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
    ) {}
}
