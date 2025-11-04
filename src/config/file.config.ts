import { memoryStorage, Options } from "multer";

import { config } from "@/util/validate-env.js";

export const MAX_FILE_SIZE = config.FILE_SIZE; // 10MB in byte
export const MAX_FILES = 6;

export const mutterOptions: Options = {
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    storage: memoryStorage(),
};
