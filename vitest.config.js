// vitest.config.js
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.test.json"],
    }),
  ],

  setupFiles: ["./test/setup.ts"],

  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  test: {
    globals: true,
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),
    fileParallelism: false,
    pool: "forks",
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
