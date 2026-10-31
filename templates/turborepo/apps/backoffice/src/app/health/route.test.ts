import {describe, expect, it, vi} from "vitest";

import {GET} from "./route";

vi.mock("next/server", () => ({
  connection: vi.fn(async () => {}),
}));

describe("GET /health", () => {
  it("reports ok without caching", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
  });
});
