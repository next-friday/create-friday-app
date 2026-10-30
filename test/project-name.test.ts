import {afterAll, describe, expect, it} from "vitest";
import {assert, property, stringMatching} from "fast-check";
import {mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {packageName, validateProjectName} from "../src/project-name.ts";

const cwd = mkdtempSync(path.join(tmpdir(), "create-friday-app-"));

afterAll(() => {
  rmSync(cwd, {
    force: true,
    recursive: true,
  });
});

describe("validateProjectName", () => {
  it("accepts lowercase names that do not end in .", () => {
    assert(
      property(
        stringMatching(/^[a-z0-9][a-z0-9._-]{4,30}[a-z0-9_-]$/).filter(
          name => name !== "node_modules",
        ),
        name => {
          expect(validateProjectName(name, path.join(cwd, "fresh"))).toBeUndefined();
        },
      ),
    );
  });

  it.each(["", "My-App", "-app", "my app", "../app", "a".repeat(215)])("rejects %j", name => {
    expect(validateProjectName(name, cwd)).toMatch(/^Use lowercase letters/);
  });

  it("accepts an existing empty directory", () => {
    mkdirSync(path.join(cwd, "empty"));
    expect(validateProjectName("empty", cwd)).toBeUndefined();
  });

  it("accepts a directory that holds only .git, as a fresh clone", () => {
    mkdirSync(path.join(cwd, "clone", ".git"), {
      recursive: true,
    });

    expect(validateProjectName("clone", cwd)).toBeUndefined();
  });

  it("accepts . and names the package after the current directory", () => {
    const current = path.join(cwd, "current-app");

    mkdirSync(current);
    expect(validateProjectName(".", current)).toBeUndefined();
    expect(packageName(".", current)).toBe("current-app");
  });

  it("rejects . when the current directory name is not a package name", () => {
    const current = path.join(cwd, "Current App");

    mkdirSync(current);

    expect(validateProjectName(".", current)).toBe(
      `The current directory name "Current App" is not a valid package name. Use lowercase letters, digits, '.', '_' or '-', starting with a letter or digit.`,
    );
  });

  it.each(["node_modules", "favicon.ico"])("rejects the npm-reserved name %s", name => {
    expect(validateProjectName(name, cwd)).toBe(
      `"${name}" is reserved by npm. Choose another name.`,
    );
  });

  it.each(["con", "nul.txt", "com1", "lpt9", "app."])(
    "rejects %s, which Windows does not allow",
    name => {
      expect(validateProjectName(name, cwd)).toBe(
        `Windows does not allow "${name}" as a directory name. Choose another name.`,
      );
    },
  );

  it("rejects a dangling symbolic link", () => {
    symlinkSync(path.join(cwd, "missing"), path.join(cwd, "dangling"));

    expect(validateProjectName("dangling", cwd)).toBe(
      `${path.join(cwd, "dangling")} already exists and is not a directory.`,
    );
  });

  it("rejects an existing file", () => {
    writeFileSync(path.join(cwd, "a-file"), "");

    expect(validateProjectName("a-file", cwd)).toBe(
      `${path.join(cwd, "a-file")} already exists and is not a directory.`,
    );
  });

  it("rejects an existing directory with files", () => {
    mkdirSync(path.join(cwd, "taken"));
    writeFileSync(path.join(cwd, "taken", "file.txt"), "");

    expect(validateProjectName("taken", cwd)).toBe(
      `${path.join(cwd, "taken")} already exists and is not empty.`,
    );
  });
});
