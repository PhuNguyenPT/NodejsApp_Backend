// src/util/validate.env.ts
import { cleanEnv, port, str } from "envalid";

// Validate and export the config object
export const config = cleanEnv(process.env, {
  // Database connection settings
  DB_LOGGING: str({
    choices: ["true", "false"],
    default: "false",
  }),
  DB_SYNCHRONIZE: str({
    choices: ["true", "false"],
    default: "false",
  }),

  // Logging settings
  ENABLE_FILE_LOGGING: str({
    choices: ["true", "false"],
    default: "false",
  }),
  LOG_DIR: str({ default: "logs" }),
  // Logging config (optional - add if you want configurable logging)
  LOG_LEVEL: str({
    choices: ["error", "warn", "info", "http", "debug"],
    default: "info",
  }),

  // Environment config
  NODE_ENV: str({
    choices: ["development", "production", "staging"],
  }),
  PORT: port({ default: 3000 }),

  // Database config
  POSTGRES_DB: str(),
  POSTGRES_HOST: str(),

  POSTGRES_PASSWORD: str(),
  POSTGRES_PORT: port({ default: 5432 }),
  POSTGRES_USER: str(),
});

// Legacy function for backward compatibility
function validateEnv(): void {
  // This now just triggers the validation above
  console.log("Environment validation completed");
}

export default validateEnv;
