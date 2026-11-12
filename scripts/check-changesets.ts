import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";

type Change = {
  paths: string[];
  removedLines: number;
  status: string;
};

type SelfTestCase = {
  addedChangesets?: Record<string, string>;
  authors?: string[];
  changedManifestFields?: string[];
  changes: Change[];
  expectedMessagePart?: string;
  name: string;
  pullRequestAuthor?: string;
};

const defaultBranch = "origin/main";
const argumentsFile = "src/arguments.ts";
const promptsFile = "src/create.ts";
const stacksFile = "src/stacks.ts";
const {name: packageName} = JSON.parse(readFileSync("package.json", "utf8")) as {name: string};
const escapedPackageName = packageName.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);

const majorDeclaration = new RegExp(
  String.raw`^\s*(["']?)` + escapedPackageName + String.raw`\1\s*:\s*(["']?)major\2\s*$`,
  "m",
);

const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/;
const changesetFile = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;
const stackManifest = /^templates\/(?!base\/)[^/]+\/package\.json$/;
const publishedPrefixes = ["src/", "templates/"];
const manifestFile = "package.json";

const publishedManifestFields = [
  "bin",
  "dependencies",
  "engines",
  "exports",
  "files",
  "name",
  "optionalDependencies",
  "peerDependencies",
  "type",
];

const breakingManifestFields = new Set(["bin", "engines", "name"]);
const dependencyBot = "dependabot[bot]";
const dependencyBotAuthor = `${dependencyBot} <49699333+dependabot[bot]@users.noreply.github.com>`;
const templateManifest = "templates/nestjs/package.json";
const contractMessagePart = "only for a removed or renamed CLI argument";

