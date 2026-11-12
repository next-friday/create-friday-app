import {connect} from "node:net";
import {describe, expect, it} from "vitest";
import {once} from "node:events";
import type {AddressInfo} from "node:net";

import {createAppServer} from "./server.ts";

/**
 * Run a request against the server on a free port, then close it.
 * @param pathname - Path to request.
 * @param method - HTTP method.
 * @returns The response.
 */
async function request(pathname: string, method = "GET"): Promise<Response> {
  const server = createAppServer();

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const {port} = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method,
    });
  } finally {
    server.close();
    await once(server, "close");
  }
}

describe("createAppServer", () => {
  it("reports ok on GET /health", async () => {
    const response = await request("/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    await expect(response.json()).resolves.toStrictEqual({
      status: "ok",
    });
  });

  it("reports ok when /health has a query string", async () => {
    const response = await request("/health?probe=1");

    expect(response.status).toBe(200);
  });

  it("reports ok on HEAD /health", async () => {
    const response = await request("/health", "HEAD");

    expect(response.status).toBe(200);
  });

  it("returns 404 for other paths", async () => {
    const response = await request("/missing");

    expect(response.status).toBe(404);
  });

  it("returns 404 for a request target that is not a valid URL", async () => {
    const server = createAppServer();

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const {port} = server.address() as AddressInfo;
    const socket = connect(port, "127.0.0.1");

    socket.end("GET // HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");

    const chunks: Buffer[] = [];

    for await (const chunk of socket) {
      chunks.push(chunk as Buffer);
    }

    server.close();
    await once(server, "close");
    expect(Buffer.concat(chunks).toString()).toMatch(/^HTTP\/1\.1 404 /);
  });
});
