import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";

type Change = {
  paths: string[];
  status: string;
};

type SelfTestCase = {
  addedChangesets?: Record<string, string>;
  changes: Change[];
  expectedMessagePart?: string;
  name: string;
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

const changesetFile = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;
const stackManifest = /^templates\/(?!base\/)[^/]+\/package\.json$/;

const noChangesetPrefixes = [
  ".agents/",
  ".claude/",
  ".cursor/",
  ".github/",
  "intent/",
  "scripts/",
  "test/",
];

const noChangesetPatterns = [
  /\.md$/,
  /^templates\/.*\/\.(?:agents|claude|cursor)\//,
  /^templates\/.*\/\.github\/ISSUE_TEMPLATE\//,
  /^templates\/.*\/scripts\/check-(?:agent-gates|human-gates|intent)\.ts$/,
];

/**
 * Tell whether a changed path never needs a changeset, as `.changeset/README.md` lists.
 * @param changedPath Path from the project root.
 * @returns True when the path needs no changeset.
 */
function isExemptFromChangeset(changedPath: string): boolean {
  return (
    noChangesetPrefixes.some(prefix => changedPath.startsWith(prefix)) ||
    noChangesetPatterns.some(pattern => pattern.test(changedPath))
  );
}

/**
 * Tell whether the diff changes a CLI argument, a prompt, or a stack, or removes or renames a stack's directory.
 * @param changes Changed paths with their git status.
 * @returns True when a major release can be justified.
 */
function hasCliContractChange(changes: Change[]): boolean {
  return changes.some(
    ({paths, status}) =>
      paths.some(changedPath => [argumentsFile, promptsFile, stacksFile].includes(changedPath)) ||
      (/^[DR]/.test(status) &&
        paths.slice(0, 1).some(changedPath => stackManifest.test(changedPath))),
  );
}

/**
 * Find the problems a branch's changes have with the changesets it adds.
 * @param changes Changed paths with their git status.
 * @param addedChangesets Text of each `.changeset/*.md` file the branch adds, by path.
 * @returns One message per problem; empty when the branch is fine.
 */
function findChangesetProblems(
  changes: Change[],
  addedChangesets: Record<string, string>,
): string[] {
  const addedPaths = Object.keys(addedChangesets);

  if (addedPaths.length === 0) {
    return [];
  }

  if (addedPaths.length > 1) {
    return [
      `this branch adds ${addedPaths.length} changesets (${addedPaths.join(", ")}); one piece of work makes one release, so edit the existing changeset and delete the others`,
    ];
  }

  const [addedPath = ""] = addedPaths;

  const otherPaths = changes
    .flatMap(({paths}) => paths)
    .filter(changedPath => changedPath !== addedPath);

  const problems: string[] = [];

  if (otherPaths.every(otherPath => isExemptFromChangeset(otherPath))) {
    problems.push(
      `${addedPath} is a changeset, but every other change on this branch needs none (see .changeset/README.md); delete it`,
    );
  }

  if (majorDeclaration.test(addedChangesets[addedPath] ?? "") && !hasCliContractChange(changes)) {
    problems.push(
      `${addedPath} declares major, but major is only for a removed or renamed CLI argument, prompt, or stack, and needs the product owner's agreement first; this branch changes none of ${argumentsFile}, ${promptsFile}, ${stacksFile}, or a stack directory under templates/`,
    );
  }

  return problems;
}

/**
 * Parse `git diff --name-status` output.
 * @param output Tab-separated status lines.
 * @returns One change per line.
 */
function parseNameStatus(output: string): Change[] {
  return output
    .split("\n")
    .filter(line => line !== "")
    .map(line => {
      const [status = "", ...paths] = line.split("\t");

      return {
        paths,
        status,
      };
    });
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
 * @returns The change.
 */
function changeOf(status: string, changedPath: string): Change {
  return {
    status,
    paths: [changedPath],
  };
}

const addedFile = (changedPath: string): Change => changeOf("A", changedPath);
const modifiedFile = (changedPath: string): Change => changeOf("M", changedPath);
const minorChangesetPath = ".changeset/quiet-owls-sing.md";
const majorChangesetPath = ".changeset/loud-owls-sing.md";

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

const templateOnlyChanges = [
  addedFile(majorChangesetPath),
  modifiedFile("templates/nestjs/src/main.ts"),
];

const selfTestCases: SelfTestCase[] = [
  {
    name: "no changeset",
    changes: [modifiedFile(".agents/skills/sdlc/SKILL.md")],
  },
  {
    addedChangesets: minorChangeset,
    name: "one changeset with a src change",
    changes: [addedFile(minorChangesetPath), modifiedFile("src/setup.ts")],
  },
  {
    name: "two changesets",
    expectedMessagePart: "edit the existing changeset",
    changes: [
      addedFile(minorChangesetPath),
      addedFile(majorChangesetPath),
      modifiedFile("src/setup.ts"),
    ],
    addedChangesets: {
      ...minorChangeset,
      ...majorChangeset,
    },
  },
  {
    addedChangesets: minorChangeset,
    name: "changeset with only agent instruction paths",
    expectedMessagePart: "needs none",
    changes: [
      addedFile(minorChangesetPath),
      modifiedFile(".agents/skills/sdlc/SKILL.md"),
      modifiedFile("templates/base/.claude/skills/sdlc/SKILL.md"),
      modifiedFile("AGENTS.md"),
      modifiedFile("templates/base/SETUP.md"),
    ],
  },
  {
    addedChangesets: majorChangeset,
    changes: templateOnlyChanges,
    name: "major with only template content changes",
    expectedMessagePart: "only for a removed or renamed CLI argument",
  },
  ...[
    ["two spaces", `"${packageName}":  major`],
    ["single quotes", `'${packageName}': 'major'`],
    ["no quotes", `${packageName}: major`],
  ].map(([spelling = "", declaration = ""]) => ({
    changes: templateOnlyChanges,
    expectedMessagePart: "only for a removed or renamed CLI argument",
    addedChangesets: majorChangesetOf(declaration),
    name: `major written with ${spelling} and only template content changes`,
  })),
  {
    addedChangesets: minorChangeset,
    name: "changeset with a template script that is not an agent check",
    changes: [
      addedFile(minorChangesetPath),
      modifiedFile("templates/nestjs/scripts/check-health.ts"),
    ],
  },
  {
    addedChangesets: minorChangeset,
    name: "changeset with only a template agent check script",
    expectedMessagePart: "needs none",
    changes: [
      addedFile(minorChangesetPath),
      modifiedFile("templates/base/scripts/check-intent.ts"),
    ],
  },
  {
    addedChangesets: majorChangeset,
    name: "major with src/stacks.ts changed",
    changes: [addedFile(majorChangesetPath), modifiedFile(stacksFile)],
  },
  {
    addedChangesets: majorChangeset,
    name: "major with a stack directory removed",
    changes: [
      addedFile(majorChangesetPath),
      {
        status: "D",
        paths: ["templates/nestjs/package.json"],
      },
    ],
  },
];

const selfTestFailures = selfTestCases
  .filter(({changes, expectedMessagePart, addedChangesets = {}}) => {
    const problems = findChangesetProblems(changes, addedChangesets);

    return expectedMessagePart === undefined
      ? problems.length > 0
      : problems.every(problem => !problem.includes(expectedMessagePart));
  })
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
    const changes = parseNameStatus(runGit(["diff", "--name-status", `${mergeBase}...HEAD`]));

    const addedChangesets = Object.fromEntries(
      changes
        .filter(({paths, status}) => status === "A" && changesetFile.test(paths.at(0) ?? ""))
        .map(({paths}) => paths.at(0) ?? "")
        .map(changedPath => [changedPath, readFileSync(changedPath, "utf8")]),
    );

    const problems = findChangesetProblems(changes, addedChangesets);

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
