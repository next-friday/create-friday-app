import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // The create tests copy a whole template to disk, which takes over five seconds on a slow Windows runner.
    testTimeout: 20_000,
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts"],
    },
  },
});
