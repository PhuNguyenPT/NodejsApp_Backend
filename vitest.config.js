// vitest.config.js
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

/**
 * PARALLEL EXECUTION WITH GLOBAL SETUP
 *
 * Architecture:
 * 1. globalSetup runs ONCE in main process - initializes DB and runs migrations
 * 2. Multiple worker threads start
 * 3. Each worker runs setup.ts ONCE per worker
 * 4. Tests run in parallel across workers
 */
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.test.json"],
    }),
  ],
  globalSetup: ["./test/global-setup.ts"],
  setupFiles: ["./test/setup.ts"],
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  test: {
    globals: true,
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),

    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2,
        minThreads: 1,
        isolate: true,
      },
    },
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "**/generated/**",
        "**/*.{spec,test}.ts",
        "src/migration/**",
        "src/type/**",
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 15,
        functions: 15,
        branches: 40,
        statements: 15,
      },
      all: true,
    },

    include: ["test/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "**/*.d.ts"],

    testTimeout: 30000,
    hookTimeout: 60000,

    reporters: ["default", "html"],
    outputFile: {
      html: "./coverage/test-results.html",
    },
  },
});
