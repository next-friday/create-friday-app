import {afterEach, describe, expect, it, vi} from "vitest";
import {assert, property, string} from "fast-check";
import {existsSync} from "node:fs";

import {requireEnvironment} from "./environment";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
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

  it.each([
    [true, 1],
    [false, 0],
  ])("loads the workspace .env only when it exists: %j", (exists, loads) => {
    vi.mocked(existsSync).mockReturnValue(exists);

    const loadEnvironmentFile = vi.spyOn(process, "loadEnvFile").mockImplementation(() => {});

    vi.stubEnv("EXAMPLE_VALUE", "value");
    requireEnvironment("EXAMPLE_VALUE");
    expect(loadEnvironmentFile).toHaveBeenCalledTimes(loads);
  });
});
