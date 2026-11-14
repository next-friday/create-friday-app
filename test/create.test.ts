import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {cancel, CANCEL_SYMBOL, intro, isCancel, log, outro, select, text} from "@clack/prompts";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {rename} from "node:fs/promises";
import {tmpdir} from "node:os";

import {create} from "../src/create.ts";
import {didInstallDependencies, initGit} from "../src/setup.ts";
import {renameProject} from "../src/rename.ts";
import {usage} from "../src/arguments.ts";

vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();

  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
  };
});

vi.mock("node:fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...actual,
    rename: vi.fn(actual.rename),
  };
});

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

const nestModule = "src/app.module.ts";
const packageManifest = "package.json";
const renameError = "EACCES: permission denied";
const dotStack = ["nodejs"];
const gitDirectory = ".git";
const cancelled = "Cancelled.";
const cwd = mkdtempSync(path.join(tmpdir(), "create-app-test-"));

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

/**
 * Record what is written to standard error instead of printing it.
 * @returns The written chunks.
 */
function captureErrors(): string[] {
  const output: string[] = [];

  vi.spyOn(process.stderr, "write").mockImplementation(chunk => {
    output.push(String(chunk));

    return true;
  });

  return output;
}

/**
 * Make `directory` the working directory, holding an empty repository.
 * @param name - Directory name under the test root.
 * @returns The directory path.
 */
function enterClone(name: string): string {
  const current = path.join(cwd, name);

  mkdirSync(path.join(current, gitDirectory), {
    recursive: true,
  });

  vi.spyOn(process, "cwd").mockReturnValue(current);

  return current;
}

