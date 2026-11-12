import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {execFileSync, spawnSync} from "node:child_process";
import {parse} from "yaml";
import path from "node:path";
import {tmpdir} from "node:os";

const checkKinds = [
  "branch_matches",
  "commit_touches_only",
  "file_exists",
  "file_matches",
  "no_file_changes",
  "no_new_branch",
  "no_new_commits",
  "reply_lacks",
  "reply_matches",
] as const;

const noArgumentKinds = new Set<CheckKind>(["no_file_changes", "no_new_branch", "no_new_commits"]);
const fixtureKinds = ["bare_remote", "branch", "checkout", "commit", "write"] as const;

type CheckKind = (typeof checkKinds)[number];
type FixtureKind = (typeof fixtureKinds)[number];

type Check = {
  argument?: string;
  kind: CheckKind;
  regex?: string;
};

type FixtureStep = {
  content?: string;
  kind: FixtureKind;
  value: string;
};

type EvalCase = {
  checks: Check[];
  fixture?: FixtureStep[];
  hasProseFixture: boolean;
  id: string;
  prompt: string;
  timeoutSeconds: number;
};

type Snapshot = {
  branches: string[];
  commits: string[];
  head: string;
  refs: string[];
  status: string;
};

type Outcome = {
  after: Snapshot;
  before: Snapshot;
  dir: string;
  reply: string;
};

type AgentRun = {
  costUsd?: number;
  problem?: string;
  reply: string;
};

type CaseResult = {
  costUsd?: number;
  failures: string[];
  id: string;
  seconds: number;
  skipReason?: string;
  total: number;
};

const evalsDirectory = path.join(".agents", "skill-evals");

const agentModel =
  process.env.AGENT_EVALS_MODEL === undefined ? "claude-haiku-5-5" : process.env.AGENT_EVALS_MODEL;

