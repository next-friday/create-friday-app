import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "html", "cobertura"],
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.test.{ts,tsx}", "app/**/layout.tsx"],
    },
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
