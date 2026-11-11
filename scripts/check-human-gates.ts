import {existsSync, readdirSync, readFileSync, statSync} from "node:fs";
import path from "node:path";

type Problem = {
  line: number;
  message: string;
  rule: string;
};

type Step = {
  line: number;
  text: string;
};

type SelfTestCase = {
  expectedRule?: string;
  name: string;
  text: string;
};

const playbookDirectory = ".agents/skills/sdlc/playbooks";
const agentOwnedWorkRule = ".agents/rules/agent-owned-work.md";
const nextMarker = "**Next:**";

const humanGateRoles = [
  "originator",
  "product owner",
  "engineer",
  "code owner",
  "release manager",
  "service owner",
];

const roleWords = new RegExp(String.raw`\b(?:${humanGateRoles.join("|")})s?\b`, "i");

const waitingWordList = [
  "wait",
  "waits",
  "approve",
  "approves",
  "approval",
  "approved",
  "approving",
  "confirm",
  "confirms",
  "confirmation",
  "permission",
  "sign off",
  "sign-off",
  "authorize",
  "authorizes",
];

const waitingWords = new RegExp(String.raw`\b(?:${waitingWordList.join("|")})\b`, "i");
const roleList = humanGateRoles.join(", ");

/**
 * Blank every line of a fenced code block, keeping line numbers.
 * @param text Playbook content with LF line endings.
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
 * Split a playbook into its numbered steps, each with its indented continuation lines.
 * @param text Playbook content.
 * @returns The steps with the line each starts on.
 */
function splitSteps(text: string): Step[] {
  return Array.from(text.matchAll(/^(?:\d+\.|[-*+]) .*(?:\n[\t ]+\S.*)*/gm), match => ({
    line: text.slice(0, match.index).split("\n").length,
    text: match[0],
  }));
}

/**
 * Find gate lines whose bold sentence names no human gate role.
 * @param lines Playbook lines.
 * @returns One problem per such line.
 */
function findGateProblems(lines: string[]): Problem[] {
  return lines
    .map((text, index) => ({
      text,
      line: index + 1,
    }))
    .filter(({text}) => text.includes("**Gate:"))
    .filter(({text}) => !roleWords.test(/\*\*Gate:(.*?)\*\*/.exec(text)?.[1] ?? ""))
    .map(({line}) => ({
      line,
      rule: "A",
      message: `a gate must name one of ${roleList} inside its bold sentence; write "**Gate: the <role> <does what>.**"`,
    }));
}

/**
 * Find steps that wait, approve, or confirm without naming a human gate role.
 * @param text Playbook content.
 * @returns One problem per such step.
 */
function findWaitingStepProblems(text: string): Problem[] {
  return splitSteps(text)
    .filter(step => waitingWords.test(step.text) && !roleWords.test(step.text))
    .map(step => ({
      rule: "B",
      line: step.line,
      message: `a step that waits, approves, or confirms must name who does it: one of ${roleList}`,
    }));
}

/**
 * Tell whether a path is a relative path without `..` to an existing regular file.
 * @param targetPath Path from a `**Next:**` target.
 * @returns True when the path is usable.
 */
function isProjectFile(targetPath: string): boolean {
  const segments = targetPath.split(/[\\/]/);

  return (
    !path.isAbsolute(targetPath) &&
    !segments.includes("..") &&
    statSync(targetPath, {
      throwIfNoEntry: false,
    })?.isFile() === true
  );
}

/**
 * Describe what is wrong with the text after a `**Next:**` marker.
 * @param text The text after the marker.
 * @returns The problem, or an empty string when the line is valid.
 */
