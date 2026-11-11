import {execFileSync} from "node:child_process";
import {existsSync, readdirSync, readFileSync} from "node:fs";
import path from "node:path";

type BranchChanges = {
  changedPaths: string[];
  headCommit: string;
  mergeBase: string;
};

type SelfTestCase = {
  expectedMessagePart?: string;
  name: string;
  problems: string[];
};

const defaultBranch = "origin/main";
const intentDirectory = "intent";
const planFileName = "plan.md";
const specFileName = "spec.md";
const proofHeading = "## Proof";
const requirementsHeading = "## Requirements";
const acceptancePlaceholder = "@<engineer>";
const acceptedByPrefix = "Accepted by: ";
const requiredHeadings = ["## Files that change", "## Order of work", "## Risks", proofHeading];

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
 * Find what this branch changed since it left the default branch.
 * @returns The merge base, HEAD, and the changed paths, or undefined when the default branch is not available.
 */
function findBranchChanges(): BranchChanges | undefined {
  try {
    const mergeBase = runGit(["merge-base", "HEAD", defaultBranch]);

    return {
      mergeBase,
      headCommit: runGit(["rev-parse", "HEAD"]),
      changedPaths: runGit(["diff", "--name-only", `${mergeBase}...HEAD`])
        .split("\n")
        .filter(changedPath => changedPath !== ""),
    };
  } catch {
    return undefined;
  }
}

/**
 * Tell whether a plan must name its accepting engineer: the branch changes a file outside `intent/`.
 * @param branchChanges What the branch changed, or undefined when no merge base was found.
 * @returns False when there is no merge base or HEAD is the default branch tip.
 */
function requiresAcceptance(branchChanges: BranchChanges | undefined): boolean {
  return (
    branchChanges !== undefined &&
    branchChanges.mergeBase !== branchChanges.headCommit &&
    branchChanges.changedPaths.some(changedPath => !changedPath.startsWith(`${intentDirectory}/`))
  );
}

/**
 * Say why the acceptance rule cannot run.
 * @param branchChanges What the branch changed, or undefined when no merge base was found.
 * @returns A note when the default branch is not available, otherwise undefined.
 */
function describeAcceptanceSkip(branchChanges: BranchChanges | undefined): string | undefined {
  return branchChanges === undefined
    ? `${defaultBranch} cannot be found, so the "${acceptedByPrefix}" rule was skipped; run "git fetch origin main" to apply it`
    : undefined;
}

/**
 * Blank every line of a fenced code block, keeping line numbers.
 * @param lines Document lines.
 * @returns The lines with fenced ones emptied.
 */
