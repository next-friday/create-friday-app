import {afterEach, describe, expect, it, vi} from "vitest";
import {readFileSync} from "node:fs";

interface PackageManifest {
  dependencies?: Record<string, string>;
}

const publicURL = "https://app.example.test";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("payload config", () => {
  it("keeps the HTTP API on REST", async () => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("PAYLOAD_SECRET", "test-secret");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/payload");

    const {default: config} = await import("./payload.config");
    const resolved = await config;

    expect(resolved.graphQL.disable).toBe(true);
  });

  it("accepts cross-origin requests only from the public URL", async () => {
    vi.stubEnv("APP_URL", publicURL);
    vi.stubEnv("PAYLOAD_SECRET", "test-secret");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/payload");

    const {default: config} = await import("./payload.config");
    const resolved = await config;

    expect(resolved.serverURL).toBe(publicURL);
    expect(resolved.cors).toEqual([publicURL]);
  });

  it("does not add an extra peer dependency", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as PackageManifest;

    expect(manifest.dependencies?.graphql).toBeUndefined();
  });
});
