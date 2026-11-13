import {cancel, intro, isCancel, log, outro, select, text} from "@clack/prompts";
import {chmod, cp, readFile, rename, writeFile} from "node:fs/promises";
import {existsSync, readdirSync, readFileSync, realpathSync, rmSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

import {didInstallDependencies, initGit, writeEnvironmentFile} from "./setup.ts";
import {listProjectFiles} from "./project-files.ts";
import {packageName, validateProjectName} from "./project-name.ts";
import {parseCliArguments, usage} from "./arguments.ts";
import {renameProject} from "./rename.ts";
import {resolveDeploySections} from "./deploy-sections.ts";
import {stackById, stacks, templateName} from "./stacks.ts";
import type {CliOptions} from "./arguments.ts";
import type {DeployTarget} from "./deploy-targets.ts";
import type {GitResult} from "./setup.ts";
import type {StackId} from "./stacks.ts";

const templatesDirectory = fileURLToPath(new URL("../templates", import.meta.url));
const interruptSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

class CancelledError extends Error {
  override message = "Cancelled.";
}

/**
 * Copy the chosen template into a new project directory.
 * @param cliArguments - Arguments after the executable and script path.
 */
export async function create(cliArguments: string[]): Promise<void> {
  try {
    const cwd = process.cwd();
    const options = parseCliArguments(cliArguments);

    if (options.help) {
      process.stdout.write(`${usage}\n`);

      return;
    }

    if (options.version) {
      process.stdout.write(`${packageVersion()}\n`);

      return;
    }

    const {name, stack} = await resolveProject(options, cwd);
    const manifestName = packageName(name, cwd);
    const target = path.resolve(cwd, name);
    const directory = existsSync(target) ? realpathSync(target) : target;

    log.step(`Copying the ${stack} template.`);
    await writeProject(stack, options.deploy, directory, manifestName);
    log.success(`Created ${manifestName} from the ${stack} template.`);

    const {git, isInstalled} = setUpProject(directory, options);

    outro(nextSteps(name, stack, git, isInstalled));
  } catch (error) {
    if (error instanceof CancelledError) {
      cancel(error.message);
      process.exitCode = 130;
    } else {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  }
}

/**
 * Copy, rename, and write `.env`, removing what was written when a step fails or Ctrl+C, SIGTERM, or SIGHUP arrives.
 * An interrupt waits for the running step, so the removal does not race the copy.
 * @param stack - Supported stack id.
 * @param deploy - Supported deploy target.
 * @param directory - Project directory.
 * @param manifestName - Package name for `package.json`.
 */
async function writeProject(
  stack: StackId,
  deploy: DeployTarget,
  directory: string,
  manifestName: string,
): Promise<void> {
  const kept = existsSync(directory) ? readdirSync(directory) : undefined;
  let isInterrupted = false;

  const interrupt = (): void => {
    isInterrupted = true;
  };

  for (const signal of interruptSignals) {
    process.on(signal, interrupt);
  }

  try {
    await copyTemplate(stack, deploy, directory);
    await renameProject(directory, templateName(stack), manifestName);
    await writeEnvironmentFile(directory);

    if (isInterrupted) {
      throw new CancelledError();
    }
  } catch (error) {
    removeProject(directory, kept);

    throw isInterrupted ? new CancelledError() : error;
  } finally {
    for (const signal of interruptSignals) {
      process.off(signal, interrupt);
    }
  }
}

/**
 * Take the project name and stack from the options, asking for any left out.
 * @param options - Parsed command-line options.
 * @param cwd - Directory the project is created in.
 * @returns A valid project name and the stack.
 */
async function resolveProject(
  options: CliOptions,
  cwd: string,
): Promise<{name: string; stack: StackId}> {
  if (!process.stdin.isTTY && (options.name === undefined || options.stack === undefined)) {
    throw new Error(`Pass the project name and --stack when not running in a terminal.\n${usage}`);
  }

  if (options.name !== undefined) {
    assertUsableName(options.name, cwd);
  }

  intro("Create a Next Friday project");

  const name = options.name ?? (await askName(cwd));
  const stack = options.stack ?? (await askStack());

  assertUsableName(name, cwd);

  return {
    name,
    stack,
  };
}

/**
 * Throw when the project name is unusable or its directory is taken, as a prompt may have left a
 * directory in place since the name was checked.
 * @param name - Project name, or `.` for the current directory.
 * @param cwd - Directory the project is created in.
 */
function assertUsableName(name: string, cwd: string): void {
  const nameError = validateProjectName(name, cwd);

  if (nameError !== undefined) {
    throw new Error(nameError);
  }
}

const gitWarnings: Partial<Record<GitResult, string>> = {
  failed:
    "git init failed. Check that Git 2.28 or later is installed and the directory is writable, then run the steps below.",
  parent:
    "Skipped git init inside an existing Git repository. The Git hooks install only at a repository root.",
};

/**
 * Run `git init` and then `pnpm install`, so the install sets up the Git hooks.
 * @param directory - Project directory.
 * @param options - Parsed command-line options.
 * @returns The `git init` result, or `undefined` when skipped, and whether the install succeeded.
 */
function setUpProject(
  directory: string,
  options: CliOptions,
): {git: GitResult | undefined; isInstalled: boolean} {
  const git = options.skipGit ? existingGit(directory) : initGit(directory);
  const warning = git === undefined ? undefined : gitWarnings[git];

  if (warning !== undefined) {
    log.warn(warning);
  }

  if (options.skipInstall) {
    return {
      git,
      isInstalled: false,
    };
  }

  log.step("Installing dependencies with pnpm.");

  const isInstalled = didInstallDependencies(directory);

  if (!isInstalled) {
    log.error(
      "pnpm install failed. Fix the error above, then run the steps below. The project needs pnpm and the Node.js version in package.json#engines.",
    );

    process.exitCode = 1;
  }

  return {
    git,
    isInstalled,
  };
}

/**
 * Report a repository that skipping `git init` leaves in place.
 * @param directory - Project directory.
 * @returns `existing` when the directory holds `.git`, otherwise `undefined`.
 */
function existingGit(directory: string): GitResult | undefined {
  return existsSync(path.join(directory, ".git")) ? "existing" : undefined;
}

/**
 * Copy the shared template files, the stack's files, and the deploy target's files into the project directory.
 * npm leaves `.gitignore` out of published packages, so the template keeps it as `_gitignore`.
 * @param stack - Supported stack id.
 * @param deploy - Supported deploy target.
 * @param directory - Project directory.
 */
async function copyTemplate(
  stack: StackId,
  deploy: DeployTarget,
  directory: string,
): Promise<void> {
  const deployLayer = deploy === "none" ? undefined : `deploy-${deploy}`;
  const required = ["base", stack, ...(deployLayer === undefined ? [] : [`${deployLayer}/base`])];

  for (const template of required) {
    if (!existsSync(path.join(templatesDirectory, template))) {
      throw new Error(
        `The ${template} template is missing from ${templatesDirectory}. Reinstall @next-friday/create-app.`,
      );
    }
  }

  const copyLayer = async (layer: string): Promise<void> => {
    await cp(path.join(templatesDirectory, layer), directory, {
      recursive: true,
    });
  };

  await copyLayer("base");
  await copyLayer(stack);

  if (deployLayer !== undefined) {
    await copyLayer(`${deployLayer}/base`);

    if (existsSync(path.join(templatesDirectory, deployLayer, stack))) {
      await copyLayer(`${deployLayer}/${stack}`);
    }
  }

  await rename(path.join(directory, "_gitignore"), path.join(directory, ".gitignore"));
  await resolveDeployTarget(directory, deploy);
  await markScriptsExecutable(directory);
}

/**
 * Resolve the deploy target sections of every copied file that holds a marker.
 * @param directory - Project directory.
 * @param deploy - Supported deploy target.
 */
async function resolveDeployTarget(directory: string, deploy: DeployTarget): Promise<void> {
  const files = await listProjectFiles(directory);

  await Promise.all(
    files.map(async file => {
      const content = await readFile(file);

      if (!content.includes("deploy:")) {
        return;
      }

      const template = content.toString();
      const resolved = resolveDeploySections(template, deploy);

      if (resolved !== template) {
        await writeFile(file, resolved);
      }
    }),
  );
}

/**
 * Make every file that starts with a shebang executable. `pnpm pack` drops the executable bit,
 * and the Git and agent hooks run these scripts directly.
 * @param directory - Project directory.
 */
async function markScriptsExecutable(directory: string): Promise<void> {
  const files = await listProjectFiles(directory);

  await Promise.all(
    files.map(async file => {
      const content = await readFile(file);

      if (content.subarray(0, 2).toString() === "#!") {
        await chmod(file, 0o755);
      }
    }),
  );
}

/**
 * Remove what this run wrote, leaving the target as it was before.
 * @param directory - Project directory.
 * @param kept - Entries the directory held before the run, or `undefined` when the run created it.
 */
function removeProject(directory: string, kept: string[] | undefined): void {
  const targets =
    kept === undefined
      ? [directory]
      : readdirSync(directory)
          .filter(entry => !kept.includes(entry))
          .map(entry => path.join(directory, entry));

  for (const target of targets) {
    rmSync(target, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * List the commands left to run, skipping what the CLI already did.
 * @param name - Project name, or `.` for the current directory.
 * @param stack - Supported stack id.
 * @param git - Result of `git init`, or `undefined` when skipped.
 * @param isInstalled - Whether `pnpm install` succeeded.
 * @returns The next steps message.
 */
function nextSteps(
  name: string,
  stack: StackId,
  git: GitResult | undefined,
  isInstalled: boolean,
): string {
  const {developmentScript, requiresDatabase} = stackById[stack];
  const hasGit = git !== undefined && git !== "failed";

  const commands = [
    name === "." ? [] : [`cd ${name}`],
    hasGit ? [] : ["git init --initial-branch=main"],
    hasGit && isInstalled ? [] : ["pnpm install"],
    [`pnpm ${developmentScript}`],
  ].flat();

  const database = requiresDatabase
    ? `Set DATABASE_URL in .env to your PostgreSQL database before pnpm ${developmentScript}.\n`
    : "";

  const readme = name === "." ? "README.md" : `${name}/README.md`;
  const lines = commands.map(command => `  ${command}`).join("\n");

  return `Next steps:\n${lines}\n${database}Before the first commit, follow "After creating a project from this template" in ${readme}.`;
}

/**
 * Read this package's version.
 * @returns The version in `package.json`.
 */
function packageVersion(): string {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    version: string;
  };

  return manifest.version;
}

/**
 * Ask for the project name.
 * @param cwd - Directory the project is created in.
 * @returns A valid project name.
 */
async function askName(cwd: string): Promise<string> {
  const name = await text({
    message: "Project name",
    placeholder: "my-app",
    validate: (value = "") => validateProjectName(value, cwd),
  });

  if (isCancel(name)) {
    throw new CancelledError();
  }

  return name;
}

/**
 * Ask which stack to start from.
 * @returns The chosen stack id.
 */
async function askStack(): Promise<StackId> {
  const stack = await select<StackId>({
    message: "Stack",
    options: stacks.map(option => ({
      value: option.id,
      label: option.label,
      hint: option.hint,
    })),
  });

  if (isCancel(stack)) {
    throw new CancelledError();
  }

  return stack;
}