const passRateThreshold = 1;
const regexFlags = "mu";
const globCharacters = /[*?[{]/;
const excludedNames = new Set([".git", "node_modules"]);

const allowedTools = [
  "Bash(git:*)",
  "Bash(pnpm:*)",
  "Bash(node:*)",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "Skill",
];

const repositoryVariables = execFileSync("git", ["rev-parse", "--local-env-vars"], {
  encoding: "utf8",
}).split("\n");

const childEnvironment = {
  ...process.env,
};

for (const name of repositoryVariables) {
  delete childEnvironment[name];
}

/**
 * Run git in a directory.
 * @param directory Working directory.
 * @param gitArguments Arguments after `git`.
 * @returns Trimmed standard output.
 */
function runGit(directory: string, gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    cwd: directory,
    env: childEnvironment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Split command output into lines.
 * @param output Command output.
 * @returns The non-empty lines.
 */
function toLines(output: string): string[] {
  return output.split("\n").filter(line => line !== "");
}

/**
 * Commit every change in a directory.
 * @param directory Git working directory.
 * @param message Commit message.
 */
function commitAll(directory: string, message: string): void {
  runGit(directory, ["add", "--all"]);
  runGit(directory, ["commit", "--message", message]);
}

/**
 * Read what git knows about a directory.
 * @param directory Git working directory.
 * @returns Branches, commits, ref tips, the head commit and the porcelain status.
 */
function takeSnapshot(directory: string): Snapshot {
  return {
    branches: toLines(runGit(directory, ["branch", "--format=%(refname:short)"])),
    commits: toLines(runGit(directory, ["rev-list", "--all"])),
    head: runGit(directory, ["rev-parse", "HEAD"]),
    refs: [...new Set(toLines(runGit(directory, ["for-each-ref", "--format=%(objectname)"])))],
    status: runGit(directory, ["status", "--porcelain", "--untracked-files=all"]),
  };
}

/**
 * Turn one entry of a YAML list into a kind and its value.
 * @param entry A string, or an object with one key.
 * @param kinds The kinds the list accepts.
 * @returns The kind and the value of its key, which is true for a bare string.
 */
function splitEntry<Kind extends string>(
  entry: unknown,
  kinds: readonly Kind[],
): {kind: Kind; value: unknown} {
  const fields: Record<string, unknown> =
    typeof entry === "object" && entry !== null
      ? {
          ...entry,
        }
      : {};

  const [kind, value] =
    typeof entry === "string" ? [entry, true] : (Object.entries(fields).at(0) ?? ["", undefined]);

  const matched = kinds.find(candidate => candidate === kind);

  if (matched === undefined) {
    throw new Error(`unknown kind "${kind}"; use one of ${kinds.join(", ")}`);
  }

  return {
    kind: matched,
    value,
  };
}

/**
 * Read a field that must be a string.
 * @param value Parsed YAML value.
 * @param description What the field is, for the message.
 * @returns The string.
 */
function requireString(value: unknown, description: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${description} must be a string`);
  }

  return value;
}

/**
 * Read a field that is an object of strings.
 * @param value Parsed YAML value.
 * @param description What the field is, for the message.
 * @returns The object.
 */
function requireStrings(value: unknown, description: string): Record<string, string> {
  if (typeof value !== "object" || value === null) {
    throw new TypeError(`${description} must be an object`);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key,
      requireString(field, `${description}.${key}`),
    ]),
  );
}

/**
 * Read one entry of `checks:`.
 * @param entry A check kind, or an object with the kind as its only key.
 * @returns The check.
 */
function parseCheck(entry: unknown): Check {
  const {kind, value} = splitEntry(entry, checkKinds);

  if (kind === "file_matches") {
    const fields = requireStrings(value, "file_matches");

    return {
      kind,
      argument: requireString(fields.path, "file_matches.path"),
      regex: requireString(fields.regex, "file_matches.regex"),
    };
  }

  return value === true && noArgumentKinds.has(kind)
    ? {
        kind,
      }
    : {
        kind,
        argument: requireString(value, kind),
      };
}

/**
 * Read one entry of `fixture:`.
 * @param entry An object with the step kind as its only key.
 * @returns The fixture step.
 */
function parseFixtureStep(entry: unknown): FixtureStep {
  const {kind, value} = splitEntry(entry, fixtureKinds);

  if (kind === "write") {
    const fields = requireStrings(value, "write");

    return {
      kind,
      content: requireString(fields.content, "write.content"),
      value: requireString(fields.path, "write.path"),
    };
  }

  return {
    kind,
    value: requireString(value, kind),
  };
}

/**
 * Read the text of `prompt.md` after its front matter.
 * @param promptFile Content of `prompt.md`.
 * @returns The prompt.
 */
function readPromptBody(promptFile: string): string {
  return promptFile.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
}

/**
 * Load one case from its folder.
 * @param casesDirectory The folder that holds the skill folders.
 * @param skill Skill folder name.
 * @param name Case folder name.
 * @returns The case.
 */
function loadCase(casesDirectory: string, skill: string, name: string): EvalCase {
  const caseDirectory = path.join(casesDirectory, skill, name);
  const description: unknown = parse(readFileSync(path.join(caseDirectory, "case.yaml"), "utf8"));

  const fields: Record<string, unknown> =
    typeof description === "object" && description !== null
      ? {
          ...description,
        }
      : {};

  const timeoutSeconds = fields.timeout_seconds;
  const {checks, fixture} = fields;

  if (typeof timeoutSeconds !== "number") {
    throw new TypeError("timeout_seconds must be a number");
  }

  if (!Array.isArray(checks) || checks.length === 0) {
    throw new TypeError("checks must be a list with at least one check");
  }

  if (fixture !== undefined && !Array.isArray(fixture)) {
    throw new TypeError("fixture must be a list of steps");
  }

  return {
    timeoutSeconds,
    checks: checks.map(entry => parseCheck(entry)),
    fixture: fixture?.map(entry => parseFixtureStep(entry)),
    hasProseFixture: existsSync(path.join(caseDirectory, "fixture.md")),
    id: `${skill}/${name}`,
    prompt: readPromptBody(readFileSync(path.join(caseDirectory, "prompt.md"), "utf8")),
  };
}

/**
 * List the case folders.
 * @param casesDirectory The folder that holds the skill folders.
 * @returns The `skill/name` of every folder that holds a `case.yaml`.
 */
function listCaseIds(casesDirectory: string): string[] {
  return readdirSync(casesDirectory, {
    withFileTypes: true,
  })
    .filter(entry => entry.isDirectory())
    .flatMap(skill =>
      readdirSync(path.join(casesDirectory, skill.name), {
        withFileTypes: true,
      })
        .filter(entry => entry.isDirectory())
        .map(entry => `${skill.name}/${entry.name}`),
    )
    .toSorted((left, right) => left.localeCompare(right));
}

/**
 * Choose the cases to run.
 * @param caseIds Every `skill/name`.
 * @param requested Names given on the command line; a bare name matches the case folder name.
 * @returns The chosen ids, or every id when nothing was requested.
 */
function selectCaseIds(caseIds: string[], requested: string[]): string[] {
  const unknown = requested.filter(name =>
    caseIds.every(id => !(id === name || id.endsWith(`/${name}`))),
  );

  if (unknown.length > 0) {
    throw new Error(`no case named ${unknown.join(", ")}; the cases are:\n${caseIds.join("\n")}`);
  }

  return requested.length === 0
    ? caseIds
    : caseIds.filter(id => requested.some(name => id === name || id.endsWith(`/${name}`)));
}

/**
 * Create a bare repository, add it as a remote, and push every branch to it.
 * @param directory Git working directory.
 * @param remoteName Name of the remote.
 */
function addBareRemote(directory: string, remoteName: string): void {
  const remotePath = path.join(path.dirname(directory), `${remoteName}.git`);

  runGit(directory, ["init", "--bare", "--initial-branch=main", remotePath]);
  runGit(directory, ["remote", "add", remoteName, remotePath]);
  runGit(directory, ["push", remoteName, "--all"]);
}

/**
 * Apply one fixture step to a repository.
 * @param directory Git working directory.
 * @param step The step.
 */
function applyFixtureStep(directory: string, step: FixtureStep): void {
  switch (step.kind) {
    case "bare_remote": {
      addBareRemote(directory, step.value);

      return;
    }

    case "branch": {
      runGit(directory, ["checkout", "-b", step.value]);

      return;
    }

    case "checkout": {
      runGit(directory, ["checkout", step.value]);

      return;
    }

    case "commit": {
      commitAll(directory, step.value);

      return;
    }

    default: {
      const filePath = path.join(directory, step.value);

      mkdirSync(path.dirname(filePath), {
        recursive: true,
      });

      writeFileSync(filePath, step.content ?? "");
    }
  }
}

/**
 * Apply fixture steps to a repository.
 * @param directory Git working directory.
 * @param steps The steps, in order.
 */
function applyFixture(directory: string, steps: FixtureStep[]): void {
  for (const step of steps) {
    applyFixtureStep(directory, step);
  }
}

/**
 * Create a git repository with one commit in a directory.
 * @param directory Directory that holds the files.
 */
function initializeRepository(directory: string): void {
  runGit(directory, ["init", "--initial-branch=main"]);
  runGit(directory, ["config", "user.name", "agent-evals"]);
  runGit(directory, ["config", "user.email", "agent-evals@localhost"]);
  runGit(directory, ["config", "commit.gpgsign", "false"]);
  commitAll(directory, "chore: initial commit");
}

/**
 * Copy the project without its git data and dependencies.
 * @param source The project root.
 * @param destination The folder to copy into.
 */
function copyProject(source: string, destination: string): void {
  cpSync(source, destination, {
    recursive: true,
    filter: sourcePath => !excludedNames.has(path.basename(sourcePath)),
  });
}

/**
 * List the files a run created or changed in the working tree.
 * @param outcome What the run left behind.
 * @returns Paths relative to the project root that exist now.
 */
function listChangedFiles(outcome: Outcome): string[] {
  const changed = [
    ...toLines(runGit(outcome.dir, ["diff", "--name-only", "--no-renames", outcome.before.head])),
    ...toLines(runGit(outcome.dir, ["ls-files", "--others", "--exclude-standard"])),
  ];

  return [...new Set(changed)].filter(file => existsSync(path.join(outcome.dir, file)));
}

/**
 * Find the files a `path` designates.
 * @param outcome What the run left behind.
 * @param pattern A file path, or a glob that only the files the run created or changed can match.
 * @returns Paths relative to the project root.
 */
function findFiles(outcome: Outcome, pattern: string): string[] {
  if (!globCharacters.test(pattern)) {
    return existsSync(path.join(outcome.dir, pattern)) ? [pattern] : [];
  }

  return listChangedFiles(outcome).filter(file => path.matchesGlob(file, pattern));
}

/**
 * Read the files of the first commit the run made.
 * @param outcome What the run left behind.
 * @returns The paths of that commit, or undefined when the run made no commit.
 */
function readFirstNewCommitFiles(outcome: Outcome): string[] | undefined {
  const firstCommit = toLines(
    runGit(outcome.dir, [
      "rev-list",
      "--reverse",
      "--topo-order",
      "--all",
      "--not",
      ...outcome.before.refs,
    ]),
  ).at(0);

  return firstCommit === undefined
    ? undefined
    : toLines(
        runGit(outcome.dir, [
          "diff-tree",
          "--root",
          "--no-commit-id",
          "--name-only",
          "-r",
          firstCommit,
        ]),
      );
}

/**
 * Compile a regular expression from a case file.
 * @param source The pattern.
 * @returns The expression, with the `m` and `u` flags.
 */
function compilePattern(source: string): RegExp {
  return new RegExp(source, regexFlags);
}

/**
 * Tell whether a check passed, as a failure message or nothing.
 * @param isPassing Whether the check passed.
 * @param failure The message when it did not.
 * @returns The message, or undefined when the check passed.
 */
function failUnless(isPassing: boolean, failure: string): string | undefined {
  return isPassing ? undefined : failure;
}

/**
 * Find the new branches in a run.
 * @param outcome What the run left behind.
 * @returns Local branches that the fixture did not create.
 */
function listNewBranches(outcome: Outcome): string[] {
  return outcome.after.branches.filter(branch => !outcome.before.branches.includes(branch));
}

/**
 * Find the new commits in a run.
 * @param outcome What the run left behind.
 * @returns Commits reachable from any ref that the fixture did not create.
 */
function listNewCommits(outcome: Outcome): string[] {
  return outcome.after.commits.filter(commit => !outcome.before.commits.includes(commit));
}

/**
 * Check the name of the current branch.
 * @param check A `branch_matches` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkBranchMatches(check: Check, outcome: Outcome): string | undefined {
  const branch = runGit(outcome.dir, ["branch", "--show-current"]);

  return failUnless(
    compilePattern(check.argument ?? "").test(branch),
    `branch "${branch}" does not match ${check.argument}`,
  );
}

/**
 * Check the files of the first commit of the run.
 * @param check A `commit_touches_only` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkCommitTouchesOnly(check: Check, outcome: Outcome): string | undefined {
  const files = readFirstNewCommitFiles(outcome);
  const stray = (files ?? []).filter(file => !path.matchesGlob(file, check.argument ?? ""));

  return failUnless(
    files !== undefined && stray.length === 0,
    files === undefined
      ? "the run made no commit"
      : `the first new commit also touches ${stray.join(", ")}, outside ${check.argument}`,
  );
}

/**
 * Check that a file exists.
 * @param check A `file_exists` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkFileExists(check: Check, outcome: Outcome): string | undefined {
  return failUnless(
    findFiles(outcome, check.argument ?? "").length > 0,
    `no file ${check.argument}`,
  );
}

/**
 * Check the content of a file.
 * @param check A `file_matches` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkFileMatches(check: Check, outcome: Outcome): string | undefined {
  const pattern = compilePattern(check.regex ?? "");

  return failUnless(
    findFiles(outcome, check.argument ?? "").some(file =>
      pattern.test(readFileSync(path.join(outcome.dir, file), "utf8")),
    ),
    `no file ${check.argument} matches ${check.regex}`,
  );
}

/**
 * Check that the reply lacks a pattern.
 * @param check A `reply_lacks` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkReplyLacks(check: Check, outcome: Outcome): string | undefined {
  const found = compilePattern(check.argument ?? "").exec(outcome.reply);

  return failUnless(
    found === null,
    `the reply contains "${found?.at(0)}", matching ${check.argument}`,
  );
}

/**
 * Check that the working tree is as the fixture left it.
 * @param _check A `no_file_changes` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkNoFileChanges(_check: Check, outcome: Outcome): string | undefined {
  return failUnless(
    outcome.after.status === outcome.before.status,
    `the working tree changed:\n${outcome.after.status}`,
  );
}

/**
 * Check that the run created no branch.
 * @param _check A `no_new_branch` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkNoNewBranch(_check: Check, outcome: Outcome): string | undefined {
  return failUnless(
    listNewBranches(outcome).length === 0,
    `new branch ${listNewBranches(outcome).join(", ")}`,
  );
}

/**
 * Check that the run made no commit.
 * @param _check A `no_new_commits` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkNoNewCommits(_check: Check, outcome: Outcome): string | undefined {
  return failUnless(
    listNewCommits(outcome).length === 0,
    `${listNewCommits(outcome).length} new commit(s)`,
  );
}

/**
 * Check that the reply matches a pattern.
 * @param check A `reply_matches` check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined.
 */
function checkReplyMatches(check: Check, outcome: Outcome): string | undefined {
  return failUnless(
    compilePattern(check.argument ?? "").test(outcome.reply),
    `the reply does not match ${check.argument}`,
  );
}

const evaluators: Record<CheckKind, (check: Check, outcome: Outcome) => string | undefined> = {
  branch_matches: checkBranchMatches,
  commit_touches_only: checkCommitTouchesOnly,
  file_exists: checkFileExists,
  file_matches: checkFileMatches,
  no_file_changes: checkNoFileChanges,
  no_new_branch: checkNoNewBranch,
  no_new_commits: checkNoNewCommits,
  reply_lacks: checkReplyLacks,
  reply_matches: checkReplyMatches,
};

type SelfTest = {
  name: string;
  passes: () => boolean;
};

type Expectation = [check: Check, isPassing: boolean, reply?: string];

/**
 * Evaluate one check against what a run left behind.
 * @param check The check.
 * @param outcome What the run left behind.
 * @returns Why the check failed, or undefined when it passed.
 */
function findCheckFailure(check: Check, outcome: Outcome): string | undefined {
  return evaluators[check.kind](check, outcome);
}

/**
 * Describe a check in one line.
 * @param check The check.
 * @returns The kind and its argument.
 */
function describeCheck(check: Check): string {
  return [check.kind, check.argument, check.regex].filter(part => part !== undefined).join(" ");
}

/**
 * Stop with a clear message when Claude Code cannot run here.
 */
function assertClaudeReady(): void {
  const version = spawnSync("claude", ["--version"], {
    encoding: "utf8",
  });

  if (version.error !== undefined) {
    throw new Error(
      "`claude` is not installed or is not on PATH; install Claude Code and log in with `claude`",
    );
  }

  const status = spawnSync("claude", ["auth", "status"], {
    encoding: "utf8",
  });

  if (status.status !== 0 || /"loggedIn":\s*false/.test(status.stdout)) {
    throw new Error(
      "Claude Code is not logged in; run `claude` and log in, then run the evals again",
    );
  }
}

/**
 * Read the reply and the cost from `claude --output-format json`.
 * @param stdout Standard output of the run.
 * @returns The reply, the cost when reported, and a problem when the run reports an error.
 */
function parseAgentOutput(stdout: string): AgentRun {
  const report: unknown = JSON.parse(stdout);

  const fields: Record<string, unknown> =
    typeof report === "object" && report !== null
      ? {
          ...report,
        }
      : {};

  const reply = typeof fields.result === "string" ? fields.result : "";
  const costUsd = typeof fields.total_cost_usd === "number" ? fields.total_cost_usd : undefined;

  return fields.is_error === true
    ? {
        costUsd,
        reply,
        problem: `Claude Code reported an error: ${reply}`,
      }
    : {
        costUsd,
        reply,
      };
}

/**
 * Run one prompt with Claude Code in a directory.
 * @param directory Project copy to run in.
 * @param prompt The prompt.
 * @param timeoutSeconds How long the run may take.
 * @returns The reply, the cost when reported, and a problem when the run did not finish.
 */
function runAgent(directory: string, prompt: string, timeoutSeconds: number): AgentRun {
  const run = spawnSync(
    "claude",
    [
      "-p",
      prompt,
      "--model",
      agentModel,
      "--strict-mcp-config",
      "--permission-mode",
      "acceptEdits",
      "--output-format",
      "json",
      "--allowedTools",
      ...allowedTools,
    ],
    {
      cwd: directory,
      env: childEnvironment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
      timeout: timeoutSeconds * 1000,
    },
  );

  if (run.error !== undefined) {
    return {
      reply: "",
      problem: `claude did not finish within ${timeoutSeconds}s or failed to start: ${run.error.message}`,
    };
  }

  try {
    return parseAgentOutput(run.stdout);
  } catch {
    return {
      reply: "",
      problem: `claude exited with ${run.status} and no JSON report: ${run.stderr.trim()}`,
    };
  }
}

/**
 * Run one case and evaluate its checks.
 * @param evalCase The case.
 * @param projectRoot The project to copy.
 * @returns The result of the case.
 */
function runCase(evalCase: EvalCase, projectRoot: string): CaseResult {
  const started = Date.now();
  const total = evalCase.checks.length;

  if (evalCase.fixture === undefined && evalCase.hasProseFixture) {
    return {
      total,
      skipReason: "fixture not machine-applicable",
      seconds: 0,
      failures: [],
      id: evalCase.id,
    };
  }

  const workspace = mkdtempSync(path.join(tmpdir(), "agent-eval-"));
  const projectCopy = path.join(workspace, "project");

  try {
    copyProject(projectRoot, projectCopy);
    initializeRepository(projectCopy);
    applyFixture(projectCopy, evalCase.fixture ?? []);

    const before = takeSnapshot(projectCopy);
    const agent = runAgent(projectCopy, evalCase.prompt, evalCase.timeoutSeconds);

    const outcome: Outcome = {
      before,
      dir: projectCopy,
      after: takeSnapshot(projectCopy),
      reply: agent.reply,
    };

    const failures =
      agent.problem === undefined
        ? evalCase.checks
            .map(check => ({
              check,
              failure: findCheckFailure(check, outcome),
            }))
            .filter(({failure}) => failure !== undefined)
            .map(({check, failure}) => `${describeCheck(check)}: ${failure}`)
        : [agent.problem];

    return {
      failures,
      total,
      costUsd: agent.costUsd,
      id: evalCase.id,
      seconds: Math.round((Date.now() - started) / 1000),
    };
  } finally {
    rmSync(workspace, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * Format the result of one case as lines.
 * @param result The result.
 * @returns The first line states the verdict; failures follow, indented.
 */
function formatResult(result: CaseResult): string[] {
  if (result.skipReason !== undefined) {
    return [`skipped ${result.id}: ${result.skipReason}`];
  }

  const cost = result.costUsd === undefined ? "" : `, $${result.costUsd.toFixed(4)}`;
  const failedCount = result.failures.length;
  const verdict = failedCount === 0 ? "passed" : "failed";

  return [
    `${verdict} ${result.id}: ${result.total - Math.min(failedCount, result.total)}/${result.total} checks, ${result.seconds}s${cost}`,
    ...result.failures.map(failure => `  - ${failure}`),
  ];
}

/**
 * Build a check.
 * @param kind The kind.
 * @param argument The argument, when the kind takes one.
 * @param regex The regular expression of `file_matches`.
 * @returns The check.
 */
function makeCheck(kind: CheckKind, argument?: string, regex?: string): Check {
  return {
    argument,
    kind,
    regex,
  };
}

/**
 * Evaluate expectations against an outcome.
 * @param expectations Each check, whether it should pass, and the reply to judge it against.
 * @param outcome What the run left behind.
 * @returns True when every check behaves as expected.
 */
function areExpectationsMet(expectations: Expectation[], outcome: Outcome): boolean {
  return expectations.every(
    ([check, isPassing, reply = ""]) =>
      (findCheckFailure(check, {
        ...outcome,
        reply,
      }) ===
        undefined) ===
      isPassing,
  );
}

/**
 * Tell whether parsing a check throws.
 * @param entry A `checks:` entry.
 * @returns True when the entry is rejected.
 */
function isRejectedCheck(entry: unknown): boolean {
  try {
    parseCheck(entry);

    return false;
  } catch {
    return true;
  }
}

const thaiWord = String.raw`[\u0E00-\u0E7F]{5}`;
const numberedLines = "1. first\n2. second\n";

const replyExpectations: Expectation[] = [
  [makeCheck("reply_matches", "^2\\. second$"), true, numberedLines],
  [makeCheck("reply_matches", "^second$"), false, numberedLines],
  [makeCheck("reply_matches", thaiWord), true, "สวัสดีครับ"],
  [makeCheck("reply_matches", thaiWord), false, "hello"],
  [makeCheck("reply_lacks", "/home/"), true, "src/a.ts"],
  [makeCheck("reply_lacks", "/home/"), false, "see /home/me/a.ts"],
];

const unchangedExpectations: Expectation[] = [
  [makeCheck("no_file_changes"), true],
  [makeCheck("no_new_commits"), true],
  [makeCheck("no_new_branch"), true],
  [makeCheck("branch_matches", "^main$"), true],
  [makeCheck("commit_touches_only", "docs/**"), false],
  [makeCheck("file_exists", "docs/*.md"), false],
  [makeCheck("file_exists", "README.md"), true],
];

const untrackedExpectations: Expectation[] = [
  [makeCheck("no_file_changes"), false],
  [makeCheck("no_new_commits"), true],
  [makeCheck("file_exists", "*.txt"), true],
  [makeCheck("file_exists", "*.csv"), false],
];

const committedExpectations: Expectation[] = [
  [makeCheck("no_new_commits"), false],
  [makeCheck("no_new_branch"), false],
  [makeCheck("no_file_changes"), true],
  [makeCheck("branch_matches", "^feat/"), true],
  [makeCheck("commit_touches_only", "intent.md"), true],
  [makeCheck("commit_touches_only", "src.ts"), false],
  [makeCheck("file_exists", "*.md"), true],
  [makeCheck("file_matches", "*.md", "^Accepted by: @joe-dev\\.$"), true],
  [makeCheck("file_matches", "*.md", "^Accepted by: @other\\.$"), false],
];

const fixtureSteps: FixtureStep[] = [
  {
    content: "a\n",
    kind: "write",
    value: "docs/a.md",
  },
  {
    kind: "commit",
    value: "docs: add a",
  },
  {
    kind: "branch",
    value: "feat/other",
  },
  {
    content: "b\n",
    kind: "write",
    value: "src/b.ts",
  },
  {
    kind: "commit",
    value: "feat: add b",
  },
  {
    kind: "checkout",
    value: "main",
  },
  {
    kind: "bare_remote",
    value: "origin",
  },
];

/**
 * Build the self-tests of the fixture applier and the check evaluators.
 * @param scratch An empty folder for the test repository.
 * @returns The tests, each already run; none calls a model.
 */
function buildSelfTests(scratch: string): SelfTest[] {
  const project = path.join(scratch, "project");

  mkdirSync(project);
  writeFileSync(path.join(project, "README.md"), "readme\n");
  initializeRepository(project);
  applyFixture(project, fixtureSteps);

  const before = takeSnapshot(project);

  const outcomeOf = (): Outcome => ({
    before,
    dir: project,
    reply: "",
    after: takeSnapshot(project),
  });

  const isFixtureApplied =
    before.branches.join(",") === "feat/other,main" &&
    before.status === "" &&
    runGit(project, ["ls-remote", "--heads", "origin"]).includes("refs/heads/feat/other");

  const isUnchanged = areExpectationsMet(
    [...unchangedExpectations, ...replyExpectations],
    outcomeOf(),
  );

  writeFileSync(path.join(project, "notes.txt"), "scratch\n");

  const isUntracked = areExpectationsMet(untrackedExpectations, outcomeOf());

  rmSync(path.join(project, "notes.txt"));
  runGit(project, ["checkout", "-b", "feat/new"]);
  writeFileSync(path.join(project, "intent.md"), "Accepted by: @joe-dev.\n");
  commitAll(project, "docs: add intent");
  writeFileSync(path.join(project, "src.ts"), "x\n");
  commitAll(project, "feat: add src");

  const isCommitted = areExpectationsMet(committedExpectations, outcomeOf());

  return [
    {
      name: "the fixture creates branches, a clean tree and a remote that holds every branch",
      passes: () => isFixtureApplied,
    },
    {
      name: "a run that changed nothing passes the no_* checks, and the reply checks read line anchors and Thai",
      passes: () => isUnchanged,
    },
    {
      name: "an untracked file fails no_file_changes and a glob finds it",
      passes: () => isUntracked,
    },
    {
      name: "a new branch and commits fail the no_* checks and satisfy the commit and file checks",
      passes: () => isCommitted,
    },
    {
      name: "a check list rejects an unknown kind and a check without its fields",
      passes: () =>
        [
          isRejectedCheck("no_such_check"),
          isRejectedCheck({
            reply_matches: true,
          }),
          isRejectedCheck({
            file_matches: {
              path: "a",
            },
          }),
          !isRejectedCheck("no_file_changes"),
          !isRejectedCheck({
            file_matches: {
              path: "a",
              regex: "b",
            },
          }),
        ].every(Boolean),
    },
    {
      name: "prompt.md loses its front matter",
      passes: () => readPromptBody("---\ntags: [a]\n---\n\n/sdlc hello\n") === "/sdlc hello",
    },
  ];
}

/**
 * Run the self-tests in a scratch folder.
 * @returns The names of the tests that failed.
 */
function runSelfTests(): string[] {
  const scratch = mkdtempSync(path.join(tmpdir(), "agent-eval-selftest-"));

  try {
    return buildSelfTests(scratch)
      .filter(test => !test.passes())
      .map(test => test.name);
  } finally {
    rmSync(scratch, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * Run the selected cases and report the pass rate.
 * @param requested Case names from the command line.
 */
function runEvals(requested: string[]): void {
  const casesDirectory = path.join(process.cwd(), evalsDirectory);
  const caseIds = selectCaseIds(listCaseIds(casesDirectory), requested);

  assertClaudeReady();

  const results = caseIds.map(id => {
    const [skill = "", name = ""] = id.split("/", 2);
    const result = runCase(loadCase(casesDirectory, skill, name), process.cwd());

    process.stdout.write(`${formatResult(result).join("\n")}\n`);

    return result;
  });

  const ran = results.filter(result => result.skipReason === undefined);
  const passed = ran.filter(result => result.failures.length === 0);
  const skipped = results.length - ran.length;
  const passRate = ran.length === 0 ? 0 : passed.length / ran.length;

  process.stdout.write(
    `\nmodel ${agentModel}: ${passed.length} of ${ran.length} cases passed (${Math.round(passRate * 100)}%), ${skipped} skipped; the threshold is ${passRateThreshold * 100}%\n`,
  );

  if (passRate < passRateThreshold) {
    process.exitCode = 1;
  }
}

const selfTestFailures = runSelfTests();

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Agent eval self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  try {
    runEvals(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
