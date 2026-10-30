import friday from "@next-friday/prettier-config-friday";
import type {Config} from "prettier";
import type {PluginOptions} from "prettier-plugin-tailwindcss";

const prettierConfig: Config & PluginOptions = {
  ...friday,
  tailwindStylesheet: "./app/globals.css",
  plugins: [...(friday.plugins ?? []), "prettier-plugin-tailwindcss"],
};

export default prettierConfig;
