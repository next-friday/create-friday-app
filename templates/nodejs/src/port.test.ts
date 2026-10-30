import {assert, integer, property} from "fast-check";
import {describe, expect, it} from "vitest";

import {parsePort} from "./port.ts";

describe("parsePort", () => {
  it("reads every port from 1 to 65535", () => {
    assert(
      property(
        integer({
          min: 1,
          max: 65_535,
        }),
        port => {
          expect(parsePort(String(port))).toBe(port);
        },
      ),
    );
  });

  it.each([undefined, ""])("requires a value, rejecting %j", value => {
    expect(() => parsePort(value)).toThrow("PORT environment variable is required");
  });

  it.each(["abc", "0", "65536", "3000.5", "-1", " 3000", "0x10"])("rejects %j", value => {
    expect(() => parsePort(value)).toThrow(
      `PORT must be an integer from 1 to 65535, got "${value}"`,
    );
  });
});
