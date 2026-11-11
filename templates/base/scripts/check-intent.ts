import {existsSync, readFileSync} from "node:fs";

type Problem = {
  line: number;
  message: string;
};

type Heading = {
  line: number;
  text: string;
};

type SelfTestCase = {
  expectedMessagePart?: string;
  name: string;
  text: string;
};

const problemHeading = "## Problem";
const constraintsHeading = "## Constraints";
const openQuestionsHeading = "## Open questions";

const requiredHeadings = [
  problemHeading,
  "## Proposed outcome",
  "## Affected users and systems",
  constraintsHeading,
  openQuestionsHeading,
];

const titlePattern = /^# Intent: \S/;
const statusPattern = /Status: (?:draft|accepted|rejected|done)\.$/;

/**
 * Blank every line of a fenced code block, keeping line numbers.
 * @param text Intent content with LF line endings.
 * @returns The content with fenced lines emptied.
 */
function maskFencedBlocks(text: string): string {
  let isFenced = false;

  return text
    .split("\n")
    .map(line => {
      const isFence = /^\s*(?:```|~~~)/.test(line);
      const isMasked = isFenced || isFence;

      isFenced = isFence ? !isFenced : isFenced;

      return isMasked ? "" : line;
    })
    .join("\n");
}

/**
 * Find a first line that is not `# Intent: <title>`.
 * @param lines Intent lines.
 * @returns At most one problem.
 */
function findTitleProblems(lines: string[]): Problem[] {
  return titlePattern.test(lines.at(0) ?? "")
    ? []
    : [
        {
          message:
            'line 1 must be "# Intent: <title>" with a non-empty title; write the change\'s name after "# Intent: "',
          line: 1,
        },
      ];
}

/**
 * Find a missing or malformed author line.
 * @param lines Intent lines.
 * @returns At most one problem.
 */
function findAuthorProblems(lines: string[]): Problem[] {
  const authorLines = lines
    .map((text, index) => ({
      line: index + 1,
      text: text.trimEnd(),
    }))
    .filter(({text}) => text.startsWith("Author: "));

  if (authorLines.length > 1) {
    return [
      {
        message: 'only one author line is allowed; remove the extra "Author: " line',
        line: authorLines.at(1)?.line ?? 1,
      },
    ];
  }

  const authorLine = authorLines.at(0);

  return authorLine !== undefined && statusPattern.test(authorLine.text)
    ? []
    : [
        {
          message:
            'an author line must start with "Author: " and end with "Status: draft.", "Status: accepted.", "Status: rejected." or "Status: done."; write "Author: <name> (<team>). Status: draft."',
          line: authorLine?.line ?? 1,
        },
      ];
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
 * @param headings The level-2 headings with their line numbers.
 * @returns At most one problem.
 */
function findHeadingProblems(headings: Heading[]): Problem[] {
  const texts = headings.map(({text}) => text);
  const expected = quoteHeadings(requiredHeadings);

  return texts.join("\n") === requiredHeadings.join("\n")
    ? []
    : [
        {
          line: headings.at(0)?.line ?? 1,
          message: `the level-2 headings must be exactly, in order: ${expected}; found ${quoteHeadings(texts)}`,
        },
      ];
}

/**
 * Find sections without text.
 * @param lines Intent lines.
 * @param headings The level-2 headings with their line numbers.
 * @returns One problem per empty section.
 */
function findEmptySectionProblems(lines: string[], headings: Heading[]): Problem[] {
  return headings
    .filter(({line}, index) => {
      const end = headings.at(index + 1)?.line ?? lines.length + 1;

      return (
        lines
          .slice(line, end - 1)
          .join("\n")
          .trim() === ""
      );
    })
    .map(({line, text}) => ({
      line,
      message: `the section "${text}" is empty; write its text or its open question`,
    }));
}

/**
 * Find a Problem section that holds no digit outside fenced code blocks.
 * @param lines Intent lines.
 * @param maskedLines Intent lines with fenced code blocks emptied.
 * @param headings The level-2 headings with their line numbers.
 * @returns At most one problem.
 */
function findProblemNumberProblems(
  lines: string[],
  maskedLines: string[],
  headings: Heading[],
): Problem[] {
  const index = headings.findIndex(({text}) => text === problemHeading);
  const start = headings.at(index)?.line;

  if (start === undefined) {
    return [];
  }

  const end = headings.at(index + 1)?.line ?? lines.length + 1;
  const body = lines.slice(start, end - 1).join("\n");
  const unfencedBody = maskedLines.slice(start, end - 1).join("\n");

  return body.trim() === "" || /\d/.test(unfencedBody)
    ? []
    : [
        {
          line: start,
          message: `the section "${problemHeading}" has no number; state the measured value, its source, and the time`,
        },
      ];
}

/**
 * Check one intent against the template in `.agents/skills/sdlc/playbooks/plan.md`.
 * @param text Intent content.
 * @returns Every problem found.
 */
function checkIntent(text: string): Problem[] {
  const lines = text
    .replace(/^\u{FEFF}/u, "")
    .replaceAll("\r\n", "\n")
    .split("\n");

  const maskedLines = maskFencedBlocks(lines.join("\n")).split("\n");

  const headings = maskedLines
    .map((line, index) => ({
      line: index + 1,
      text: line.trimEnd(),
    }))
    .filter(({text: heading}) => heading.startsWith("## "));

  return [
    ...findTitleProblems(maskedLines),
    ...findAuthorProblems(maskedLines),
    ...findHeadingProblems(headings),
    ...findEmptySectionProblems(lines, headings),
    ...findProblemNumberProblems(lines, maskedLines, headings),
  ];
}

const titleLine = "# Intent: Health check answers 200";
const authorLine = "Author: maintain job (alert 1). Status: draft.";
const problemText = "GET /health returned 500 on 12 of 12 requests, from the alert log.";
const constraintsSection = `${constraintsHeading}\n\nNone.\n\n`;
const headingsPart = "level-2 headings";
const authorPart = "author line";
const statusDraft = "Status: draft.";

const validIntent = [
  titleLine,
  "",
  authorLine,
  "",
  problemHeading,
  "",
  problemText,
  "",
  "## Proposed outcome",
  "",
  "GET /health answers 200.",
  "",
  "## Affected users and systems",
  "",
  "The load balancer.",
  "",
  constraintsHeading,
  "",
  "None.",
  "",
  openQuestionsHeading,
  "",
  "Which commit broke it?",
  "",
].join("\n");

const selfTestCases: SelfTestCase[] = [
  {
    text: validIntent,
    name: "a complete intent",
  },
  {
    name: "status is done",
    text: validIntent.replace(statusDraft, "Status: done."),
  },
  {
    name: "CRLF line endings",
    text: validIntent.replaceAll("\n", "\r\n"),
  },
  {
    name: "headings inside a fenced block are ignored",
    text: validIntent.replace("None.", "```\n## Extra\n```"),
  },
  {
    expectedMessagePart: "line 1",
    name: "title is missing",
    text: validIntent.replace(titleLine, "# Health check"),
  },
  {
    expectedMessagePart: "line 1",
    name: "title is empty",
    text: validIntent.replace(titleLine, "# Intent: "),
  },
  {
    expectedMessagePart: authorPart,
    name: "author line is missing",
    text: validIntent.replace(`${authorLine}\n`, ""),
  },
  {
    expectedMessagePart: authorPart,
    name: "status is not a known value",
    text: validIntent.replace(statusDraft, "Status: open."),
  },
  {
    expectedMessagePart: authorPart,
    name: "status has no final period",
    text: validIntent.replace(statusDraft, "Status: draft"),
  },
  {
    expectedMessagePart: headingsPart,
    name: "a heading is missing",
    text: validIntent.replace(constraintsSection, ""),
  },
  {
    expectedMessagePart: headingsPart,
    name: "a heading is misspelled",
    text: validIntent.replace(constraintsHeading, "## Constraint"),
  },
  {
    expectedMessagePart: headingsPart,
    name: "headings are out of order",
    text: [
      validIntent.split("\n## ", 1).at(0),
      ...validIntent.split("\n## ").slice(1).toReversed(),
    ].join("\n## "),
  },
  {
    expectedMessagePart: headingsPart,
    name: "an extra heading",
    text: `${validIntent}\n## Extra\n\nText.\n`,
  },
  {
    name: "a BOM before the title",
    text: `\u{FEFF}${validIntent}`,
  },
  {
    expectedMessagePart: authorPart,
    name: "status is not at the end of the author line",
    text: validIntent.replace(statusDraft, "Status: draft. Reviewed."),
  },
  {
    expectedMessagePart: authorPart,
    name: "a second author line",
    text: `${validIntent}\nAuthor: second. Status: draft.\n`,
  },
  {
    expectedMessagePart: "is empty",
    name: "a section is empty",
    text: validIntent.replace("None.", ""),
  },
  {
    expectedMessagePart: "has no number",
    name: "problem has no digit",
    text: validIntent.replace(problemText, "GET /health fails."),
  },
  {
    expectedMessagePart: "has no number",
    name: "problem has a digit only inside a fenced block",
    text: validIntent.replace(problemText, "GET /health fails.\n\n```\n500\n```"),
  },
];

const selfTestFailures = selfTestCases
  .filter(({expectedMessagePart, text}) => {
    const messages = checkIntent(text).map(problem => problem.message);

    return expectedMessagePart === undefined
      ? messages.length > 0
      : messages.length !== 1 || !messages.at(0)?.includes(expectedMessagePart);
  })
  .map(({name}) => name);

const intentPaths = process.argv.slice(2);

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Intent self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else if (intentPaths.length === 0) {
  process.stdout.write(`Ran ${selfTestCases.length} intent self-tests.\n`);
} else {
  const missingLines = intentPaths
    .filter(intentPath => !existsSync(intentPath))
    .map(
      intentPath =>
        `${intentPath}:1: the file does not exist; pass the path of an existing intent.md`,
    );

  const checkedLines = intentPaths
    .filter(intentPath => existsSync(intentPath))
    .flatMap(intentPath =>
      checkIntent(readFileSync(intentPath, "utf8")).map(
        ({line, message}) => `${intentPath}:${line}: ${message}`,
      ),
    );

  const problemLines = [...missingLines, ...checkedLines];

  if (problemLines.length > 0) {
    process.stderr.write(`${problemLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Checked ${intentPaths.length} intents.\n`);
  }
}
