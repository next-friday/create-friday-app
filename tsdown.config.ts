import {defineConfig} from "tsdown";

export default defineConfig({
  platform: "node",
  format: ["esm"],
  entry: {
    main: "src/main.ts",
  },
});
