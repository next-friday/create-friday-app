import {afterEach, describe, expect, it, vi} from "vitest";
import {readFileSync} from "node:fs";

interface PackageManifest {
  dependencies?: Record<string, string>;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("payload config", () => {
  it("keeps the HTTP API on REST", async () => {
    vi.stubEnv("APP_URL", "http://localhost:3001");
    vi.stubEnv("PAYLOAD_SECRET", "test-secret");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/payload");

    const {default: config} = await import("./payload.config");
    const resolved = await config;

    expect(resolved.graphQL.disable).toBe(true);
  });

  it("does not add an extra peer dependency", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as PackageManifest;

    expect(manifest.dependencies?.graphql).toBeUndefined();
  });
});
