import {execFileSync} from "node:child_process";

export const defaultBranch = "origin/main";
export const intentDirectory = "intent";
export const statusLineLimit = 5;
export const acceptedByPrefix = "Accepted by: ";

/**
 * Run git in the current directory.
 * @param gitArguments Arguments after `git`.
 * @returns Trimmed standard output.
 */
export function runGit(gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Blank every line of a fenced code block, keeping line numbers.
 * @param lines Document lines.
 * @returns The lines with fenced ones emptied.
 */
export function maskFencedBlocks(lines: string[]): string[] {
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
export function splitLines(text: string): string[] {
  return text
    .replace(/^\u{FEFF}/u, "")
    .replaceAll("\r\n", "\n")
    .split("\n");
}

/**
 * Find the lines of a level-2 section.
 * @param maskedLines Document lines with fenced code blocks emptied.
 * @param heading The section heading.
 * @returns The first line after the heading and the line of the next level-2 heading, or undefined when the heading is absent.
 */
export function findSectionBounds(
  maskedLines: string[],
  heading: string,
): [number, number] | undefined {
  const start = maskedLines.findIndex(line => line.trimEnd() === heading);

  if (start === -1) {
    return undefined;
  }

  const nextHeading = maskedLines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );

  return [start + 1, nextHeading === -1 ? maskedLines.length : nextHeading];
}

/**
 * Collect the text of a level-2 section.
 * @param maskedLines Document lines with fenced code blocks emptied.
 * @param heading The section heading.
 * @returns The lines under the heading up to the next level-2 heading, or undefined when the heading is absent.
 */
export function readSection(maskedLines: string[], heading: string): string[] | undefined {
  const bounds = findSectionBounds(maskedLines, heading);

  return bounds === undefined ? undefined : maskedLines.slice(...bounds);
}
