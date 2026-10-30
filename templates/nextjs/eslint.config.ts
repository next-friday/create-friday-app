import {defineConfig, globalIgnores} from "eslint/config";
import friday from "@next-friday/eslint-config-friday";
import nextPlugin, {configs as nextConfigs} from "@next/eslint-plugin-next";

export default defineConfig(
  globalIgnores([
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  friday({
    react: true,
  }),
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: nextConfigs["core-web-vitals"].rules,
  },
  {
    rules: {
      "friday/component-module": "off",
    },
    files: ["app/**/{page,layout}.tsx"],
  },
);
