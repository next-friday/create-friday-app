import {connection} from "next/server";

/**
 * Report that the server is up, for platform health checks. Rendered per request and never cached, so a
 * stopped server cannot pass from a cached response.
 * @returns A JSON response with `status: "ok"`.
 */
async function get(): Promise<Response> {
  await connection();

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
