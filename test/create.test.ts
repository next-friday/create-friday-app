import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {cancel, CANCEL_SYMBOL, intro, isCancel, log, outro, select, text} from "@clack/prompts";
import {existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {create} from "../src/create.ts";
import {didInstallDependencies, initGit} from "../src/setup.ts";
import {renameProject} from "../src/rename.ts";
import {usage} from "../src/arguments.ts";

vi.mock("../src/rename.ts", async importOriginal => {
  const actual = await importOriginal<typeof import("../src/rename.ts")>();

  return {
    renameProject: vi.fn(actual.renameProject),
  };
});

vi.mock("../src/setup.ts", async importOriginal => {
  const actual = await importOriginal<typeof import("../src/setup.ts")>();

  return {
    ...actual,
    initGit: vi.fn(() => "initialized"),
    didInstallDependencies: vi.fn(() => true),
  };
});

vi.mock("@clack/prompts", () => ({
  CANCEL_SYMBOL: Symbol("clack:cancel"),
  cancel: vi.fn(),
  intro: vi.fn(),
  isCancel: vi.fn(() => false),
  log: {
    error: vi.fn(),
    step: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  outro: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
}));

const nestCli = "nest-cli.json";
const packageManifest = "package.json";
const renameError = "EACCES: permission denied";
const cancelled = "Cancelled.";
const cwd = mkdtempSync(path.join(tmpdir(), "create-friday-app-"));

const nextStepsTail =
  '  pnpm start:dev\nBefore the first commit, follow "After creating a project from this template" in';

/**
 * Set whether standard input is a terminal.
 * @param isTTY - Value for `process.stdin.isTTY`.
 */
function setTerminal(isTTY: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", {
    value: isTTY,
    configurable: true,
  });
}

/**
 * Record what is written to standard output instead of printing it.
 * @returns The written chunks.
 */
function captureOutput(): string[] {
  const output: string[] = [];

  vi.spyOn(process.stdout, "write").mockImplementation(chunk => {
    output.push(String(chunk));

    return true;
  });

  return output;
}

beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(cwd);
  setTerminal(true);
  process.exitCode = 0;
});