const dependencyFile =
  /(?:(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|Dockerfile|\.nvmrc)(?: \(.*)?|\/\.github\/workflows\/[^/]+\.ya?ml)$/;

/**
 * Tell whether a changed path is part of what the package publishes: the CLI source or a template.
 * @param changedPath Path from the project root.
 * @returns True when a change to the path reaches a person who runs the CLI.
 */
function isPublished(changedPath: string): boolean {
  return publishedPrefixes.some(prefix => changedPath.startsWith(prefix));
}

/**
 * Tell whether the diff removes lines from the CLI argument, prompt, or stack source, removes a stack's directory, or changes the command name or the Node.js versions the CLI runs on.
 * @param changes Changed paths with their git status.
 * @param changedManifestFields Published `package.json` fields the branch changes.
 * @returns True when a major release can be justified.
 */
function hasCliContractChange(changes: Change[], changedManifestFields: string[]): boolean {
  return (
    changedManifestFields.some(field => breakingManifestFields.has(field)) ||
    changes.some(
      ({paths, removedLines, status}) =>
        (removedLines > 0 &&
          paths.some(changedPath =>
            [argumentsFile, promptsFile, stacksFile].includes(changedPath),
          )) ||
        (status.startsWith("D") && paths.some(changedPath => stackManifest.test(changedPath))),
    )
  );
}

/**
 * Tell whether the dependency bot wrote a branch.
 * @param authors The author of each commit on the branch that is not a merge, as `name <email>`.
 * @param pullRequestAuthor The account that opened the pull request, or undefined outside a pull request run.
 * @returns True when every author is the bot and no other account opened the pull request.
 */
function isDependencyBotBranch(authors: string[], pullRequestAuthor: string | undefined): boolean {
  const isBotPullRequest = pullRequestAuthor === undefined || pullRequestAuthor === dependencyBot;

  return (
    isBotPullRequest &&
    authors.length > 0 &&
    authors.every(author => author === dependencyBotAuthor)
  );
}

/**
 * Find the problems a branch's changes have with the changesets it adds.
 * @param changes Changed paths with their git status.
 * @param addedChangesets Text of each changeset the branch adds, by path.
 * @param isBotBranch Whether the dependency bot wrote the branch.
 * @param changedManifestFields Published `package.json` fields the branch changes.
 * @returns One message per problem.
 */
function findChangesetProblems(
  changes: Change[],
  addedChangesets: Record<string, string>,
  isBotBranch: boolean,
  changedManifestFields: string[],
): string[] {
  const addedPaths = Object.keys(addedChangesets);

  const publishedPaths = [
    ...changes.flatMap(({paths}) => paths).filter(changedPath => isPublished(changedPath)),
    ...changedManifestFields.map(field => `${manifestFile} (${field})`),
  ];

  if (addedPaths.length === 0) {
    const isDependencyUpdate =
      isBotBranch && publishedPaths.every(publishedPath => dependencyFile.test(publishedPath));

    return isDependencyUpdate || publishedPaths.length === 0
      ? []
      : [
          `this branch changes ${publishedPaths.length} published files or package.json fields (first: ${publishedPaths.at(0) ?? ""}) and adds no changeset; run "pnpm changeset" (see .changeset/README.md)`,
        ];
  }

  const problems: string[] = [];

  if (publishedPaths.length === 0) {
    problems.push(
      `${addedPaths.join(", ")} would release a version, but this branch changes nothing the package publishes (see .changeset/README.md); delete it`,
    );
  }

  const majorPaths = addedPaths.filter(addedPath =>
    majorDeclaration.test(frontMatter.exec(addedChangesets[addedPath] ?? "")?.at(1) ?? ""),
  );

  if (majorPaths.length > 0 && !hasCliContractChange(changes, changedManifestFields)) {
    problems.push(
      `${majorPaths.join(", ")} declares major, but major is only for a removed or renamed CLI argument, prompt, stack, or command, or a raised Node.js requirement, and needs the product owner's agreement first; this branch changes none of ${argumentsFile}, ${promptsFile}, ${stacksFile}, a stack directory under templates/, or the bin, engines, or name field of ${manifestFile}`,
    );
  }

  return problems;
}

/**
 * Parse `git diff --name-status` output.
 * @param output Tab-separated status lines.
 * @param removedLinesByPath Removed lines by path, from `git diff --numstat`.
 * @returns One change per line.
 */
function parseNameStatus(output: string, removedLinesByPath: Map<string, number>): Change[] {
  return output
    .split("\n")
    .filter(line => line !== "")
    .map(line => {
      const [status = "", ...paths] = line.split("\t");

      return {
        paths,
        status,
        removedLines: paths.reduce(
          (sum, changedPath) => sum + (removedLinesByPath.get(changedPath) ?? 0),
          0,
        ),
      };
    });
}

/**
 * Parse `git diff --numstat` output.
 * @param output Tab-separated lines of added lines, removed lines, and path.
 * @returns The number of removed lines by path; a binary file counts zero.
 */
function parseRemovedLines(output: string): Map<string, number> {
  return new Map(
    output
      .split("\n")
      .filter(line => line !== "")
      .map(line => {
        const [, removed = "", changedPath = ""] = line.split("\t", 3);

        return [changedPath, Number(removed) || 0];
      }),
  );
}

/**
 * Run git in the current directory.
 * @param gitArguments Arguments after `git`.
 * @returns Trimmed standard output.
 */
function runGit(gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Find the published `package.json` fields that differ between a commit and the working tree.
 * @param baseCommit Commit to compare with.
 * @returns Names of the changed fields.
 */
function findChangedManifestFields(baseCommit: string): string[] {
  const before = JSON.parse(runGit(["show", `${baseCommit}:${manifestFile}`])) as Record<
    string,
    unknown
  >;

  const after = JSON.parse(runGit(["show", `HEAD:${manifestFile}`])) as Record<string, unknown>;

  return publishedManifestFields.filter(
    field => JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  );
}

/**
 * Read the account that opened the pull request from the event of this workflow run.
 * @returns The login, or undefined when the run has no pull request event.
 */
function readPullRequestAuthor(): string | undefined {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (eventPath === undefined || !existsSync(eventPath)) {
    return undefined;
  }

  const event = JSON.parse(readFileSync(eventPath, "utf8")) as {
    pull_request?: {user?: {login?: string}};
  };

  return event.pull_request?.user?.login;
}

/**
 * Find the commit where this branch left the default branch.
 * @returns The merge base, or undefined when the default branch is not available.
 */
function findMergeBase(): string | undefined {
  try {
    return runGit(["merge-base", "HEAD", defaultBranch]);
  } catch {
    return undefined;
  }
}

/**
 * Build a self-test change for one path.
 * @param status Git status letter.
 * @param changedPath Path from the project root.
 * @param removedLines Lines the change removes.
 * @returns The change.
 */
function changeOf(status: string, changedPath: string, removedLines = 0): Change {
  return {
    status,
    removedLines,
    paths: [changedPath],
  };
}

const addedFile = (changedPath: string): Change => changeOf("A", changedPath);

/**
 * Build a self-test change that modifies one path.
 * @param changedPath Path from the project root.
 * @param removedLines Lines the change removes.
 * @returns The change.
 */
function modifiedFile(changedPath: string, removedLines = 0): Change {
  return changeOf("M", changedPath, removedLines);
}

const minorChangesetPath = ".changeset/quiet-owls-sing.md";
const majorChangesetPath = ".changeset/loud-owls-sing.md";
const patchChangesetPath = ".changeset/calm-owls-sing.md";
const missingChangesetMessagePart = "adds no changeset";
const sourceFile = "src/setup.ts";

const patchChangeset = {
  [patchChangesetPath]: '---\n"@next-friday/create-app": patch\n---\n\nNote.\n',
};

const minorChangeset = {
  [minorChangesetPath]: '---\n"@next-friday/create-app": minor\n---\n\nNote.\n',
};

/**
 * Build the text of a self-test changeset around one front matter line.
 * @param declaration The front matter line.
 * @returns The changeset text by its path.
 */
function majorChangesetOf(declaration: string): Record<string, string> {
  return {
    [majorChangesetPath]: `---\n${declaration}\n---\n\nNote.\n`,
  };
}

const majorChangeset = majorChangesetOf(`"${packageName}": major`);

const minorChangesetWithMajorBody = {
  [minorChangesetPath]: `---\n"${packageName}": minor\n---\n\n"${packageName}": major\n`,
};

const templateOnlyChanges = [
  addedFile(majorChangesetPath),
  modifiedFile("templates/nestjs/src/main.ts"),
];

const selfTestCases: SelfTestCase[] = [
  {
    name: "no changeset and nothing published changed",
    changes: [
      modifiedFile("plugins/friday/source/skills/sdlc/SKILL.md"),
      modifiedFile("AGENTS.md"),
    ],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    name: "no changeset with a template change",
    changes: [modifiedFile("templates/base/SETUP.md")],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    name: "no changeset with a src change",
    changes: [modifiedFile(sourceFile)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    pullRequestAuthor: dependencyBot,
    name: "no changeset on a dependency bot's commit that changes source",
    authors: [dependencyBotAuthor],
    changes: [modifiedFile(sourceFile)],
  },
  {
    pullRequestAuthor: dependencyBot,
    name: "no changeset on a dependency bot's template update",
    authors: [dependencyBotAuthor],
    changes: [modifiedFile(templateManifest)],
  },
  {
    name: "no changeset on a dependency bot's commits outside a pull request run",
    authors: [dependencyBotAuthor],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    pullRequestAuthor: dependencyBot,
    name: "no changeset on a dependency bot's branch with a person's commit",
    authors: [dependencyBotAuthor, "someone <someone@example.com>"],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    name: "no changeset on a person's pull request whose commits carry the bot's name",
    pullRequestAuthor: "someone",
    authors: [dependencyBotAuthor],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    pullRequestAuthor: dependencyBot,
    name: "no changeset on a commit with the bot's name and another email",
    authors: [`${dependencyBot} <someone@example.com>`],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    pullRequestAuthor: dependencyBot,
    name: "no changeset on a template update with no commit author",
    authors: [],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    name: "no changeset on a template update by another account",
    pullRequestAuthor: "someone",
    authors: ["someone <someone@example.com>"],
    changes: [modifiedFile(templateManifest)],
  },
  {
    expectedMessagePart: missingChangesetMessagePart,
    name: "no changeset with a changed CLI dependency",
    changedManifestFields: ["dependencies"],
    changes: [modifiedFile(manifestFile)],
  },
  {
    name: "no changeset with only a changed package.json script",
    changes: [modifiedFile(manifestFile)],
  },
  {
    addedChangesets: majorChangeset,
    name: "major with the engines field changed",
    changedManifestFields: ["engines"],
    changes: [addedFile(majorChangesetPath), modifiedFile(manifestFile)],
  },
  {
    addedChangesets: minorChangeset,
    name: "one changeset with a src change",
    changes: [addedFile(minorChangesetPath), modifiedFile(sourceFile)],
  },
  {
    name: "two changesets with a template change",
    changes: [
      addedFile(minorChangesetPath),
      addedFile(patchChangesetPath),
      modifiedFile("templates/base/SETUP.md"),
    ],
    addedChangesets: {
      ...minorChangeset,
      ...patchChangeset,
    },
  },
  {
    addedChangesets: minorChangeset,
    name: "changeset with nothing published changed",
    expectedMessagePart: "would release a version",
    changes: [
      addedFile(minorChangesetPath),
      modifiedFile("plugins/friday/source/skills/sdlc/SKILL.md"),
      modifiedFile("AGENTS.md"),
      modifiedFile("scripts/sync-plugin.ts"),
    ],
  },
  {
    addedChangesets: majorChangeset,
    changes: templateOnlyChanges,
    expectedMessagePart: contractMessagePart,
    name: "major with only template content changes",
  },
  ...[
    ["two spaces", `"${packageName}":  major`],
    ["single quotes", `'${packageName}': 'major'`],
    ["no quotes", `${packageName}: major`],
  ].map(([spelling = "", declaration = ""]) => ({
    changes: templateOnlyChanges,
    expectedMessagePart: contractMessagePart,
    addedChangesets: majorChangesetOf(declaration),
    name: `major written with ${spelling} and only template content changes`,
  })),
  {
    addedChangesets: majorChangeset,
    name: "major with lines removed from src/stacks.ts",
    changes: [addedFile(majorChangesetPath), modifiedFile(stacksFile, 1)],
  },
  {
    addedChangesets: majorChangeset,
    expectedMessagePart: contractMessagePart,
    name: "major with only lines added to src/stacks.ts",
    changes: [addedFile(majorChangesetPath), modifiedFile(stacksFile)],
  },
  {
    addedChangesets: minorChangesetWithMajorBody,
    name: "a major declaration in the body of a minor changeset",
    changes: [addedFile(minorChangesetPath), modifiedFile(sourceFile)],
  },
  {
    addedChangesets: majorChangeset,
    name: "major with a stack directory removed",
    changes: [addedFile(majorChangesetPath), changeOf("D", templateManifest)],
  },
];

const selfTestFailures = selfTestCases
  .filter(
    ({
      changes,
      expectedMessagePart,
      pullRequestAuthor,
      authors = [],
      changedManifestFields = [],
      addedChangesets = {},
    }) => {
      const problems = findChangesetProblems(
        changes,
        addedChangesets,
        isDependencyBotBranch(authors, pullRequestAuthor),
        changedManifestFields,
      );

      return expectedMessagePart === undefined
        ? problems.length > 0
        : problems.every(problem => !problem.includes(expectedMessagePart));
    },
  )
  .map(({name}) => name);

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Changeset self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const mergeBase = findMergeBase();

  if (mergeBase === undefined) {
    process.stderr.write(`Cannot find ${defaultBranch}; run "git fetch origin main" first.\n`);
    process.exitCode = 1;
  } else {
    const changes = parseNameStatus(
      runGit(["diff", "--no-renames", "--name-status", `${mergeBase}...HEAD`]),
      parseRemovedLines(runGit(["diff", "--no-renames", "--numstat", `${mergeBase}...HEAD`])),
    );

    const addedChangesets = Object.fromEntries(
      changes
        .filter(({paths, status}) => /^[AM]/.test(status) && changesetFile.test(paths.at(0) ?? ""))
        .map(({paths}) => paths.at(0) ?? "")
        .map(changedPath => [changedPath, runGit(["show", `HEAD:${changedPath}`])]),
    );

    const problems = findChangesetProblems(
      changes,
      addedChangesets,
      isDependencyBotBranch(
        runGit(["log", "--no-merges", "--format=%an <%ae>", `${mergeBase}..HEAD`])
          .split("\n")
          .filter(author => author !== ""),
        readPullRequestAuthor(),
      ),
      findChangedManifestFields(mergeBase),
    );

    if (problems.length > 0) {
      process.stderr.write(`${problems.join("\n")}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `Checked ${Object.keys(addedChangesets).length} added changesets against ${defaultBranch}.\n`,
      );
    }
  }
}
