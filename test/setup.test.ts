import {afterAll, afterEach, describe, expect, it, vi} from "vitest";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {didInstallDependencies, initGit} from "../src/setup.ts";

const manifest = "package.json";
const localTool = "local-tool";
const root = mkdtempSync(path.join(tmpdir(), "create-friday-app-"));

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

describe("initGit", () => {
  const project = path.join(root, "project");

  it("creates a repository on main", () => {
    mkdirSync(project);
    expect(initGit(project)).toBe("initialized");
    expect(readFileSync(path.join(project, ".git", "HEAD"), "utf8")).toBe("ref: refs/heads/main\n");
  });

  it("leaves an existing repository alone", () => {
    expect(initGit(project)).toBe("existing");
  });

  it("does not nest a repository inside another", () => {
    const nested = path.join(project, "nested");

    mkdirSync(nested);
    expect(initGit(nested)).toBe("parent");
  });

  it("reports a failure when Git is missing", () => {
    const bare = path.join(root, "bare");

    mkdirSync(bare);
    vi.stubEnv("PATH", "");
    expect(initGit(bare)).toBe("failed");
  });
});

describe("didInstallDependencies", () => {
  it("installs the project dependencies", () => {
    const project = path.join(root, "installable");

    mkdirSync(path.join(project, localTool), {
      recursive: true,
    });

    writeFileSync(
      path.join(project, localTool, manifest),
      JSON.stringify({
        name: localTool,
        version: "1.0.0",
      }),
    );

    writeFileSync(
      path.join(project, manifest),
      JSON.stringify({
        name: "installable",
        version: "1.0.0",
        devDependencies: {
          [localTool]: "file:./local-tool",
        },
      }),
    );

    expect(didInstallDependencies(project)).toBe(true);
    expect(existsSync(path.join(project, "node_modules", localTool, manifest))).toBe(true);
  });

  it("reports a failed install", () => {
    const project = path.join(root, "broken");

    mkdirSync(project);
    writeFileSync(path.join(project, manifest), "{");
    expect(didInstallDependencies(project)).toBe(false);
  });
});
