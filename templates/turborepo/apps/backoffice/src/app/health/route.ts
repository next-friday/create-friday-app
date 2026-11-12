import {connection} from "next/server";
import {getPayload} from "payload";

import config from "../../payload.config";

/**
 * Report that the server is up and Payload is ready, for platform health checks. Initialising Payload connects to
 * the database and applies pending migrations, so an unreachable or unmigrated database fails the check. Rendered
 * per request and never cached, so a stopped server cannot pass from a cached response.
 * @returns A JSON response with `status: "ok"`.
 */
async function get(): Promise<Response> {
  await connection();

  await getPayload({
    config,
  });

  return Response.json(
    {
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export {get as GET};
