/**
 * Read a required environment variable.
 * @param name - Variable name.
 * @returns The variable's value.
 */
export function requireEnvironment(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}
