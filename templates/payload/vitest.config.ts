import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "html", "cobertura"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/layout.tsx",
        String.raw`src/app/\(payload\)/**`,
        "src/migrations/**",
        "src/payload-types.ts",
        "src/payload.config.ts",
      ],
    },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
