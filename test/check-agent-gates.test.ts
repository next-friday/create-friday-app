import {afterAll, describe, expect, it} from "vitest";
import {execFileSync, spawnSync} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

const root = mkdtempSync(path.join(tmpdir(), "create-app-test-"));

afterAll(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe("check-agent-gates", () => {
  it("leaves the repository named by GIT_DIR as it was", () => {
    const repository = path.join(root, "caller");

    const environment = {
      ...process.env,
      GIT_DIR: path.join(repository, ".git"),
    };

    const git = (...gitArguments: string[]): string =>
      execFileSync(
        "git",
        [
          "-c",
          "user.name=Caller",
          "-c",
          "user.email=caller@example.com",
          "-c",
          "commit.gpgsign=false",
          ...gitArguments,
        ],
        {
          cwd: repository,
          env: environment,
          encoding: "utf8",
        },
      );

    execFileSync("git", ["init", "--initial-branch=main", repository], {
      stdio: "ignore",
    });

    git("commit", "--allow-empty", "--message", "initial");

    const readState = (): string[] => [
      git("rev-parse", "HEAD"),
      git("branch", "--show-current"),
      git("branch", "--list"),
    ];

    const before = readState();

    const gateCheck = spawnSync("node", ["scripts/check-agent-gates.ts"], {
      env: environment,
    });

    expect(gateCheck.error).toBeUndefined();
    expect(readState()).toEqual(before);
  }, 120_000);
});