function maskFencedBlocks(lines: string[]): string[] {
  let isFenced = false;

  return lines.map(line => {
    const isFence = /^\s*(?:```|~~~)/.test(line);
    const isMasked = isFenced || isFence;

    isFenced = isFence ? !isFenced : isFenced;

    return isMasked ? "" : line;
  });
}

/**
 * Split a document into LF-terminated lines without a byte order mark.
 * @param text Document content.
 * @returns The lines.
 */
function splitLines(text: string): string[] {
  return text
    .replace(/^\u{FEFF}/u, "")
    .replaceAll("\r\n", "\n")
    .split("\n");
}

/**
 * Collect the text of a level-2 section.
 * @param maskedLines Document lines with fenced code blocks emptied.
 * @param heading The section heading.
 * @returns The lines under the heading up to the next level-2 heading, or undefined when the heading is absent.
 */
function readSection(maskedLines: string[], heading: string): string[] | undefined {
  const start = maskedLines.findIndex(line => line.trimEnd() === heading);

  if (start === -1) {
    return undefined;
  }

  const nextHeading = maskedLines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );

  return maskedLines.slice(start + 1, nextHeading === -1 ? maskedLines.length : nextHeading);
}

/**
 * Quote each heading and join them for a message.
 * @param headings Heading texts.
 * @returns The quoted list, or "none" when there is no heading.
 */
function quoteHeadings(headings: string[]): string {
  return headings.length === 0 ? "none" : headings.map(heading => `"${heading}"`).join(", ");
}

/**
 * Find level-2 headings that differ from the template's, in count, spelling, or order.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @returns At most one message.
 */
function findHeadingProblems(maskedLines: string[]): string[] {
  const headings = maskedLines.map(line => line.trimEnd()).filter(line => line.startsWith("## "));

  return headings.join("\n") === requiredHeadings.join("\n")
    ? []
    : [
        `the level-2 headings must be exactly, in order: ${quoteHeadings(requiredHeadings)}; found ${quoteHeadings(headings)}`,
      ];
}

/**
 * Find a missing or placeholder `Accepted by:` line when the branch changes a file outside `intent/`.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns At most one message.
 */
function findAcceptanceProblems(maskedLines: string[], isAcceptanceRequired: boolean): string[] {
  const acceptedLine = maskedLines.find(line => line.startsWith(acceptedByPrefix));

  return !isAcceptanceRequired ||
    (acceptedLine !== undefined && !acceptedLine.includes(acceptancePlaceholder))
    ? []
    : [
        `the plan has no "${acceptedByPrefix}<engineer>." line under its title, or it still holds ${acceptancePlaceholder}, and this branch changes a file outside ${intentDirectory}/; write the engineer who accepted the plan`,
      ];
}

/**
 * Read the numbers of the requirements in a spec.
 * @param specLines Spec lines.
 * @returns Each distinct number of a top-level list item under `## Requirements`, in order.
 */
function readRequirementNumbers(specLines: string[]): number[] {
  const numbers = (readSection(maskFencedBlocks(specLines), requirementsHeading) ?? [])
    .map(line => /^(\d+)\. /.exec(line)?.at(1) ?? "")
    .filter(digits => digits !== "")
    .map(Number);

  return [...new Set(numbers)];
}

/**
 * Read the label of a Proof line: the text before the first colon of a paragraph or list item, or the first cell of a table row.
 * @param line One line of the Proof section.
 * @returns The label, or an empty string when the line has none.
 */
function readProofLabel(line: string): string {
  const text = line.trim();

  if (text.startsWith("|")) {
    return text.split("|", 2).at(1)?.trim() ?? "";
  }

  const item = text.replace(/^(?:[-*+]|\d+[.)])\s+/, "");
  const colon = item.indexOf(":");

  return colon === -1 ? "" : item.slice(0, colon).replaceAll(/[*_`]/g, "").trim();
}

/**
 * Read the requirement numbers a label names: `1`, `1, 2, 8`, `1 and 2`, or a range such as `3–5`, `3-5`, or `3 to 5`, with an optional "Requirement" prefix.
 * @param label The label of a Proof line.
 * @param largestNumber The largest requirement number of the spec, which bounds a range.
 * @returns The named numbers; empty when the label holds anything else, such as `1.2.3`.
 */
function readNamedNumbers(label: string, largestNumber: number): Set<number> {
  const numbers = label.replace(/^requirements?\s+/i, "");
  const named = new Set<number>();

  if (numbers.replaceAll(/\d+|[–\-,\s]|\band\b|\bto\b/g, "") !== "") {
    return named;
  }

  const tokens = Array.from(numbers.matchAll(/\d+|[–-]|\bto\b/g), ([token]) => token);

  for (const [index, token] of tokens.entries()) {
    const first = Number(token);
    const last = Number(tokens.at(index + 2));

    if (Number.isSafeInteger(first)) {
      named.add(first);
    }

    if (
      Number.isSafeInteger(first) &&
      Number.isNaN(Number(tokens.at(index + 1))) &&
      Number.isSafeInteger(last)
    ) {
      for (let number = first; number <= Math.min(last, largestNumber); number += 1) {
        named.add(number);
      }
    }
  }

  return named;
}

/**
 * Find a spec that has no numbered requirement.
 * @param specLines Spec lines.
 * @returns At most one message.
 */
function findRequirementProblems(specLines: string[]): string[] {
  return readRequirementNumbers(specLines).length > 0
    ? []
    : [
        `${specFileName} has no numbered requirement under "${requirementsHeading}"; write each requirement as a top-level "1." list item`,
      ];
}

/**
 * Find a Proof section that leaves a requirement of the spec unnamed in its line labels.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param specLines Spec lines.
 * @returns At most one message.
 */
function findProofProblems(maskedLines: string[], specLines: string[]): string[] {
  const proof = readSection(maskedLines, proofHeading);

  if (proof === undefined) {
    return [];
  }

  const requirements = readRequirementNumbers(specLines);
  const largestNumber = Math.max(0, ...requirements);

  const named = new Set(
    proof.flatMap(line => [...readNamedNumbers(readProofLabel(line), largestNumber)]),
  );

  const missing = requirements.filter(number => !named.has(number));

  return missing.length === 0
    ? []
    : [
        `the section "${proofHeading}" does not name requirement ${missing.join(", ")} of ${specFileName} in a line label; start each line with its number or numbers and a colon, such as "1, 2:" or "3–5:", or put them in the first table cell`,
      ];
}

/**
 * Check one plan against the template in `.agents/skills/sdlc/playbooks/build.md` and the spec beside it.
 * @param planText Plan content.
 * @param specText Content of the `spec.md` beside the plan, or undefined when there is none.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns One message per problem.
 */
function checkPlan(
  planText: string,
  specText: string | undefined,
  isAcceptanceRequired: boolean,
): string[] {
  const maskedLines = maskFencedBlocks(splitLines(planText));
  const specLines = specText === undefined ? undefined : splitLines(specText);

  return [
    ...findHeadingProblems(maskedLines),
    ...findAcceptanceProblems(maskedLines, isAcceptanceRequired),
    ...(specLines === undefined
      ? [`there is no ${specFileName} beside the plan; write the spec the plan builds`]
      : [...findRequirementProblems(specLines), ...findProofProblems(maskedLines, specLines)]),
  ];
}

/**
 * Tell whether a spec says `Status: done.` at the end of a line.
 * @param specText Spec content.
 * @returns True when the tree meets every requirement of the spec.
 */
function isDoneSpec(specText: string): boolean {
  return maskFencedBlocks(splitLines(specText)).some(line =>
    /Status: done\.$/.test(line.trimEnd()),
  );
}

/**
 * Find a done spec that has no plan.
 * @param specText Spec content.
 * @param hasPlan Whether the folder has a `plan.md`.
 * @returns At most one message.
 */
function findMissingPlanProblems(specText: string, hasPlan: boolean): string[] {
  return hasPlan || !isDoneSpec(specText)
    ? []
    : [
        `${specFileName} says "Status: done." and the folder has no ${planFileName}; write the plan that built the change`,
      ];
}

const proofSpec = [
  "# Spec: Health check answers 200",
  "",
  "From `intent/health/intent.md`. Status: accepted.",
  "",
  requirementsHeading,
  "",
  "1. A.",
  "2. B.",
  "3. C.",
  "4. D.",
  "5. E.",
  "",
  "## Design",
  "",
  "1. Not a requirement.",
  "",
].join("\n");

const allUnnamedPart = "does not name requirement 1, 2, 3, 4, 5";
const acceptanceRequiredProblem = "acceptance is required";
const doneSpec = proofSpec.replace("Status: accepted.", "Status: done.");
const placeholderLine = `${acceptedByPrefix}${acceptancePlaceholder}.`;
const engineerLine = `${acceptedByPrefix}@engineer.`;

type PlanParts = {
  accepted?: string;
  body?: string;
  headings?: string[];
  proof?: string;
};

/**
 * Build a plan from its parts.
 * @param parts The `Accepted by:` line, the text of each section but Proof, the headings, and the text of Proof.
 * @returns The plan content.
 */
function buildPlan(parts: PlanParts): string {
  const {
    body = "Text.",
    proof = "Requirements 1-5: proven.",
    accepted = engineerLine,
    headings = requiredHeadings,
  } = parts;

  return [
    "# Plan: Health check answers 200",
    "",
    accepted,
    "",
    ...headings.flatMap(heading => [heading, "", heading === proofHeading ? proof : body, ""]),
  ].join("\n");
}

/**
 * Check a self-test plan against the self-test spec.
 * @param planText Plan content.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns One message per problem.
 */
function checkAgainstProofSpec(planText: string, isAcceptanceRequired = true): string[] {
  return checkPlan(planText, proofSpec, isAcceptanceRequired);
}

const branchWithCode: BranchChanges = {
  headCommit: "bbb",
  mergeBase: "aaa",
  changedPaths: ["intent/health/plan.md", "src/health.ts"],
};

const selfTestCases: SelfTestCase[] = [
  {
    name: "a complete plan",
    problems: checkAgainstProofSpec(buildPlan({})),
  },
  {
    expectedMessagePart: "level-2 headings",
    name: "a heading is misspelled",
    problems: checkAgainstProofSpec(
      buildPlan({
        headings: requiredHeadings.map(heading => heading.replace("Risks", "Risk")),
      }),
    ),
  },
  {
    expectedMessagePart: "level-2 headings",
    name: "headings are out of order",
    problems: checkAgainstProofSpec(
      buildPlan({
        headings: requiredHeadings.toReversed(),
      }),
    ),
  },
  {
    name: "a heading inside a fenced block is ignored",
    problems: checkAgainstProofSpec(
      buildPlan({
        body: "```\n## Extra\n```",
      }),
    ),
  },
  {
    expectedMessagePart: acceptedByPrefix,
    name: "the accepting engineer is missing",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: "",
      }),
    ),
  },
  {
    expectedMessagePart: acceptedByPrefix,
    name: "the accepting engineer is the placeholder",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: placeholderLine,
      }),
    ),
  },
  {
    name: "a placeholder is allowed when acceptance is not required",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: placeholderLine,
      }),
      false,
    ),
  },
  {
    name: "the spec is missing",
    expectedMessagePart: `no ${specFileName} beside the plan`,
    problems: checkPlan(buildPlan({}), undefined, true),
  },
  {
    expectedMessagePart: "does not name requirement 3, 5",
    name: "Proof leaves requirements unnamed",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirements 1, 2 and 4: proven.",
      }),
    ),
  },
  {
    name: "Proof names numbers alone and in a list",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "1, 2, 3 and 4: proven.\n\n5: proven.",
      }),
    ),
  },
  {
    name: "Proof names a range with an en dash",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirements 1–5: proven.",
      }),
    ),
  },
  {
    name: "Proof names a range with a hyphen",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirements 1-5: proven.",
      }),
    ),
  },
  {
    name: "Proof names a range with the word to",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirements 1 to 5: proven.",
      }),
    ),
  },
  {
    name: "CRLF line endings",
    problems: checkAgainstProofSpec(buildPlan({}).replaceAll("\n", "\r\n")),
  },
  {
    name: "the spec has no numbered requirement",
    expectedMessagePart: "has no numbered requirement",
    problems: checkPlan(buildPlan({}), "## Requirements\n\nText.\n", true),
  },
  {
    name: "a spec whose subsections restart numbering needs each number once",
    problems: checkPlan(
      buildPlan({
        proof: "1, 2: proven.",
      }),
      "## Requirements\n\n### A\n\n1. A.\n2. B.\n\n### B\n\n1. C.\n2. D.\n",
      true,
    ),
  },
  {
    expectedMessagePart: allUnnamedPart,
    name: "a version in a label does not count",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirement 1.2.3: proven.",
      }),
    ),
  },
  {
    name: "a number after the colon does not count",
    expectedMessagePart: "does not name requirement 2, 3, 4, 5",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "1: also covers 2, 3 and 4-5 on 2026-11-11.",
      }),
    ),
  },
  {
    expectedMessagePart: allUnnamedPart,
    name: "a line without a label names nothing",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "Requirements 1-5 are proven.",
      }),
    ),
  },
  {
    name: "Proof names requirements with and in a list item",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "- Requirements 1 and 2: proven.\n- 3, 4, 5: proven.",
      }),
    ),
  },
  {
    name: "Proof names requirements in the first table cell",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "| Requirement | Check |\n| :- | :- |\n| 1–5 | proven |",
      }),
    ),
  },
  {
    name: "a huge range is bounded by the largest requirement number and does not throw",
    problems: checkAgainstProofSpec(
      buildPlan({
        proof: "1 to 99999999999999: proven.",
      }),
    ),
  },
  {
    name: "a missing default branch is reported",
    expectedMessagePart: "cannot be found",
    problems: [describeAcceptanceSkip(undefined) ?? "no note"],
  },
  {
    name: "no note when the default branch is found",
    problems: describeAcceptanceSkip(branchWithCode) === undefined ? [] : ["unexpected note"],
  },
  {
    name: "a done spec has no plan",
    expectedMessagePart: `no ${planFileName}`,
    problems: findMissingPlanProblems(doneSpec, false),
  },
  {
    name: "a done spec has a plan",
    problems: findMissingPlanProblems(doneSpec, true),
  },
  {
    name: "an accepted spec has no plan",
    problems: findMissingPlanProblems(proofSpec, false),
  },
  {
    name: "a branch with a code change requires acceptance",
    problems: requiresAcceptance(branchWithCode) ? [] : ["acceptance is not required"],
  },
  {
    name: "a branch that changes only intent files skips acceptance",
    problems: requiresAcceptance({
      ...branchWithCode,
      changedPaths: ["intent/health/plan.md"],
    })
      ? [acceptanceRequiredProblem]
      : [],
  },
  {
    name: "no merge base skips acceptance",
    problems: requiresAcceptance(undefined) ? [acceptanceRequiredProblem] : [],
  },
  {
    name: "HEAD at the default branch tip skips acceptance",
    problems: requiresAcceptance({
      ...branchWithCode,
      headCommit: branchWithCode.mergeBase,
    })
      ? [acceptanceRequiredProblem]
      : [],
  },
];

