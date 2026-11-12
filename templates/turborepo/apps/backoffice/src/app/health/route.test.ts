import {beforeEach, describe, expect, it, vi} from "vitest";
import {getPayload} from "payload";

import {GET} from "./route";

vi.mock("next/server", () => ({
  connection: vi.fn(async () => {}),
}));

vi.mock("../../payload.config", () => ({
  default: {},
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(),
}));

describe("GET /health", () => {
  beforeEach(() => {
    vi.mocked(getPayload).mockReset();
  });

  it("reports ok without caching once Payload is ready", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
  });

  it("fails when Payload cannot initialise", async () => {
    vi.mocked(getPayload).mockRejectedValue(new Error("database unreachable"));
    await expect(GET()).rejects.toThrow("database unreachable");
  });
});
