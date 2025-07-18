// src/app/index.ts
import App from "@/app/app.js";
import swaggerDocs from "@/config/swagger.js";
import logger from "@/util/logger.js";
import validateEnv, { config } from "@/util/validate.env.js";

// Validate environment variables first
validateEnv();

// Log startup information
logger.info("Starting application", {
  dbHost: config.POSTGRES_HOST,
  dbName: config.POSTGRES_DB,
  dbPort: config.POSTGRES_PORT,
  nodeEnv: config.NODE_ENV,
  port: config.PORT,
});

// Create and start the app (no need to pass controllers anymore)
const app = new App(config.PORT);

app.listen();

if (process.env.NODE_ENV !== "production") {
  swaggerDocs(app.express, config.PORT);
}
