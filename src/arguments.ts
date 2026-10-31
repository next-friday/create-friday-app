import {parseArgs} from "node:util";

import {isStackId, stacks} from "./stacks.ts";
import type {StackId} from "./stacks.ts";

export interface CliOptions {
  help: boolean;
  name?: string;
  skipGit: boolean;
  skipInstall: boolean;
  stack?: StackId;
  version: boolean;
}

export const usage = `Usage: pnpm create @next-friday/app [name] [--stack nodejs|nestjs|nextjs|payload|turborepo]

  name            Project directory and package name, or . for the current directory. Asked when left out.
  --stack         Template stack. Asked when left out.
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

  if (positionals.length > 1) {
    throw new Error(`Pass one project name, not ${positionals.length}: ${positionals.join(" ")}.`);
  }

  const [name] = positionals;
  const {help, stack, version} = values;

  if (stack !== undefined && !isStackId(stack)) {
    const ids = stacks.map(supported => supported.id).join(", ");

    throw new Error(`Unknown stack "${stack}". Use one of: ${ids}.`);
  }

  return {
    help,
    name,
    stack,
    version,
    skipGit: values["skip-git"],
    skipInstall: values["skip-install"],
  };
}
