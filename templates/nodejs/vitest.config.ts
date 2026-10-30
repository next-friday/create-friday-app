import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "html", "cobertura"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/main.ts"],
    },
    include: ["src/**/*.test.ts"],
  },
});