afterEach(() => {
  process.exitCode = 0;
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

afterAll(() => {
  rmSync(cwd, {
    force: true,
    recursive: true,
  });
});

describe("create", () => {
  it("copies the shared and stack files and renames the project", async () => {
    await create(["my-api", "--stack", "nestjs"]);

    const directory = path.join(cwd, "my-api");

    const packageJson = JSON.parse(readFileSync(path.join(directory, packageManifest), "utf8")) as {
      name: string;
    };

    expect(packageJson.name).toBe("my-api");
    expect(existsSync(path.join(directory, ".husky", "pre-commit"))).toBe(true);
    expect(existsSync(path.join(directory, nestCli))).toBe(true);
    expect(existsSync(path.join(directory, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(directory, "_gitignore"))).toBe(false);
    expect(vi.mocked(initGit)).toHaveBeenCalledWith(directory);
    expect(vi.mocked(didInstallDependencies)).toHaveBeenCalledWith(directory);

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd my-api\n${nextStepsTail} my-api/README.md.`,
    );

    expect(process.exitCode).toBe(0);
  });

  it("creates a Node.js project without framework files", async () => {
    await create(["my-service", "--stack", "nodejs"]);

    const directory = path.join(cwd, "my-service");

    expect(readFileSync(path.join(directory, packageManifest), "utf8")).toContain(
      '"name": "my-service"',
    );

    expect(existsSync(path.join(directory, "src", "server.ts"))).toBe(true);
    expect(existsSync(path.join(directory, nestCli))).toBe(false);
    expect(process.exitCode).toBe(0);
  });

  it("asks for the name and stack when they are not given", async () => {
    vi.mocked(text).mockResolvedValue("my-web");
    vi.mocked(select).mockResolvedValue("nextjs");
    await create([]);
    expect(existsSync(path.join(cwd, "my-web", "app", "page.tsx"))).toBe(true);
    expect(existsSync(path.join(cwd, "my-web", nestCli))).toBe(false);
    expect(process.exitCode).toBe(0);
  });

  it("exits with 130 when the user cancels the name prompt", async () => {
    vi.mocked(text).mockResolvedValue(CANCEL_SYMBOL);
    vi.mocked(isCancel).mockReturnValue(true);
    await create([]);
    expect(vi.mocked(cancel)).toHaveBeenCalledWith(cancelled);
    expect(process.exitCode).toBe(130);
  });

  it("exits with 130 when the user cancels the stack prompt", async () => {
    vi.mocked(select).mockResolvedValue(CANCEL_SYMBOL);
    vi.mocked(isCancel).mockImplementation(value => typeof value === "symbol");
    await create(["cancelled-api"]);
    expect(vi.mocked(cancel)).toHaveBeenCalledWith(cancelled);
    expect(existsSync(path.join(cwd, "cancelled-api"))).toBe(false);
    expect(process.exitCode).toBe(130);
  });

  it("exits with 1 for an invalid project name", async () => {
    await create(["My-App", "--stack", "nestjs"]);
    expect(vi.mocked(cancel)).toHaveBeenCalledWith(expect.stringMatching(/^Use lowercase letters/));
    expect(existsSync(path.join(cwd, "My-App"))).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it("prints only the usage for --help without creating a project", async () => {
    const output = captureOutput();

    await create(["--help"]);
    expect(output).toStrictEqual([`${usage}\n`]);
    expect(vi.mocked(intro)).not.toHaveBeenCalled();
    expect(vi.mocked(renameProject)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });

  it("removes the project and exits with 1 when the rename fails", async () => {
    vi.mocked(renameProject).mockRejectedValueOnce(new Error(renameError));
    await create(["locked-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "locked-api"))).toBe(false);
    expect(vi.mocked(cancel)).toHaveBeenCalledWith(renameError);
    expect(process.exitCode).toBe(1);
  });

  it("keeps an empty target directory that existed before the run", async () => {
    mkdirSync(path.join(cwd, "empty-api"));
    vi.mocked(renameProject).mockRejectedValueOnce(new Error(renameError));
    await create(["empty-api", "--stack", "nestjs"]);
    expect(readdirSync(path.join(cwd, "empty-api"))).toStrictEqual([]);
  });

  it("removes the partial project and exits with 130 on Ctrl+C during the copy", async () => {
    vi.mocked(renameProject).mockImplementationOnce(async () => {
      process.emit("SIGINT");

      return [];
    });

    await create(["interrupted-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "interrupted-api"))).toBe(false);
    expect(vi.mocked(cancel)).toHaveBeenCalledWith(cancelled);
    expect(vi.mocked(initGit)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(130);
    expect(process.listenerCount("SIGINT")).toBe(0);
  });

  it("validates the name typed into the prompt", async () => {
    vi.mocked(text).mockImplementation(async options => {
      const {validate} = options;

      if (typeof validate !== "function") {
        throw new TypeError("The name prompt has no validate function");
      }

      expect(validate("Bad Name")).toMatch(/^Use lowercase letters/);
      expect(validate(undefined)).toMatch(/^Use lowercase letters/);

      return "typed-api";
    });

    await create(["--stack", "nestjs"]);
    expect(process.exitCode).toBe(0);
  });

  it("prints only the version", async () => {
    const output = captureOutput();

    await create(["--version"]);
    expect(output).toStrictEqual([expect.stringMatching(/^\d+\.\d+\.\d+\n$/)]);
    expect(vi.mocked(intro)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });

  it("exits with 1 instead of prompting when not running in a terminal", async () => {
    setTerminal(false);
    await create(["no-terminal"]);
    expect(vi.mocked(text)).not.toHaveBeenCalled();

    expect(vi.mocked(cancel)).toHaveBeenCalledWith(
      expect.stringMatching(/^Pass the project name and --stack/),
    );

    expect(existsSync(path.join(cwd, "no-terminal"))).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it("creates the project in the current directory for .", async () => {
    const current = path.join(cwd, "dot-app");

    mkdirSync(path.join(current, ".git"), {
      recursive: true,
    });

    vi.spyOn(process, "cwd").mockReturnValue(current);
    await create([".", "--stack", "nodejs"]);

    expect(readFileSync(path.join(current, packageManifest), "utf8")).toContain(
      '"name": "dot-app"',
    );

    expect(vi.mocked(outro)).toHaveBeenCalledWith(`Next steps:\n${nextStepsTail} README.md.`);
  });

  it("keeps .git when the create fails in the current directory", async () => {
    const current = path.join(cwd, "dot-failed");

    mkdirSync(path.join(current, ".git"), {
      recursive: true,
    });

    vi.spyOn(process, "cwd").mockReturnValue(current);
    vi.mocked(renameProject).mockRejectedValueOnce(new Error(renameError));
    await create([".", "--stack", "nodejs"]);
    expect(readdirSync(current)).toStrictEqual([".git"]);
    expect(process.exitCode).toBe(1);
  });

  it("writes .env with a random Payload secret and asks for the database", async () => {
    await create(["my-cms", "--stack", "payload"]);

    const environment = readFileSync(path.join(cwd, "my-cms", ".env"), "utf8");

    expect(environment).toMatch(/^PAYLOAD_SECRET=[\da-f]{64}$/mu);
    expect(environment).toContain("DATABASE_URL=");

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd my-cms\n  pnpm dev\nSet DATABASE_URL in .env to your PostgreSQL database before pnpm dev.\nBefore the first commit, follow "After creating a project from this template" in my-cms/README.md.`,
    );
  });

  it("leaves git init and pnpm install to the user with --skip-git and --skip-install", async () => {
    await create(["skipped-api", "--stack", "nestjs", "--skip-git", "--skip-install"]);
    expect(vi.mocked(initGit)).not.toHaveBeenCalled();
    expect(vi.mocked(didInstallDependencies)).not.toHaveBeenCalled();

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd skipped-api\n  git init --initial-branch=main\n  pnpm install\n${nextStepsTail} skipped-api/README.md.`,
    );
  });

  it("keeps the project and exits with 1 when pnpm install fails", async () => {
    vi.mocked(didInstallDependencies).mockReturnValueOnce(false);
    await create(["offline-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "offline-api", packageManifest))).toBe(true);

    expect(vi.mocked(log.error)).toHaveBeenCalledWith(
      expect.stringMatching(/^pnpm install failed/),
    );

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd offline-api\n  pnpm install\n${nextStepsTail} offline-api/README.md.`,
    );

    expect(process.exitCode).toBe(1);
  });

  it("warns when the project is inside another repository", async () => {
    vi.mocked(initGit).mockReturnValueOnce("parent");
    await create(["nested-api", "--stack", "nestjs"]);
    expect(vi.mocked(log.warn)).toHaveBeenCalledWith(expect.stringMatching(/^Skipped git init/));

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd nested-api\n${nextStepsTail} nested-api/README.md.`,
    );
  });

  it("asks the user to run git init when it fails", async () => {
    vi.mocked(initGit).mockReturnValueOnce("failed");
    await create(["no-git-api", "--stack", "nestjs"]);
    expect(vi.mocked(log.warn)).toHaveBeenCalledWith(expect.stringMatching(/^git init failed/));

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd no-git-api\n  git init --initial-branch=main\n  pnpm install\n${nextStepsTail} no-git-api/README.md.`,
    );
  });
});
