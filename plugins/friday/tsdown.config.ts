import {defineConfig} from "tsdown";

export default defineConfig({
  banner: "#!/usr/bin/env node",
  platform: "node",
  format: ["esm"],
  entry: {
    "check-bands": "source/scripts/check-bands.ts",
    "check-plan": "source/scripts/check-plan.ts",
    "measure-loop": "source/scripts/measure-loop.ts",
  },
});
