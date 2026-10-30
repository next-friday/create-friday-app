import {createAppServer} from "./server.ts";
import {parsePort} from "./port.ts";

const shutdownTimeoutMs = 10_000;
const server = createAppServer();

server.listen(parsePort(process.env.PORT));

/**
 * Stop accepting connections and let in-flight requests finish, closing any left after the timeout.
 */
function shutdown(): void {
  server.close();
  server.closeIdleConnections();

  setTimeout(() => {
    server.closeAllConnections();
  }, shutdownTimeoutMs).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
