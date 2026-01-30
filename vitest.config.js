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
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  test: {
    setupFiles: ["test/setup.ts"],
    globals: true,
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 6,
        minForks: 1,
        isolate: true,
      },
      threads: {
        singleThread: false,
        maxThreads: 6,
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
        "**/*.d.ts",
        "**/generated/**",
        "**/*.{spec,test}.ts",
        "src/migration/**",
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 75,
        statements: 50,
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
