import {createServer} from "node:http";
import type {Server} from "node:http";

/**
 * Create the HTTP server. `GET` or `HEAD` `/health` reports that the process is up; every other request gets 404.
 * @returns A server that is not listening yet.
 */
export function createAppServer(): Server {
  return createServer((request, response) => {
    const {pathname} = new URL(request.url ?? "/", "http://localhost");

    if (pathname === "/health" && (request.method === "GET" || request.method === "HEAD")) {
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      });

      response.end(
        JSON.stringify({
          status: "ok",
        }),
      );

      return;
    }

    response.writeHead(404, {
      "Content-Type": "application/json",
    });

    response.end(
      JSON.stringify({
        status: "not found",
      }),
    );
  });
}
