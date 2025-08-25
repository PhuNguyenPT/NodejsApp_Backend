import { CorsOptions } from "cors";

import { config } from "@/util/validate.env.js";

export const corsOptions: CorsOptions = {
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "Pragma",
    ],
    credentials: config.CORS_CREDENTIALS,
    exposedHeaders: ["Authorization", "X-Total-Count", "X-Request-ID"],
    maxAge: 86400,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: config.CORS_ORIGIN,
} as const;
