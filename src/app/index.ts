import App from "@/app/app.js";
import PostController from "@/controller/post.controller.js";
import logger from "@/util/logger.js";
// src/app/index.ts
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

// Create and start the app
const app = new App([new PostController()], config.PORT);

app.listen();