beforeEach(() => {
  vi.mocked(isCancel).mockReset();
  vi.mocked(text).mockReset();
  vi.mocked(select).mockReset();
  vi.mocked(existsSync).mockReset();
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
    expect(existsSync(path.join(directory, nestModule))).toBe(true);
    expect(existsSync(path.join(directory, ".gitignore"))).toBe(true);
    expect(existsSync(path.join(directory, "_gitignore"))).toBe(false);
    expect(existsSync(path.join(directory, ".env"))).toBe(true);
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
    expect(existsSync(path.join(directory, ".env"))).toBe(true);
    expect(existsSync(path.join(directory, nestModule))).toBe(false);
    expect(process.exitCode).toBe(0);
  });

  it("asks for the name and stack when they are not given", async () => {
    vi.mocked(text).mockResolvedValue("my-web");
    vi.mocked(select).mockResolvedValue("nextjs");
    await create([]);
    expect(existsSync(path.join(cwd, "my-web", "app", "page.tsx"))).toBe(true);
    expect(existsSync(path.join(cwd, "my-web", ".env"))).toBe(true);
    expect(existsSync(path.join(cwd, "my-web", nestModule))).toBe(false);
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
    const errors = captureErrors();

    await create(["My-App", "--stack", "nestjs"]);
    expect(errors).toStrictEqual([expect.stringMatching(/^Use lowercase letters/u)]);
    expect(vi.mocked(intro)).not.toHaveBeenCalled();
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
    const errors = captureErrors();

    vi.mocked(renameProject).mockRejectedValueOnce(new Error(renameError));
    await create(["locked-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "locked-api"))).toBe(false);
    expect(errors).toStrictEqual([`${renameError}\n`]);
    expect(vi.mocked(cancel)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("removes the project and exits with 1 when the template copy fails", async () => {
    const errors = captureErrors();

    vi.mocked(rename).mockRejectedValueOnce(new Error(renameError));
    await create(["unwritable-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "unwritable-api"))).toBe(false);
    expect(errors).toStrictEqual([`${renameError}\n`]);
    expect(process.exitCode).toBe(1);
  });

  it("keeps an empty target directory that existed before the run", async () => {
    mkdirSync(path.join(cwd, "empty-api"));
    vi.mocked(renameProject).mockRejectedValueOnce(new Error(renameError));
    await create(["empty-api", "--stack", "nestjs"]);
    expect(readdirSync(path.join(cwd, "empty-api"))).toStrictEqual([]);
  });
});

describe("create with a deploy target", () => {
  const railwayConfig = "railway.json";

  const railwayFiles = [
    railwayConfig,
    path.join("runbooks", "rollback-deploy.md"),
    path.join(".github", "workflows", "deploy.yml"),
  ];

  it("copies the files of the railway deploy target", async () => {
    await create(["railway-api", "--stack", "nestjs", "--deploy", "railway"]);

    const directory = path.join(cwd, "railway-api");

    for (const file of railwayFiles) {
      expect(existsSync(path.join(directory, file))).toBe(true);
    }

    expect(process.exitCode).toBe(0);
  });

  it("copies no file of a deploy target without --deploy", async () => {
    await create(["plain-api", "--stack", "nestjs"]);

    const directory = path.join(cwd, "plain-api");

    for (const file of railwayFiles) {
      expect(existsSync(path.join(directory, file))).toBe(false);
    }
  });

  it.each(["nodejs", "nestjs", "nextjs", "payload", "turborepo"])(
    "names no deploy host in a %s project without --deploy",
    async stack => {
      const name = `hostless-${stack}`;

      await create([name, "--stack", stack]);

      const directory = path.join(cwd, name);

      const files = readdirSync(directory, {
        recursive: true,
        withFileTypes: true,
      }).filter(entry => entry.isFile());

      const naming = files
        .map(entry => path.join(entry.parentPath, entry.name))
        .filter(file => /railway/iu.test(file) || /railway/iu.test(readFileSync(file, "utf8")));

      expect(naming).toStrictEqual([]);
    },
  );

  it.each(["none", "railway"])("leaves no deploy target marker with --deploy %s", async target => {
    const name = `markers-${target}`;

    await create([name, "--stack", "turborepo", "--deploy", target]);

    const directory = path.join(cwd, name);

    const files = readdirSync(directory, {
      recursive: true,
      withFileTypes: true,
    }).filter(entry => entry.isFile());

    const marked = files
      .map(entry => path.join(entry.parentPath, entry.name))
      .filter(file =>
        readFileSync(file, "utf8")
          .split("\n")
          .some(line => /^(?:#|\/\/|<!--) ?deploy:/u.test(line.trim())),
      );

    expect(marked).toStrictEqual([]);
  });

  it("keeps the deploy layer's turbo.json equal to the stack's except for railway.json", () => {
    const templates = path.join(import.meta.dirname, "..", "templates");

    const readTurbo = (layer: string): {globalDependencies: string[]} =>
      JSON.parse(readFileSync(path.join(templates, layer, "turbo.json"), "utf8")) as {
        globalDependencies: string[];
      };

    const deployLayer = readTurbo(path.join("deploy-railway", "turborepo"));

    expect({
      ...deployLayer,
      globalDependencies: deployLayer.globalDependencies.filter(entry => entry !== railwayConfig),
    }).toStrictEqual(readTurbo("turborepo"));
  });

  it.each([
    ["railway", true],
    ["none", false],
  ])("lists railway.json as a turborepo input only with --deploy %s", async (target, isListed) => {
    const name = `turbo-${target}`;

    await create([name, "--stack", "turborepo", "--deploy", target]);

    const turbo = JSON.parse(readFileSync(path.join(cwd, name, "turbo.json"), "utf8")) as {
      globalDependencies: string[];
    };

    expect(turbo.globalDependencies.includes(railwayConfig)).toBe(isListed);
  });

  it.each(["nodejs", "nestjs", "nextjs", "payload", "turborepo"])(
    "says in the %s README what a deploy step needs without --deploy",
    async stack => {
      const name = `readme-${stack}`;

      await create([name, "--stack", stack]);

      const readme = readFileSync(path.join(cwd, name, "README.md"), "utf8");

      expect(readme).toContain("The project has no deploy step yet. A deploy step needs:");
      expect(readme.match(/^## Deploy$/gmu)).toHaveLength(1);
    },
  );

  it.each([
    ["railway", true],
    ["none", false],
  ])("holds the deploy-dev job only with --deploy %s", async (target, hasJob) => {
    const name = `workflow-${target}`;

    await create([name, "--stack", "nestjs", "--deploy", target]);

    const workflow = readFileSync(path.join(cwd, name, ".github", "workflows", "ci.yml"), "utf8");

    expect(workflow.includes("\n  deploy-dev:\n")).toBe(hasJob);
    expect(workflow).toContain("&& vars.CONTAINER_IMAGE != 'false'\n");
  });

  it("writes no file for an unknown deploy target", async () => {
    const errors = captureErrors();

    await create(["heroku-api", "--stack", "nestjs", "--deploy", "heroku"]);
    expect(existsSync(path.join(cwd, "heroku-api"))).toBe(false);
    expect(errors.join("")).toContain('Unknown deploy target "heroku". Use one of: none, railway.');
    expect(process.exitCode).toBe(1);
  });
});

describe("create with defaults", () => {
  it("offers my-app and Next.js as the defaults a person accepts with Enter", async () => {
    vi.mocked(text).mockResolvedValue("enter-defaults");
    vi.mocked(select).mockResolvedValue("nextjs");
    await create([]);

    expect(vi.mocked(text)).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValue: "my-app",
      }),
    );

    expect(vi.mocked(select)).toHaveBeenCalledWith(
      expect.objectContaining({
        initialValue: "nextjs",
      }),
    );

    expect(process.exitCode).toBe(0);
  });

  it("creates my-app from Next.js with --yes and asks nothing, without a terminal", async () => {
    const directory = path.join(cwd, "yes-defaults");

    mkdirSync(directory);
    vi.spyOn(process, "cwd").mockReturnValue(directory);
    setTerminal(false);
    await create(["--yes"]);
    expect(vi.mocked(text)).not.toHaveBeenCalled();
    expect(vi.mocked(select)).not.toHaveBeenCalled();
    expect(existsSync(path.join(directory, "my-app", "next.config.ts"))).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it("lets a name and --stack given with --yes win over the defaults", async () => {
    setTerminal(false);
    await create(["yes-api", "--stack", "nestjs", "-y"]);
    expect(existsSync(path.join(cwd, "yes-api", nestModule))).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it("reports an invalid name given with --yes as it is, with no hint to pass a name", async () => {
    const errors = captureErrors();

    setTerminal(false);
    await create(["Bad Name", "--yes"]);
    expect(errors.join("")).toMatch(/^Use lowercase letters/u);
    expect(errors.join("")).not.toMatch(/Pass a project name/u);
    expect(process.exitCode).toBe(1);
  });

  it("stops before writing a file when --yes meets a my-app directory that holds files", async () => {
    const directory = path.join(cwd, "yes-taken");
    const errors = captureErrors();

    mkdirSync(path.join(directory, "my-app"), {
      recursive: true,
    });

    writeFileSync(path.join(directory, "my-app", "notes.txt"), "keep");
    vi.spyOn(process, "cwd").mockReturnValue(directory);
    setTerminal(false);
    await create(["--yes"]);
    expect(errors.join("")).toMatch(/my-app/u);
    expect(errors.join("")).toMatch(/Pass a project name/u);
    expect(readdirSync(path.join(directory, "my-app"))).toStrictEqual(["notes.txt"]);
    expect(process.exitCode).toBe(1);
  });
});

describe("create interruptions and edge cases", () => {
  it.each(["SIGINT", "SIGTERM", "SIGHUP"] as const)(
    "removes the partial project and exits with 130 on %s during the copy",
    async signal => {
      vi.mocked(renameProject).mockImplementationOnce(async () => {
        process.emit(signal);
      });

      await create(["interrupted-api", "--stack", "nestjs"]);
      expect(existsSync(path.join(cwd, "interrupted-api"))).toBe(false);
      expect(vi.mocked(cancel)).toHaveBeenCalledWith(cancelled);
      expect(vi.mocked(initGit)).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(130);
      expect(process.listenerCount(signal)).toBe(0);
    },
  );

  it("reports a thrown value that is not an Error", async () => {
    const errors = captureErrors();

    vi.mocked(renameProject).mockRejectedValueOnce("plain text");
    await create(["thrown-api", "--stack", "nestjs"]);
    expect(errors).toStrictEqual(["plain text\n"]);
    expect(process.exitCode).toBe(1);
  });

  it("names the missing template instead of a raw ENOENT", async () => {
    const errors = captureErrors();
    const {existsSync: actualExists} = await vi.importActual<typeof import("node:fs")>("node:fs");

    vi.mocked(existsSync).mockImplementation(
      file => actualExists(file) && !String(file).endsWith(`${path.sep}nestjs`),
    );

    await create(["no-template", "--stack", "nestjs"]);
    expect(errors).toStrictEqual([expect.stringMatching(/^The nestjs template is missing from/u)]);
    expect(actualExists(path.join(cwd, "no-template"))).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it("rejects a name whose directory appears while the stack prompt waits", async () => {
    const errors = captureErrors();
    const taken = path.join(cwd, "raced-api");

    vi.mocked(select).mockImplementation(async () => {
      mkdirSync(taken);
      writeFileSync(path.join(taken, "mine.txt"), "kept");

      return "nestjs";
    });

    await create(["raced-api"]);
    expect(errors).toStrictEqual([expect.stringMatching(/already exists and is not empty/u)]);
    expect(readdirSync(taken)).toStrictEqual(["mine.txt"]);
    expect(process.exitCode).toBe(1);
  });

  it("rejects . when the current directory holds files", async () => {
    const errors = captureErrors();
    const current = enterClone("dot-full");

    writeFileSync(path.join(current, "mine.txt"), "kept");
    await create([".", "--stack", ...dotStack]);
    expect(errors).toStrictEqual([expect.stringMatching(/already exists and is not empty/u)]);

    expect(
      readdirSync(current).toSorted((first, second) => first.localeCompare(second)),
    ).toStrictEqual([gitDirectory, "mine.txt"]);
  });

  it("creates the project in a symbolic link to an empty directory", async () => {
    const real = path.join(cwd, "real-directory");
    const link = path.join(cwd, "linked-api");

    mkdirSync(real);
    symlinkSync(real, link);
    await create(["linked-api", "--stack", "nodejs"]);
    expect(existsSync(path.join(real, packageManifest))).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it("leaves the mode of a script in an existing .git unchanged", async () => {
    const current = enterClone("dot-hooks");
    const sample = path.join(current, gitDirectory, "pre-commit.sample");

    writeFileSync(sample, "#!/bin/sh\n", {
      mode: 0o644,
    });

    const modeBefore = statSync(sample).mode;

    await create([".", "--stack", "nodejs"]);
    expect(statSync(sample).mode).toBe(modeBefore);
  });

  it("validates the name typed into the prompt", async () => {
    vi.mocked(text).mockImplementation(async options => {
      const {validate} = options;

      if (typeof validate !== "function") {
        throw new TypeError("The name prompt has no validate function");
      }

      expect(validate("Bad Name")).toMatch(/^Use lowercase letters/);
      expect(validate("")).toBeUndefined();
      expect(validate(undefined)).toBeUndefined();

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
    const errors = captureErrors();

    setTerminal(false);
    await create(["no-terminal"]);
    expect(vi.mocked(text)).not.toHaveBeenCalled();
    expect(errors).toStrictEqual([expect.stringMatching(/^Pass the project name and --stack/u)]);
    expect(vi.mocked(intro)).not.toHaveBeenCalled();
    expect(existsSync(path.join(cwd, "no-terminal"))).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it("creates the project in the current directory for .", async () => {
    const current = enterClone("dot-app");

    await create([".", "--stack", "nodejs"]);

    expect(readFileSync(path.join(current, packageManifest), "utf8")).toContain(
      '"name": "dot-app"',
    );

    expect(vi.mocked(outro)).toHaveBeenCalledWith(`Next steps:\n${nextStepsTail} README.md.`);
  });

  it("keeps .git when the create fails in the current directory", async () => {
    const current = enterClone("dot-failed");

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

  it("writes .env with a random Payload secret for the turborepo stack", async () => {
    await create(["my-workspace", "--stack", "turborepo"]);

    const environment = readFileSync(path.join(cwd, "my-workspace", ".env"), "utf8");

    expect(environment).toMatch(/^PAYLOAD_SECRET=[\da-f]{64}$/mu);
    expect(environment).toContain("APP_URL=http://localhost:3001");

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd my-workspace\n  pnpm dev\nSet DATABASE_URL in .env to your PostgreSQL database before pnpm dev.\nBefore the first commit, follow "After creating a project from this template" in my-workspace/README.md.`,
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

  it("lists no git init for --skip-git in a directory that holds .git", async () => {
    enterClone("dot-skip-git");
    await create([".", "--stack", "nodejs", "--skip-git", "--skip-install"]);
    expect(vi.mocked(initGit)).not.toHaveBeenCalled();

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  pnpm install\n${nextStepsTail} README.md.`,
    );
  });

  it("keeps the project and exits with 1 when pnpm install fails", async () => {
    vi.mocked(didInstallDependencies).mockReturnValueOnce(false);
    await create(["offline-api", "--stack", "nestjs"]);
    expect(existsSync(path.join(cwd, "offline-api", packageManifest))).toBe(true);

    expect(vi.mocked(log.error)).toHaveBeenCalledWith(
      expect.stringMatching(/^pnpm install failed.*package\.json#engines\.$/u),
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

    expect(vi.mocked(log.warn)).toHaveBeenCalledWith(
      expect.stringMatching(/^git init failed\. Check that Git 2\.28/u),
    );

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      `Next steps:\n  cd no-git-api\n  git init --initial-branch=main\n  pnpm install\n${nextStepsTail} no-git-api/README.md.`,
    );
  });
});
