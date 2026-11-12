import {afterEach, describe, expect, it, vi} from "vitest";
import type {PayloadRequest} from "payload";

import {Media} from "./media";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Media", () => {
  it("lets anyone read uploaded files", () => {
    const read = Media.access?.read;

    expect(read).toBeTypeOf("function");

    expect(
      read?.({
        req: {} as PayloadRequest,
      }),
    ).toBe(true);
  });

  it("requires alt text", () => {
    expect(Media.fields).toContainEqual(
      expect.objectContaining({
        name: "alt",
        required: true,
      }),
    );
  });

  it.each([
    ["image/png", true],
    ["image/svg+xml", false],
  ])("validates the uploaded file type %s as accepted: %j", async (mimeType, accepted) => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("PAYLOAD_SECRET", "test-secret");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:5432/payload");

    const {default: config} = await import("../payload.config");
    const resolved = await config;
    const media = resolved.collections.find(collection => collection.slug === "media");

    const field = media?.fields.find(
      candidate => "name" in candidate && candidate.name === "mimeType",
    );

    expect(field).toBeDefined();

    const {validate} = field as {
      validate?: (value: string, options: object) => unknown;
    };

    const result = validate?.(mimeType, {
      siblingData: {
        filename: "upload",
      },
    });

    expect(result === true).toBe(accepted);
  });
});
