import {existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

/**
 * Read a required environment variable.
 * @param name - Variable name.
 * @returns The variable's value.
 */
export function requireEnvironment(name: string): string {
  const environmentFile = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../.env",
  );

  if (existsSync(environmentFile)) {
    process.loadEnvFile(environmentFile);
  }

  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}
