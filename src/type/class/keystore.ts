import { injectable } from "inversify";

import { keyStore } from "@/config/key.config.js";

@injectable()
export class KeyStore {
    private static readonly privateKey: string = keyStore.privateKey;
    private static readonly publicKey: string = keyStore.publicKey;

    public getPrivateKey(): string {
        return KeyStore.privateKey;
    }

    public getPublicKey(): string {
        return KeyStore.publicKey;
    }
}
