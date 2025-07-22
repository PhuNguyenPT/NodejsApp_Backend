import fs from "node:fs";
import path from "node:path";

import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

export interface IKeyStore {
    privateKey: string;
    publicKey: string;
}

export const keyStore: IKeyStore = createKeyStore(
    path.resolve(config.PRIVATE_KEY_PATH),
    path.resolve(config.PUBLIC_KEY_PATH),
);

function createKeyStore(
    privateKeyPath: string,
    publicKeyPath: string,
): IKeyStore {
    try {
        // Read key files synchronously at startup
        const privateKey: string = fs.readFileSync(privateKeyPath, "utf8");
        const publicKey: string = fs.readFileSync(publicKeyPath, "utf8");

        return { privateKey, publicKey };
    } catch (error) {
        logger.error("Error loading RSA keys:", error);
        logger.error(
            "Ensure PRIVATE_KEY_PATH and PUBLIC_KEY_PATH in your .env file are correct and point to valid files.",
        );
        process.exit(1); // Exit immediately if keys are essential and cannot be loaded
    }
}
