import {describe, expect, it} from "vitest";

import {deployTargets} from "../src/deploy-targets.ts";
import {parseCliArguments, usage} from "../src/arguments.ts";
import {stacks} from "../src/stacks.ts";

describe("usage", () => {
  it("lists every supported stack id", () => {
    expect(usage).toContain(`[--stack ${stacks.map(stack => stack.id).join("|")}]`);
  });

  it("lists --yes and the defaults it takes", () => {
    expect(usage).toContain("-y, --yes");
    expect(usage).toContain("the name my-app and the stack nextjs");
  });

  it("lists every deploy target and names the default", () => {
    expect(usage).toContain(`[--deploy ${deployTargets.join("|")}]`);
    expect(usage).toContain("Deploy target: none or railway. The default is none.");
  });
});

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
      deploy: "none",
      yes: false,
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

  it.each(["--help", "--version"])("reads %s despite other bad arguments", flag => {
    expect(parseCliArguments([flag, "--stack", "rails", "first", "second"]).stack).toBeUndefined();
  });

  it.each(["--yes", "-y"])("reads %s", flag => {
    expect(parseCliArguments([flag]).yes).toBe(true);
  });

  it("reads the deploy target", () => {
    expect(parseCliArguments(["--deploy", "railway"]).deploy).toBe("railway");
  });

  it("rejects an unknown deploy target", () => {
    expect(() => parseCliArguments(["--deploy", "../base"])).toThrow(
      'Unknown deploy target "../base". Use one of: none, railway.',
    );
  });

  it("reads --help despite an unknown deploy target", () => {
    expect(parseCliArguments(["--help", "--deploy", "heroku"]).deploy).toBe("none");
  });

  it("rejects an unknown stack", () => {
    expect(() => parseCliArguments(["--stack", "rails"])).toThrow(
      'Unknown stack "rails". Use one of: nodejs, nestjs, nextjs, payload, turborepo.',
    );
  });
});
