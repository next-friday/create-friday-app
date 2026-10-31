import {afterEach, describe, expect, it, vi} from "vitest";
import {assert, property, string} from "fast-check";

import {requireEnvironment} from "./environment";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireEnvironment", () => {
  it("returns any non-empty value unchanged", () => {
    assert(
      property(
        string({
          minLength: 1,
        }).filter(value => !value.includes("\0")),
        value => {
          vi.stubEnv("EXAMPLE_VALUE", value);
          expect(requireEnvironment("EXAMPLE_VALUE")).toBe(value);
        },
      ),
    );
  });

  it.each([undefined, ""])("throws when the value is %j", value => {
    vi.stubEnv("EXAMPLE_VALUE", value);

    expect(() => requireEnvironment("EXAMPLE_VALUE")).toThrow(
      "EXAMPLE_VALUE environment variable is required",
    );
  });
});
