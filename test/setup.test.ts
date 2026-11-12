import {afterAll, afterEach, describe, expect, it, vi} from "vitest";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {didInstallDependencies, initGit} from "../src/setup.ts";

const manifest = "package.json";
const localTool = "local-tool";
const root = mkdtempSync(path.join(tmpdir(), "create-app-test-"));

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  rmSync(root, {
    force: true,
    recursive: true,
  });
});

/**
 * Create a directory under the test root, and a repository in it when asked.
 * @param name - Directory name.
 * @param isRepository - Whether to run `git init` in it.
 * @returns The directory path.
 */
function makeDirectory(name: string, isRepository = false): string {
  const directory = path.join(root, name);

  mkdirSync(directory);

  if (isRepository) {
    expect(initGit(directory)).toBe("initialized");
  }

  return directory;
}

describe("initGit", () => {
  it("creates a repository on main", () => {
    const project = makeDirectory("project");

    expect(initGit(project)).toBe("initialized");
    expect(readFileSync(path.join(project, ".git", "HEAD"), "utf8")).toBe("ref: refs/heads/main\n");
  });

  it("leaves an existing repository alone", () => {
    expect(initGit(makeDirectory("existing", true))).toBe("existing");
  });

  it("does not nest a repository inside another", () => {
    const nested = path.join(makeDirectory("parent", true), "nested");

    mkdirSync(nested);
    expect(initGit(nested)).toBe("parent");
  });

  it("ignores a repository that the inherited GIT_DIR names", () => {
    const repository = makeDirectory("named-repository", true);
    const outside = makeDirectory("outside");

    vi.stubEnv("GIT_DIR", path.join(repository, ".git"));
    expect(initGit(outside)).toBe("initialized");
    expect(existsSync(path.join(outside, ".git", "HEAD"))).toBe(true);
  });

  it("reports a failure when Git is missing", () => {
    const bare = makeDirectory("bare");

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

  it("runs install scripts in the project's own repository", () => {
    const project = path.join(root, "own-repository");
    const other = path.join(root, "other-repository");

    mkdirSync(project);
    mkdirSync(other);
    expect(initGit(project)).toBe("initialized");
    expect(initGit(other)).toBe("initialized");

    writeFileSync(
      path.join(project, manifest),
      JSON.stringify({
        name: "own-repository",
        version: "1.0.0",
        scripts: {
          prepare: "git config core.hooksPath .husky/_",
        },
      }),
    );

    vi.stubEnv("GIT_DIR", path.join(other, ".git"));
    expect(didInstallDependencies(project)).toBe(true);

    expect(readFileSync(path.join(project, ".git", "config"), "utf8")).toContain(
      "hooksPath = .husky/_",
    );

    expect(readFileSync(path.join(other, ".git", "config"), "utf8")).not.toContain("hooksPath");
  });

  it("reports a failed install", () => {
    const project = path.join(root, "broken");

    mkdirSync(project);
    writeFileSync(path.join(project, manifest), "{");
    expect(didInstallDependencies(project)).toBe(false);
  });
});