function describeNextProblem(text: string): string {
  const parts = text.replace(/\.\s*$/, "").split(";");

  if (parts.length !== 3 || parts.some(part => part.trim() === "")) {
    return `"${nextMarker}" needs exactly three non-empty parts separated by ";" and no other ";": the target, who runs it, and what starts it`;
  }

  const target = parts.at(0)?.trim() ?? "";
  const targetPath = /^`([^`\s]+)`$/.exec(target)?.[1];

  return target !== "none" && (targetPath === undefined || !isProjectFile(targetPath))
    ? `the "${nextMarker}" target must be "none" or one backticked relative path to an existing file in the project, with no ".." segment, found ${target}`
    : "";
}

/**
 * Find a missing, repeated, or malformed `**Next:**` line.
 * @param lines Playbook lines.
 * @returns The problems with the next-step line.
 */
function findNextProblems(lines: string[]): Problem[] {
  const nextLines = lines
    .map((text, index) => ({
      text,
      line: index + 1,
    }))
    .filter(({text}) => text.startsWith(nextMarker));

  const next = nextLines.at(0);

  if (next === undefined || nextLines.length !== 1) {
    return [
      {
        rule: "C",
        line: next?.line ?? 1,
        message: `a playbook needs exactly one line starting with "${nextMarker}", found ${nextLines.length}; write "${nextMarker} <target>; <who runs it>; <what starts it>."`,
      },
    ];
  }

  const message = describeNextProblem(next.text.slice(nextMarker.length));

  return message === ""
    ? []
    : [
        {
          message,
          rule: "C",
          line: next.line,
        },
      ];
}

/**
 * Check one playbook against rules A, B, and C.
 * @param text Playbook content.
 * @returns Every problem found.
 */
function checkPlaybook(text: string): Problem[] {
  const unfenced = maskFencedBlocks(text.replaceAll("\r\n", "\n"));
  const lines = unfenced.split("\n");

  return [
    ...findGateProblems(lines),
    ...findWaitingStepProblems(unfenced),
    ...findNextProblems(lines),
  ];
}

/**
 * List the human gate roles a rule text does not mention.
 * @param ruleText Content of the agent-owned work rule.
 * @returns The missing roles.
 */
function findMissingRoles(ruleText: string): string[] {
  return humanGateRoles.filter(role => !new RegExp(String.raw`\b${role}s?\b`, "i").test(ruleText));
}

const validNext = "**Next:** none; the person; when they write.";

const selfTestCases: SelfTestCase[] = [
  {
    name: "gate names a role",
    text: `**Gate: the originator corrects the draft.**\n\n${validNext}`,
  },
  {
    expectedRule: "A",
    name: "gate names no role",
    text: `**Gate: the manager corrects the draft.**\n\n${validNext}`,
  },
  {
    expectedRule: "A",
    name: "role outside the bold gate sentence",
    text: `**Gate: the draft is corrected.** The originator does it.\n\n${validNext}`,
  },
  {
    name: "waiting step names a role",
    text: `1. Wait for the engineer.\n\n${validNext}`,
  },
  ...waitingWordList.map(word => ({
    expectedRule: "B",
    name: `waiting word "${word}" names no role`,
    text: `1. Ask, then ${word} for the answer.\n\n${validNext}`,
  })),
  {
    expectedRule: "B",
    name: "waiting bullet names no role",
    text: `- Wait for the answer.\n\n${validNext}`,
  },
  {
    name: "waiting bullet names a role",
    text: `- Wait for the engineer.\n\n${validNext}`,
  },
  {
    name: "plural role",
    text: `1. Wait for the engineers and the code owners.\n\n${validNext}`,
  },
  {
    expectedRule: "B",
    name: "longer word that starts with a role",
    text: `1. Wait for the engineering team.\n\n${validNext}`,
  },
  {
    name: "CRLF line endings",
    text: `1. Ask, then wait.\r\n   - The code owner answers.\r\n\r\n${validNext}\r\n`,
  },
  {
    name: "gate inside a fenced block",
    text: `\`\`\`\n**Gate: the manager corrects the draft.**\n\`\`\`\n\n${validNext}`,
  },
  {
    name: "next inside a fenced block",
    text: `\`\`\`\n**Next:** none; ; x\n\`\`\`\n\n${validNext}`,
  },
  {
    expectedRule: "B",
    name: "waiting word on a continuation line",
    text: `1. Ask.\n   - Wait for the answer.\n\n${validNext}`,
  },
  {
    name: "role on a continuation line covers the step",
    text: `1. Ask, then wait.\n   - The code owner answers.\n\n${validNext}`,
  },
  {
    name: "target is an existing path",
    text: "**Next:** `package.json`; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "target path does not exist",
    text: "**Next:** `missing/file.md`; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "target is an absolute path",
    text: "**Next:** `/etc/hostname`; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "target has a .. segment",
    text: "**Next:** `.agents/../package.json`; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "target is a directory",
    text: "**Next:** `.agents`; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "target is not backticked",
    text: "**Next:** package.json; an agent; when asked.",
  },
  {
    expectedRule: "C",
    name: "next has two parts",
    text: "**Next:** none; the person.",
  },
  {
    expectedRule: "C",
    name: "next has an empty part",
    text: "**Next:** none; ; when they write.",
  },
  {
    expectedRule: "C",
    name: "next is missing",
    text: "1. Answer.",
  },
  {
    expectedRule: "C",
    name: "next appears twice",
    text: `${validNext}\n${validNext}`,
  },
];

const selfTestFailures = selfTestCases
  .filter(({expectedRule, text}) => {
    const rules = checkPlaybook(text).map(problem => problem.rule);

    return expectedRule === undefined ? rules.length > 0 : rules.join(",") !== expectedRule;
  })
  .map(({name}) => name);

if (!findMissingRoles("the engineering team").includes("engineer")) {
  selfTestFailures.push("a longer word that starts with a role names that role");
}

if (findMissingRoles(humanGateRoles.map(role => `${role}s`).join(" ")).length > 0) {
  selfTestFailures.push("a rule naming every role in the plural has a missing role");
}

if (existsSync(playbookDirectory) && existsSync(agentOwnedWorkRule)) {
  if (selfTestFailures.length > 0) {
    const failureLines = selfTestFailures.map(name => `- ${name}`);

    process.stderr.write(`Human gate self-tests failed:\n${failureLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    const playbooks = readdirSync(playbookDirectory)
      .filter(name => name.endsWith(".md"))
      .map(name => `${playbookDirectory}/${name}`);

    const problemLines = [
      ...playbooks.flatMap(playbook =>
        checkPlaybook(readFileSync(playbook, "utf8")).map(
          ({line, message}) => `${playbook}:${line}: ${message}`,
        ),
      ),
      ...findMissingRoles(readFileSync(agentOwnedWorkRule, "utf8")).map(
        role =>
          `${agentOwnedWorkRule}:1: the human gate role "${role}" is missing; name it in the rule or remove it from scripts/check-human-gates.ts`,
      ),
    ];

    if (problemLines.length > 0) {
      process.stderr.write(`${problemLines.join("\n")}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `Checked ${playbooks.length} playbooks against ${humanGateRoles.length} human gate roles.\n`,
      );
    }
  }
} else {
  process.stderr.write(
    `Run from the project root: ${playbookDirectory} and ${agentOwnedWorkRule} must exist.\n`,
  );

  process.exitCode = 1;
}
