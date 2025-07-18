// src/app/index.ts
import App from "@/app/app.js";
import swaggerDocs from "@/config/swagger.js";
import logger from "@/util/logger.js";
import validateEnv, { config } from "@/util/validate.env.js";

// Validate environment variables first
validateEnv();

// Log startup information
logger.info("Starting application", {
  basePath: config.SERVER_PATH,
  dbHost: config.POSTGRES_HOST,
  dbName: config.POSTGRES_DB,
  dbPort: config.POSTGRES_PORT,
  hostname: config.SERVER_HOSTNAME,
  nodeEnv: config.NODE_ENV,
  port: config.SERVER_PORT,
});

// Create and start the app with environment variables
const app = new App(
  config.SERVER_PORT,
  config.SERVER_HOSTNAME,
  config.SERVER_PATH,
);

app.listen();

// Setup Swagger documentation in non-production environments
if (process.env.NODE_ENV !== "production") {
  swaggerDocs(app.express, app.getServerUrl());
}

// Log the complete server URL
logger.info(`Server will be available at: ${app.getServerUrl()}`);
