import {describe, expect, it} from "vitest";

import {parseCliArguments} from "../src/arguments.ts";

describe("parseCliArguments", () => {
  it("leaves the name and stack unset so the CLI asks for them", () => {
    const options = parseCliArguments([]);

    expect(options.name).toBeUndefined();
    expect(options.stack).toBeUndefined();
  });

  it("reads the name and stack", () => {
    expect(parseCliArguments(["my-api", "--stack", "nestjs"])).toStrictEqual({
      name: "my-api",
      stack: "nestjs",
      help: false,
      skipGit: false,
      skipInstall: false,
      version: false,
    });
  });

  it("rejects more than one project name", () => {
    expect(() => parseCliArguments(["first", "second"])).toThrow(
      "Pass one project name, not 2: first second.",
    );
  });

  it.each(["--help", "-h"])("reads %s", flag => {
    expect(parseCliArguments([flag]).help).toBe(true);
  });

  it.each(["--version", "-v"])("reads %s", flag => {
    expect(parseCliArguments([flag]).version).toBe(true);
  });

  it("reads --skip-git and --skip-install", () => {
    expect(parseCliArguments(["--skip-git", "--skip-install"])).toMatchObject({
      skipGit: true,
      skipInstall: true,
    });
  });

  it("rejects an unknown stack", () => {
    expect(() => parseCliArguments(["--stack", "rails"])).toThrow(
      'Unknown stack "rails". Use one of: nodejs, nestjs, nextjs, payload, turborepo.',
    );
  });
});
