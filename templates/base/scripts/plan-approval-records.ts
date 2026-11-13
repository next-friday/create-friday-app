import {execFileSync} from "node:child_process";

import {
  acceptedByPrefix,
  defaultBranch,
  intentDirectory,
  maskFencedBlocks,
  readSection,
  runGit,
  splitLines,
  statusLineLimit,
} from "./plan-text.ts";

export type PlanMerge = {
  approvers: string[];
  mergedBy: string;
};

export const concernsHeading = "## Areas of concern";
export const decisionPrefix = "Decision: ";
export const alsoAcceptedByPrefix = "Also accepted by: ";
export const hostTokenVariable = "GH_TOKEN";

const hostRepositoryPath = "repos/{owner}/{repo}";
const authorPrefix = "Author: ";
const authorPattern = /^Author: @[\dA-Za-z][\dA-Za-z-]*[ .]/;
const alsoAcceptedByPattern = /^Also accepted by: @([\dA-Za-z][\dA-Za-z-]*)\.$/;

/**
 * Find a plan that this branch adds together with a change outside `intent/`.
 * @param isOnDefaultBranch Whether the default branch already holds the plan.
 * @param isAcceptanceRequired Whether the branch changes a file outside `intent/`.
 * @returns At most one message.
 */
export function findUnmergedPlanProblems(
  isOnDefaultBranch: boolean,
  isAcceptanceRequired: boolean,
): string[] {
  return isOnDefaultBranch || !isAcceptanceRequired
    ? []
    : [
        `the plan is not on ${defaultBranch} and this branch changes a file outside ${intentDirectory}/; an engineer accepts a plan by merging the pull request that holds only it, so open that pull request and build on a new branch after it is merged`,
      ];
}

/**
 * Compare the plan's accepting handles with the host's record of its pull request.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @param planMerge Who merged the pull request that last changed the plan, and who approved it.
 * @returns One message per handle the host does not confirm.
 */
export function findHostAcceptanceProblems(maskedLines: string[], planMerge: PlanMerge): string[] {
  const acceptedLine = maskedLines.slice(1).find(line => line.trim() !== "") ?? "";
  const accepter = acceptedLine.trimEnd().slice(acceptedByPrefix.length + 1, -1);
  const secondAccepter = readSecondAccepter(maskedLines);

  const mergerProblems =
    accepter.toLowerCase() === planMerge.mergedBy.toLowerCase()
      ? []
      : [
          `the "${acceptedByPrefix}" line names @${accepter}, and the host shows that @${planMerge.mergedBy} merged the plan's pull request; write the account that merged it`,
        ];

  const isSecondConfirmed =
    secondAccepter === undefined ||
    (secondAccepter.toLowerCase() !== planMerge.mergedBy.toLowerCase() &&
      planMerge.approvers.some(
        approver => approver.toLowerCase() === secondAccepter.toLowerCase(),
      ));

  return isSecondConfirmed
    ? mergerProblems
    : [
        ...mergerProblems,
        `the "${alsoAcceptedByPrefix}" line names a second person, and the host shows no approving review from that account on the plan's pull request; write "${alsoAcceptedByPrefix}@<handle>." with the account that approved it`,
      ];
}

/**
 * Find each numbered area of concern in a spec that carries no decision.
 * @param specText Spec content.
 * @returns At most one message, which names the numbers.
 */
export function findDecisionProblems(specText: string): string[] {
  const concernLines = readSection(maskFencedBlocks(splitLines(specText)), concernsHeading) ?? [];

  const undecidedNumbers = concernLines
    .map((line, index) => ({
      index,
      number: /^(\d+)\. /.exec(line)?.[1],
    }))
    .filter(({number}) => number !== undefined)
    .filter(({index}, position, concerns) => {
      const nextIndex = concerns.at(position + 1)?.index ?? concernLines.length;

      return concernLines
        .slice(index + 1, nextIndex)
        .every(
          line => !line.trim().startsWith(decisionPrefix) || line.trim() === decisionPrefix.trim(),
        );
    })
    .map(({number}) => number);

  return undecidedNumbers.length === 0
    ? []
    : [
        `area of concern ${undecidedNumbers.join(", ")} has no "${decisionPrefix}<the decision>." line under it; write the proposed decision there, and the product owner corrects it before merging the spec`,
      ];
}

/**
 * Find an intent whose author is not a handle on the host.
 * @param intentText Intent content.
 * @returns At most one message.
 */
export function findAuthorProblems(intentText: string): string[] {
  const authorLine = splitLines(intentText)
    .slice(0, statusLineLimit)
    .find(line => line.startsWith(authorPrefix));

  return authorLine !== undefined && authorPattern.test(authorLine)
    ? []
    : [
        `the "${authorPrefix}" line holds no handle; write "${authorPrefix}@<handle> (<team>)." with the originator's account on the host`,
      ];
}

/**
 * Ask the host who merged the pull request that last changed a plan on the default branch, and who approved it.
 * @param mergeBase The commit this branch left the default branch at.
 * @param planPath Path of the plan.
 * @returns The merging account and the approving accounts, or undefined when the host cannot be read.
 */
export function readPlanMerge(mergeBase: string, planPath: string): PlanMerge | undefined {
  if (process.env[hostTokenVariable] === undefined || process.env[hostTokenVariable] === "") {
    return undefined;
  }

  try {
    const commit = runGit(["log", "-1", "--format=%H", mergeBase, "--", planPath]);

    const pullRequest = runHost([
      `${hostRepositoryPath}/commits/${commit}/pulls`,
      "--jq",
      ".[0].number",
    ]);

    const mergedBy = runHost([
      `${hostRepositoryPath}/pulls/${pullRequest}`,
      "--jq",
      ".merged_by.login",
    ]);

    const approvers = runHost([
      `${hostRepositoryPath}/pulls/${pullRequest}/reviews`,
      "--jq",
      '.[] | select(.state == "APPROVED") | .user.login',
    ]);

    return mergedBy === ""
      ? undefined
      : {
          mergedBy,
          approvers: approvers.split("\n").filter(approver => approver !== ""),
        };
  } catch {
    return undefined;
  }
}

/**
 * Call the host's API through its command-line tool.
 * @param apiArguments Arguments after `gh api`.
 * @returns Trimmed standard output.
 */
function runHost(apiArguments: string[]): string {
  return execFileSync("gh", ["api", ...apiArguments], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Read the handle on the plan's `Also accepted by:` line.
 * @param maskedLines Plan lines with fenced code blocks emptied.
 * @returns The handle, an empty string when the line is malformed, or undefined when there is no such line.
 */
function readSecondAccepter(maskedLines: string[]): string | undefined {
  const line = maskedLines.find(planLine => planLine.startsWith(alsoAcceptedByPrefix));

  return line === undefined ? undefined : (alsoAcceptedByPattern.exec(line.trimEnd())?.[1] ?? "");
}