/**
 * Tell whether a self-test case did not give the expected result.
 * @param testCase The self-test case.
 * @returns True when the case expects no message and got one, or expects exactly one message with its part and did not get it.
 */
function isSelfTestFailure(testCase: SelfTestCase): boolean {
  return testCase.expectedMessagePart === undefined
    ? testCase.problems.length > 0
    : testCase.problems.length !== 1 ||
        !testCase.problems.at(0)?.includes(testCase.expectedMessagePart);
}

const selfTestFailures = selfTestCases
  .filter(testCase => isSelfTestFailure(testCase))
  .map(({name}) => name);

/**
 * Read a spec when it exists.
 * @param specPath Path of the `spec.md`.
 * @returns The content, or undefined when the file does not exist.
 */
function readSpec(specPath: string): string | undefined {
  return existsSync(specPath) ? readFileSync(specPath, "utf8") : undefined;
}

/**
 * List the intent folders of the working tree.
 * @returns The path of each `intent/<change>` folder, sorted.
 */
function listChangeFolders(): string[] {
  return existsSync(intentDirectory)
    ? readdirSync(intentDirectory, {
        withFileTypes: true,
      })
        .filter(entry => entry.isDirectory())
        .map(({name}) => path.join(intentDirectory, name))
        .toSorted((first, second) => first.localeCompare(second))
    : [];
}

