import {parseArgs} from "node:util";

import {deployTargets, isDeployTarget} from "./deploy-targets.ts";
import {isStackId, stacks} from "./stacks.ts";
import type {DeployTarget} from "./deploy-targets.ts";
import type {StackId} from "./stacks.ts";

export interface CliOptions {
  deploy: DeployTarget;
  help: boolean;
  name?: string;
  skipGit: boolean;
  skipInstall: boolean;
  stack?: StackId;
  version: boolean;
}

export const usage = `Usage: pnpm create @next-friday/app [name] [--stack ${stacks.map(stack => stack.id).join("|")}] [--deploy ${deployTargets.join("|")}]

  name            Project directory and package name, or . for the current directory. Asked when left out.
  --stack         Template stack. Asked when left out.
  --deploy        Deploy target: ${deployTargets.join(" or ")}. The default is none.
  --skip-git      Do not run git init.
  --skip-install  Do not run pnpm install.
  -v, --version   Show the version.
  -h, --help      Show this help.`;

/**
 * Parse the command-line arguments. Options left out are asked interactively.
 * @param cliArguments - Arguments after the executable and script path.
 * @returns The project name, stack, and flags.
 */
export function parseCliArguments(cliArguments: string[]): CliOptions {
  const {positionals, values} = parseArgs({
    args: cliArguments,
    allowPositionals: true,
    options: {
      stack: {
        type: "string",
      },
      deploy: {
        type: "string",
        default: "none",
      },
      "skip-git": {
        type: "boolean",
        default: false,
      },
      "skip-install": {
        type: "boolean",
        default: false,
      },
      version: {
        type: "boolean",
        short: "v",
        default: false,
      },
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
    },
  });

  const {deploy, help, stack, version} = values;
  const isInformational = help || version;

  if (!isInformational && positionals.length > 1) {
    throw new Error(`Pass one project name, not ${positionals.length}: ${positionals.join(" ")}.`);
  }

  const [name] = positionals;

  if (!isInformational) {
    assertKnownChoices(stack, deploy);
  }

  return {
    help,
    name,
    version,
    deploy: isDeployTarget(deploy) ? deploy : "none",
    stack: stack !== undefined && isStackId(stack) ? stack : undefined,
    skipGit: values["skip-git"],
    skipInstall: values["skip-install"],
  };
}

/**
 * Throw when the stack or the deploy target is not one the CLI supports.
 * @param stack - Stack from the command line, or `undefined` when left out.
 * @param deploy - Deploy target from the command line.
 */
function assertKnownChoices(stack: string | undefined, deploy: string): void {
  if (stack !== undefined && !isStackId(stack)) {
    const ids = stacks.map(supported => supported.id).join(", ");

    throw new Error(`Unknown stack "${stack}". Use one of: ${ids}.`);
  }

  if (!isDeployTarget(deploy)) {
    throw new Error(`Unknown deploy target "${deploy}". Use one of: ${deployTargets.join(", ")}.`);
  }
}
