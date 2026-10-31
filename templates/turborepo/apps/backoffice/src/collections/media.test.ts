import {describe, expect, it} from "vitest";
import type {PayloadRequest} from "payload";

import {Media} from "./media";

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
});
