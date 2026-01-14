// test/globals.d.ts
import type { Container } from "inversify";

import type AbstractApp from "@/app/app.abstract.js";

declare global {
    var __TEST_APP__: AbstractApp | undefined;
    var __IOC_CONTAINER__: Container | undefined;
    var __IOC_INITIALIZED__: boolean | undefined;
    var __TEST_INIT_PROMISE__: Promise<void> | undefined;
    var __TEST_SETUP_LOCK__: boolean | undefined;
}

export {};
