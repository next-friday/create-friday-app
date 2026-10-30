import {afterEach, describe, expect, it} from "vitest";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {renameProject} from "../src/rename.ts";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, {
      force: true,
      recursive: true,
    });
  }
});

describe("renameProject", () => {
  it("replaces the template name in nested text files and skips binary files", async () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-friday-app-"));

    directories.push(directory);

    const packageJson = path.join(directory, "package.json");
    const feature = path.join(directory, ".github", "feature.yml");
    const favicon = path.join(directory, "favicon.ico");
    const latin1 = path.join(directory, "latin1.txt");
    const latin1Content = Buffer.from("caf\u{E9} template-x", "latin1");
    const binary = Buffer.concat([Buffer.from([0]), Buffer.from("template-x")]);

    mkdirSync(path.join(directory, ".github"));
    writeFileSync(packageJson, '{"name": "template-x"}');
    writeFileSync(feature, "Change template-x and $&.");
    writeFileSync(path.join(directory, "untouched.md"), "nothing here");
    writeFileSync(favicon, binary);
    writeFileSync(latin1, latin1Content);

    const changed = await renameProject(directory, "template-x", "my-app");

    expect(new Set(changed)).toStrictEqual(new Set([feature, packageJson]));
    expect(readFileSync(packageJson, "utf8")).toBe('{"name": "my-app"}');
    expect(readFileSync(feature, "utf8")).toBe("Change my-app and $&.");
    expect(readFileSync(favicon)).toStrictEqual(binary);
    expect(readFileSync(latin1)).toStrictEqual(latin1Content);
  });
});
