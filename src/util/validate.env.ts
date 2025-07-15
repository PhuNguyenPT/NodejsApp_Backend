import { cleanEnv, port, str } from "envalid";

console.log("Validating environment variables...");

function validateEnv(): void {
  cleanEnv(process.env, {
    DB_LOGGING: str({
      choices: ["true", "false"],
      default: "false",
    }),
    DB_SYNCHRONIZE: str({
      choices: ["true", "false"],
      default: "false",
    }),
    NODE_ENV: str({
      choices: ["development", "production", "staging"],
    }),
    PORT: port({ default: 3000 }),
    POSTGRES_DB: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_PORT: port({ default: 5432 }),
    POSTGRES_USER: str(),
  });
}

export default validateEnv;