/**
 * Report each done spec that has no plan.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findMissingPlanLines(changeFolders: string[]): string[] {
  return changeFolders
    .filter(folder => !existsSync(path.join(folder, planFileName)))
    .flatMap(folder =>
      findMissingPlanProblems(readSpec(path.join(folder, specFileName)) ?? "", false).map(
        message => `${path.join(folder, planFileName)}: ${message}`,
      ),
    );
}

/**
 * Check one existing plan against the spec beside it.
 * @param planPath Path of the plan.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns One line per problem.
 */
function findPlanFileLines(planPath: string, isAcceptanceRequired: boolean): string[] {
  const specPath = path.join(path.dirname(planPath), specFileName);

  return checkPlan(readFileSync(planPath, "utf8"), readSpec(specPath), isAcceptanceRequired).map(
    message => `${planPath}: ${message}`,
  );
}

/**
 * Check each plan and report its problems.
 * @param planPaths The paths of the plans.
 * @returns One line per problem.
 */
function findPlanLines(planPaths: string[]): string[] {
  const branchChanges = planPaths.length > 0 ? findBranchChanges() : undefined;
  const skipNote = planPaths.length > 0 ? describeAcceptanceSkip(branchChanges) : undefined;
  const isAcceptanceRequired = requiresAcceptance(branchChanges);

  if (skipNote !== undefined) {
    process.stderr.write(`${skipNote}\n`);
  }

  const missingLines = planPaths
    .filter(planPath => !existsSync(planPath))
    .map(
      planPath =>
        `${planPath}: the file does not exist; pass the path of an existing ${planFileName}`,
    );

  const checkedLines = planPaths
    .filter(planPath => existsSync(planPath))
    .flatMap(planPath => findPlanFileLines(planPath, isAcceptanceRequired));

  return [...missingLines, ...checkedLines];
}

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Plan self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const argumentPaths = process.argv.slice(2);
  const changeFolders = argumentPaths.length === 0 ? listChangeFolders() : [];

  const planPaths =
    argumentPaths.length === 0
      ? changeFolders
          .map(folder => path.join(folder, planFileName))
          .filter(planPath => existsSync(planPath))
      : argumentPaths;

  const problemLines = [...findPlanLines(planPaths), ...findMissingPlanLines(changeFolders)];

  if (problemLines.length > 0) {
    process.stderr.write(`${problemLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Ran ${selfTestCases.length} plan self-tests and checked ${planPaths.length} plans.\n`,
    );
  }
}
