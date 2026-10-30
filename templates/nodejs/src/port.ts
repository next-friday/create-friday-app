const maxPort = 65_535;

/**
 * Read the TCP port the server listens on.
 * @param value - The raw `PORT` environment variable.
 * @returns The port as an integer from 1 to 65535.
 */
export function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") {
    throw new Error("PORT environment variable is required");
  }

  const port = Number(value);

  if (!/^\d+$/.test(value) || port < 1 || port > maxPort) {
    throw new Error(`PORT must be an integer from 1 to ${maxPort}, got "${value}"`);
  }

  return port;
}
