// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

/**
 * PARALLEL EXECUTION WITH SETUP FILES
 *
 * Architecture:
 * 1. First worker runs migrations (others wait)
 * 2. Each worker initializes its own app instance
 * 3. Tests run in parallel across workers
 */
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ["tsconfig.test.json"],
    }),
  ],
  setupFiles: ["test/setup.ts"],
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  test: {
    globals: true,
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),

    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
        isolate: true,
      },
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
        isolate: true,
      },
    },
    fileParallelism: true,
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
        lines: 30,
        functions: 30,
        branches: 50,
        statements: 30,
      },
      all: true,
    },

    include: ["test/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "**/*.d.ts"],

    testTimeout: 30000,
    hookTimeout: 60000,

    reporters: ["default", "html"],
    outputFile: {
      html: "coverage/test-results.html",
    },
  },
});
