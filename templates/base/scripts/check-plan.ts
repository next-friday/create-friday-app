import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

import {
  acceptedByPrefix,
  defaultBranch,
  findSectionBounds,
  intentDirectory,
  maskFencedBlocks,
  readSection,
  runGit,
  splitLines,
  statusLineLimit,
} from "./plan-text.ts";
import {
  alsoAcceptedByPrefix,
  concernsHeading,
  decisionPrefix,
  findAuthorProblems,
  findDecisionProblems,
  findHostAcceptanceProblems,
  findUnmergedPlanProblems,
  hostTokenVariable,
  readPlanMerge,
} from "./plan-approval-records.ts";

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

const planFileName = "plan.md";
const specFileName = "spec.md";
const intentFileName = "intent.md";
const proofHeading = "## Proof";
const requirementsHeading = "## Requirements";
const acceptancePlaceholder = "@<engineer>";
const acceptedByPattern = /^Accepted by: @[\dA-Za-z][\dA-Za-z-]*\.$/;
const requiredHeadings = ["## Files that change", "## Order of work", "## Risks", proofHeading];
const unverifiedPlanPaths: string[] = [];

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
 * @returns A problem when the default branch is not available, otherwise undefined.
 */
function describeMissingDefaultBranch(
  branchChanges: BranchChanges | undefined,
): string | undefined {
  return branchChanges === undefined
    ? `${defaultBranch} cannot be found, so the "${acceptedByPrefix}" rule cannot be applied; run "git fetch origin main" to apply it`
    : undefined;
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
  const acceptedLine = maskedLines.slice(1).find(line => line.trim() !== "");

  return !isAcceptanceRequired ||
    (acceptedLine !== undefined && acceptedByPattern.test(acceptedLine.trimEnd()))
    ? []
    : [
        `the plan has no "${acceptedByPrefix}<engineer>." line directly under its title, or it holds ${acceptancePlaceholder} or no GitHub login, and this branch changes a file outside ${intentDirectory}/; write the engineer who accepted the plan`,
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
 * Find an empty Proof section in a plan that has no spec to prove.
 * @param lines Plan lines.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @returns At most one message.
 */
function findFixProofProblems(lines: string[], maskedLines: string[]): string[] {
  const bounds = findSectionBounds(maskedLines, proofHeading);

  return bounds === undefined || lines.slice(...bounds).some(line => line.trim() !== "")
    ? []
    : [
        `the section "${proofHeading}" is empty; name the test that fails today and passes once the cause is fixed`,
      ];
}

/**
 * Tell whether a change folder holds a fix plan: a plan with neither an intent nor a spec.
 * @param folder The `intent/<change>` folder.
 * @returns True when the folder has no `intent.md` and no `spec.md`.
 */
function isFixPlanFolder(folder: string): boolean {
  return (
    !existsSync(path.join(folder, intentFileName)) && !existsSync(path.join(folder, specFileName))
  );
}

/**
 * Find a missing spec, or a spec the plan does not prove.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param specText Content of the `spec.md` beside the plan, or undefined when there is none.
 * @returns One message per problem.
 */
function findSpecProblems(maskedLines: string[], specText: string | undefined): string[] {
  if (specText === undefined) {
    return [`there is no ${specFileName} beside the plan; write the spec the plan builds`];
  }

  const specLines = splitLines(specText);

  return [...findRequirementProblems(specLines), ...findProofProblems(maskedLines, specLines)];
}

/**
 * Check one plan against the template in `playbooks/build.md` of the `sdlc-mode` skill and the spec beside it.
 * @param planText Plan content.
 * @param specText Content of the `spec.md` beside the plan, or undefined when there is none.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @param isFixPlan Whether the folder holds a fix plan, which has no spec to prove.
 * @returns One message per problem.
 */
function checkPlan(
  planText: string,
  specText: string | undefined,
  isAcceptanceRequired: boolean,
  isFixPlan = false,
): string[] {
  const lines = splitLines(planText);
  const maskedLines = maskFencedBlocks(lines);

  return [
    ...findHeadingProblems(maskedLines),
    ...findAcceptanceProblems(maskedLines, isAcceptanceRequired),
    ...(isFixPlan
      ? findFixProofProblems(lines, maskedLines)
      : findSpecProblems(maskedLines, specText)),
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

/**
 * Tell whether a document says `Status: accepted.` at the end of a line.
 * @param text Intent or spec content.
 * @returns True when the status line says accepted.
 */
function isAcceptedDocument(text: string): boolean {
  return splitLines(text)
    .slice(0, statusLineLimit)
    .some(line => /Status: accepted\.$/.test(line.trimEnd()));
}

/**
 * Find an intent or a spec that this branch marks accepted before its pull request merged.
 * @param nextFileName The file of the next stage: `spec.md` for an intent, `plan.md` for a spec.
 * @param defaultBranchText The file on the default branch, or undefined when it is not there.
 * @param hasNextFile Whether the next stage's file is beside it.
 * @returns At most one message.
 */
function findAcceptedStatusProblems(
  nextFileName: string,
  defaultBranchText: string | undefined,
  hasNextFile: boolean,
): string[] {
  if (defaultBranchText === undefined) {
    return [
      `the file says "Status: accepted." and is not on ${defaultBranch}; merging its pull request accepts it, so write "Status: draft."`,
    ];
  }

  return hasNextFile || isAcceptedDocument(defaultBranchText)
    ? []
    : [
        `the file says "Status: accepted." and the folder has no ${nextFileName}; only the pull request that adds ${nextFileName} sets it, so write "Status: draft."`,
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
const headingsMessagePart = "level-2 headings";
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

/**
 * Create a change folder that holds the named files, for a self-test.
 * @param fileNames The files to create in the folder.
 * @returns The folder path.
 */
function createChangeFolder(fileNames: string[]): string {
  const folder = mkdtempSync(path.join(tmpdir(), "plan-check-"));

  for (const fileName of fileNames) {
    writeFileSync(path.join(folder, fileName), "");
  }

  return folder;
}

const fixPlanFolder = createChangeFolder([planFileName]);
const intentOnlyFolder = createChangeFolder([intentFileName, planFileName]);
const specOnlyFolder = createChangeFolder([specFileName, planFileName]);

const selfTestCases: SelfTestCase[] = [
  {
    name: "a complete plan",
    problems: checkAgainstProofSpec(buildPlan({})),
  },
  {
    expectedMessagePart: headingsMessagePart,
    name: "a heading is misspelled",
    problems: checkAgainstProofSpec(
      buildPlan({
        headings: requiredHeadings.map(heading => heading.replace("Risks", "Risk")),
      }),
    ),
  },
  {
    expectedMessagePart: headingsMessagePart,
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
    expectedMessagePart: acceptedByPrefix,
    name: "the accepting engineer is empty",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: `${acceptedByPrefix}.`,
      }),
    ),
  },
  {
    expectedMessagePart: acceptedByPrefix,
    name: "the accepting line is not directly under the title",
    problems: checkAgainstProofSpec(
      buildPlan({
        accepted: `From the spec.\n\n${engineerLine}`,
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
    name: "a fix plan with no intent and no spec",
    problems: checkPlan(buildPlan({}), undefined, true, isFixPlanFolder(fixPlanFolder)),
  },
  {
    name: "a fix plan with an empty Proof",
    expectedMessagePart: "is empty",
    problems: checkPlan(
      buildPlan({
        proof: "",
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    name: "a fix plan whose Proof holds only a fenced block",
    problems: checkPlan(
      buildPlan({
        proof: "```\npnpm test\n```",
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    expectedMessagePart: acceptedByPrefix,
    name: "a fix plan with the placeholder engineer on a branch that changes code",
    problems: checkPlan(
      buildPlan({
        accepted: placeholderLine,
      }),
      undefined,
      requiresAcceptance(branchWithCode),
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    expectedMessagePart: headingsMessagePart,
    name: "a fix plan with a misspelled heading",
    problems: checkPlan(
      buildPlan({
        headings: requiredHeadings.map(heading => heading.replace("Risks", "Risk")),
      }),
      undefined,
      true,
      isFixPlanFolder(fixPlanFolder),
    ),
  },
  {
    name: "a folder with an intent and a plan but no spec is not a fix plan",
    expectedMessagePart: `no ${specFileName} beside the plan`,
    problems: checkPlan(buildPlan({}), undefined, true, isFixPlanFolder(intentOnlyFolder)),
  },
  {
    name: "a folder with a spec and a plan is not a fix plan",
    problems: checkPlan(buildPlan({}), proofSpec, true, isFixPlanFolder(specOnlyFolder)),
  },
  {
    name: "a missing default branch is reported",
    expectedMessagePart: "cannot be found",
    problems: [describeMissingDefaultBranch(undefined) ?? "no note"],
  },
  {
    name: "no note when the default branch is found",
    problems: describeMissingDefaultBranch(branchWithCode) === undefined ? [] : ["unexpected note"],
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
  {
    name: "accepted status on a file that is not on the default branch",
    expectedMessagePart: `is not on ${defaultBranch}`,
    problems: findAcceptedStatusProblems(specFileName, undefined, true),
  },
  {
    name: "accepted status without the next stage's file",
    expectedMessagePart: `has no ${specFileName}`,
    problems: findAcceptedStatusProblems(specFileName, "Author: A (B). Status: draft.", false),
  },
  {
    name: "accepted status set by the pull request that adds the next stage's file",
    problems: findAcceptedStatusProblems(specFileName, "Author: A (B). Status: draft.", true),
  },
  {
    name: "accepted status already on the default branch",
    problems: findAcceptedStatusProblems(
      planFileName,
      "From `intent/health/intent.md`. Status: accepted.",
      false,
    ),
  },
  {
    name: "a plan added together with code",
    expectedMessagePart: `is not on ${defaultBranch}`,
    problems: findUnmergedPlanProblems(false, true),
  },
  {
    name: "a plan added alone",
    problems: findUnmergedPlanProblems(false, false),
  },
  {
    name: "a plan that is on the default branch, built with code",
    problems: findUnmergedPlanProblems(true, true),
  },
  {
    name: "the accepting handle is the account that merged, in another letter case",
    problems: findHostAcceptanceProblems(splitLines(buildPlan({})), {
      mergedBy: "Engineer",
      approvers: [],
    }),
  },
  {
    name: "the accepting handle is not the account that merged",
    expectedMessagePart: "@someone-else merged",
    problems: findHostAcceptanceProblems(splitLines(buildPlan({})), {
      mergedBy: "someone-else",
      approvers: [],
    }),
  },
  {
    name: "the second accepter approved the plan's pull request",
    problems: findHostAcceptanceProblems(
      splitLines(
        buildPlan({
          accepted: `${engineerLine}\n${alsoAcceptedByPrefix}@lead.`,
        }),
      ),
      {
        mergedBy: "engineer",
        approvers: ["lead"],
      },
    ),
  },
  {
    name: "the second accepter gave no approving review",
    expectedMessagePart: "no approving review",
    problems: findHostAcceptanceProblems(
      splitLines(
        buildPlan({
          accepted: `${engineerLine}\n${alsoAcceptedByPrefix}@lead.`,
        }),
      ),
      {
        mergedBy: "engineer",
        approvers: [],
      },
    ),
  },
  {
    name: "the second accepter is the account that merged",
    expectedMessagePart: "no approving review",
    problems: findHostAcceptanceProblems(
      splitLines(
        buildPlan({
          accepted: `${engineerLine}\n${alsoAcceptedByPrefix}@engineer.`,
        }),
      ),
      {
        mergedBy: "engineer",
        approvers: ["engineer"],
      },
    ),
  },
  {
    name: "every area of concern has a decision",
    problems: findDecisionProblems(
      `${concernsHeading}\n\n1. A.\n   ${decisionPrefix}yes.\n2. B.\n   ${decisionPrefix}no.\n\n## Open questions\n`,
    ),
  },
  {
    name: "a spec with no area of concern",
    problems: findDecisionProblems(`${concernsHeading}\n\nNone\n\n## Open questions\n`),
  },
  {
    name: "an area of concern has no decision",
    expectedMessagePart: "area of concern 2 has no",
    problems: findDecisionProblems(
      `${concernsHeading}\n\n1. A.\n   ${decisionPrefix}yes.\n2. B.\n\n## Open questions\n`,
    ),
  },
  {
    name: "a decision line with no text is not a decision",
    expectedMessagePart: "area of concern 1 has no",
    problems: findDecisionProblems(`${concernsHeading}\n\n1. A.\n   ${decisionPrefix}\n`),
  },
  {
    name: "an intent whose author is a handle",
    problems: findAuthorProblems("# Intent: A\n\nAuthor: @originator (Team). Status: draft.\n"),
  },
  {
    name: "an intent whose author is a name",
    expectedMessagePart: "holds no handle",
    problems: findAuthorProblems("# Intent: A\n\nAuthor: A Person (Team). Status: draft.\n"),
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

for (const folder of [fixPlanFolder, intentOnlyFolder, specOnlyFolder]) {
  rmSync(folder, {
    recursive: true,
    force: true,
  });
}

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
  const folder = path.dirname(planPath);

  return checkPlan(
    readFileSync(planPath, "utf8"),
    readSpec(path.join(folder, specFileName)),
    isAcceptanceRequired,
    isFixPlanFolder(folder),
  ).map(message => `${planPath}: ${message}`);
}

/**
 * Check each plan and report its problems.
 * @param planPaths The paths of the plans.
 * @returns One line per problem.
 */
function findPlanLines(planPaths: string[]): string[] {
  const branchChanges = planPaths.length > 0 ? findBranchChanges() : undefined;

  const missingBranchMessage =
    planPaths.length > 0 ? describeMissingDefaultBranch(branchChanges) : undefined;

  const missingBranchLines = missingBranchMessage === undefined ? [] : [missingBranchMessage];
  const isAcceptanceRequired = requiresAcceptance(branchChanges);

  const missingLines = planPaths
    .filter(planPath => !existsSync(planPath))
    .map(
      planPath =>
        `${planPath}: the file does not exist; pass the path of an existing ${planFileName}`,
    );

  const changedPlanPaths = planPaths
    .filter(planPath => existsSync(planPath))
    .filter(
      planPath =>
        branchChanges === undefined ||
        readDefaultBranchFile(branchChanges.mergeBase, planPath) !==
          readFileSync(planPath, "utf8").trim(),
    );

  const checkedLines = changedPlanPaths.flatMap(planPath =>
    findPlanFileLines(planPath, isAcceptanceRequired),
  );

  const acceptanceLines =
    branchChanges === undefined
      ? []
      : changedPlanPaths.flatMap(planPath =>
          findPlanAcceptanceLines(planPath, branchChanges.mergeBase, isAcceptanceRequired),
        );

  return [...missingBranchLines, ...missingLines, ...checkedLines, ...acceptanceLines];
}

/**
 * Read a file as the default branch has it.
 * @param mergeBase The commit this branch left the default branch at.
 * @param filePath Path from the repository root.
 * @returns The content, or undefined when the default branch has no such file.
 */
function readDefaultBranchFile(mergeBase: string, filePath: string): string | undefined {
  try {
    return runGit(["show", `${mergeBase}:${filePath.split(path.sep).join("/")}`]);
  } catch {
    return undefined;
  }
}

/**
 * Check that a plan this branch builds was accepted by a merge, and by whom.
 * @param planPath Path of the plan.
 * @param mergeBase The commit this branch left the default branch at.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns One line per problem.
 */
function findPlanAcceptanceLines(
  planPath: string,
  mergeBase: string,
  isAcceptanceRequired: boolean,
): string[] {
  const isOnDefaultBranch = readDefaultBranchFile(mergeBase, planPath) !== undefined;
  const unmergedProblems = findUnmergedPlanProblems(isOnDefaultBranch, isAcceptanceRequired);

  if (!isAcceptanceRequired || unmergedProblems.length > 0) {
    return unmergedProblems.map(message => `${planPath}: ${message}`);
  }

  const planMerge = readPlanMerge(mergeBase, planPath);

  if (planMerge === undefined) {
    unverifiedPlanPaths.push(planPath);

    return [];
  }

  const planLines = splitLines(readFileSync(planPath, "utf8"));

  return findHostAcceptanceProblems(maskFencedBlocks(planLines), planMerge).map(
    message => `${planPath}: ${message}`,
  );
}

/**
 * Report each spec this branch adds or changes that leaves an area of concern undecided, and each intent it adds whose author is not a handle.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findRecordLines(changeFolders: string[]): string[] {
  const branchChanges = changeFolders.length > 0 ? findBranchChanges() : undefined;

  if (branchChanges === undefined) {
    return [];
  }

  return changeFolders.flatMap(folder => {
    const specPath = path.join(folder, specFileName);
    const intentPath = path.join(folder, intentFileName);
    const specText = readSpec(specPath);

    const specProblems =
      specText === undefined ||
      readDefaultBranchFile(branchChanges.mergeBase, specPath) === specText.trim()
        ? []
        : findDecisionProblems(specText);

    const authorProblems =
      existsSync(intentPath) &&
      readDefaultBranchFile(branchChanges.mergeBase, intentPath) === undefined
        ? findAuthorProblems(readFileSync(intentPath, "utf8"))
        : [];

    return [
      ...specProblems.map(message => `${specPath}: ${message}`),
      ...authorProblems.map(message => `${intentPath}: ${message}`),
    ];
  });
}

/**
 * Report each intent and spec that this branch marks accepted before its pull request merged.
 * @param changeFolders The `intent/<change>` folders.
 * @returns One line per problem.
 */
function findAcceptedStatusLines(changeFolders: string[]): string[] {
  const stages = [
    [intentFileName, specFileName],
    [specFileName, planFileName],
  ] as const;

  const acceptedFiles = changeFolders.flatMap(folder =>
    stages
      .map(([fileName, nextFileName]) => ({
        nextFileName,
        filePath: path.join(folder, fileName),
        nextFilePath: path.join(folder, nextFileName),
      }))
      .filter(
        ({filePath}) => existsSync(filePath) && isAcceptedDocument(readFileSync(filePath, "utf8")),
      ),
  );

  const branchChanges = acceptedFiles.length > 0 ? findBranchChanges() : undefined;

  if (branchChanges === undefined && acceptedFiles.length > 0) {
    return [
      `${defaultBranch} cannot be found, so the "Status: accepted." rule cannot be applied; run "git fetch origin main" to apply it`,
    ];
  }

  return branchChanges === undefined
    ? []
    : acceptedFiles.flatMap(({filePath, nextFileName, nextFilePath}) =>
        findAcceptedStatusProblems(
          nextFileName,
          readDefaultBranchFile(branchChanges.mergeBase, filePath),
          existsSync(nextFilePath),
        ).map(message => `${filePath}: ${message}`),
      );
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

  const problemLines = [
    ...findPlanLines(planPaths),
    ...findMissingPlanLines(changeFolders),
    ...findAcceptedStatusLines(changeFolders),
    ...findRecordLines(changeFolders),
  ];

  for (const planPath of unverifiedPlanPaths) {
    process.stdout.write(
      `${planPath}: the "${acceptedByPrefix}" handle was not checked against the host; set ${hostTokenVariable} and install gh to check who merged the plan's pull request\n`,
    );
  }

  if (problemLines.length > 0) {
    process.stderr.write(`${problemLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Ran ${selfTestCases.length} plan self-tests and found no problem in ${planPaths.length} plans.\n`,
    );
  }
}
