import {existsSync} from "node:fs";
import path from "node:path";
import {randomBytes} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";

export type GitResult = "existing" | "failed" | "initialized" | "parent";

/**
 * Write `.env` from `.env.example`, replacing the `PAYLOAD_SECRET` placeholder with a random secret.
 * @param directory - Project directory.
 */
export async function writeEnvironmentFile(directory: string): Promise<void> {
  const example = await readFile(path.join(directory, ".env.example"), "utf8");
  const secret = randomBytes(32).toString("hex");

  await writeFile(
    path.join(directory, ".env"),
    example.replace(/^PAYLOAD_SECRET=.*$/mu, () => `PAYLOAD_SECRET=${secret}`),
    {
      mode: 0o600,
    },
  );
}

/**
 * Create a Git repository on `main`, which the project's Git hooks expect for the first commit.
 * Leaves an existing repository alone, as a clone or a parent monorepo.
 * @param directory - Project directory.
 * @returns What happened.
 */
export function initGit(directory: string): GitResult {
  if (existsSync(path.join(directory, ".git"))) {
    return "existing";
  }

  const environment = projectGitEnvironment();

  const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: directory,
    env: environment,
    stdio: "ignore",
  });

  if (inside.status === 0) {
    return "parent";
  }

  const init = spawnSync("git", ["init", "--initial-branch=main"], {
    cwd: directory,
    env: environment,
    stdio: "ignore",
  });

  return init.status === 0 ? "initialized" : "failed";
}

/**
 * Run `pnpm install` in the project, showing its output.
 * @param directory - Project directory.
 * @returns Whether the install succeeded.
 */
export function didInstallDependencies(directory: string): boolean {
  const result = spawnSync("pnpm install", {
    cwd: directory,
    stdio: "inherit",
    shell: true,
    env: projectGitEnvironment(),
  });

  return result.status === 0;
}

/**
 * The environment without the repository variables that `git rev-parse --local-env-vars` lists.
 * An inherited `GIT_DIR`, as Git sets for its hooks, would point Git, and the install's Git hook
 * setup, at another repository.
 * @returns Environment for commands that run Git in the project directory.
 */
function projectGitEnvironment(): NodeJS.ProcessEnv {
  const localVariables = new Set(
    spawnSync("git", ["rev-parse", "--local-env-vars"], {
      encoding: "utf8",
    }).stdout?.split("\n"),
  );

  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !localVariables.has(name)),
  );
}
