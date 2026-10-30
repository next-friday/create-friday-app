import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ["text", "html", "cobertura"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/main.ts", "src/**/*.module.ts"],
    },
    include: ["src/**/*.test.ts"],
  },
});
