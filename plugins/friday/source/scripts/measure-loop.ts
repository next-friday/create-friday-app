import {execFileSync} from "node:child_process";
import {existsSync, readdirSync} from "node:fs";
import path from "node:path";

type CommitDates = {
  intent: string[];
  plan: string[];
  spec: string[];
};

type LoopFigures = {
  daysIntentToSpec?: number;
  firstIntent?: string;
  firstPlan?: string;
  firstSpec?: string;
  intentCommitsAfterSpec: number;
  specCommitsAfterPlan: number;
};

type SelfTestCase = {
  dates: CommitDates;
  expected: LoopFigures;
  name: string;
};

const intentDirectory = "intent";
const millisecondsPerDay = 86_400_000;
const secondDay = "2026-01-02T00:00:00+00:00";
const thirdDay = "2026-01-03T00:00:00+00:00";
const firstDay = "2026-01-01T00:00:00+00:00";

const tableHeader = [
  "change",
  "intent",
  "spec",
  "plan",
  "days intent to spec",
  "intent commits after spec",
  "spec commits after plan",
];

/**
 * Find the oldest commit date.
 * @param dates Commit dates in any order.
 * @returns The earliest instant, or undefined when there is no commit.
 */
function findFirstDate(dates: string[]): string | undefined {
  return dates.toSorted((left, right) => Date.parse(left) - Date.parse(right)).at(0);
}

/**
 * Read the change name of a folder that is a direct child of `intent/`.
 * @param changePath Path given on the command line.
 * @returns The folder name, or undefined when the path is not `intent/<change>`.
 */
function readChangeName(changePath: string): string | undefined {
  const segments = path.relative(intentDirectory, changePath).split(path.sep);

  return segments.length === 1 && segments.at(0) !== "" && segments.at(0) !== ".."
    ? segments.at(0)
    : undefined;
}

/**
 * Count the commits made after a moment.
 * @param dates Commit dates.
 * @param moment The date the commits must follow.
 * @returns The number of later commits, or 0 when there is no moment.
 */
function countCommitsAfter(dates: string[], moment: string | undefined): number {
  return moment === undefined
    ? 0
    : dates.filter(date => Date.parse(date) > Date.parse(moment)).length;
}

/**
 * Count the days between two moments.
 * @param from The earlier moment.
 * @param to The later moment.
 * @returns The days rounded to one decimal.
 */
function countDaysBetween(from: string, to: string): number {
  return Math.round(((Date.parse(to) - Date.parse(from)) / millisecondsPerDay) * 10) / 10;
}

/**
 * Compute the loop figures of one change from its commit dates.
 * @param dates Commit dates of `intent.md`, `spec.md` and `plan.md`.
 * @returns The first commit of each file, the days from intent to spec, and the two rework counts.
 */
function summarizeLoop(dates: CommitDates): LoopFigures {
  const firstIntent = findFirstDate(dates.intent);
  const firstSpec = findFirstDate(dates.spec);
  const firstPlan = findFirstDate(dates.plan);

  return {
    firstIntent,
    firstPlan,
    firstSpec,
    ...(firstIntent !== undefined &&
      firstSpec !== undefined && {
        daysIntentToSpec: countDaysBetween(firstIntent, firstSpec),
      }),
    intentCommitsAfterSpec: countCommitsAfter(dates.intent, firstSpec),
    specCommitsAfterPlan: countCommitsAfter(dates.spec, firstPlan),
  };
}

/**
 * Read the dates of the commits that changed a file.
 * @param filePath Path of the file from the repository root.
 * @returns Commit dates in ISO 8601, newest first; empty when git has no commit for the file.
 */
function readCommitDates(filePath: string): string[] {
  return execFileSync("git", ["log", "--format=%cI", "--", filePath], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(line => line !== "");
}

/**
 * Read the commit dates of the three files of a change.
 * @param change Folder name under `intent/`.
 * @returns The commit dates of `intent.md`, `spec.md` and `plan.md`.
 */
function readChangeDates(change: string): CommitDates {
  const readDates = (fileName: string): string[] =>
    readCommitDates(path.join(intentDirectory, change, fileName));

  return {
    intent: readDates("intent.md"),
    plan: readDates("plan.md"),
    spec: readDates("spec.md"),
  };
}

/**
 * Format one change as a table row.
 * @param change Folder name under `intent/`.
 * @param figures The figures of the change.
 * @returns The cells of the row; a figure that does not exist yet is blank.
 */
function formatRow(change: string, figures: LoopFigures): string[] {
  return [
    change,
    figures.firstIntent?.slice(0, 10) ?? "",
    figures.firstSpec?.slice(0, 10) ?? "",
    figures.firstPlan?.slice(0, 10) ?? "",
    String(figures.daysIntentToSpec ?? ""),
    figures.firstSpec === undefined ? "" : String(figures.intentCommitsAfterSpec),
    figures.firstPlan === undefined ? "" : String(figures.specCommitsAfterPlan),
  ];
}

/**
 * Pad the cells of every row to the width of their column.
 * @param rows The header and the rows.
 * @returns One line per row.
 */
function formatTable(rows: string[][]): string[] {
  const widths = tableHeader.map((_, column) =>
    Math.max(...rows.map(row => row.at(column)?.length ?? 0)),
  );

  return rows.map(row =>
    row
      .map((cell, column) => cell.padEnd(widths.at(column) ?? 0))
      .join("  ")
      .trimEnd(),
  );
}

const noFigures: LoopFigures = {
  intentCommitsAfterSpec: 0,
  specCommitsAfterPlan: 0,
};

const selfTestCases: SelfTestCase[] = [
  {
    expected: noFigures,
    name: "a change with no commit",
    dates: {
      intent: [],
      plan: [],
      spec: [],
    },
  },
  {
    name: "an intent without a spec",
    dates: {
      intent: [secondDay],
      plan: [],
      spec: [],
    },
    expected: {
      ...noFigures,
      firstIntent: secondDay,
    },
  },
  {
    name: "rework after the spec and after the plan",
    dates: {
      intent: ["2026-01-05T00:00:00+00:00", "2026-01-01T12:00:00+00:00"],
      plan: ["2026-01-09T00:00:00+00:00", "2026-01-04T00:00:00+00:00"],
      spec: ["2026-01-10T00:00:00+00:00", "2026-01-06T00:00:00+00:00", thirdDay],
    },
    expected: {
      firstSpec: thirdDay,
      firstIntent: "2026-01-01T12:00:00+00:00",
      firstPlan: "2026-01-04T00:00:00+00:00",
      daysIntentToSpec: 1.5,
      intentCommitsAfterSpec: 1,
      specCommitsAfterPlan: 2,
    },
  },
  {
    name: "dates that are not in time order",
    dates: {
      intent: [firstDay, thirdDay, secondDay],
      plan: [],
      spec: [],
    },
    expected: {
      ...noFigures,
      firstIntent: firstDay,
    },
  },
  {
    name: "offsets are compared as instants",
    dates: {
      intent: ["2026-01-01T00:00:00+07:00"],
      plan: [],
      spec: ["2026-01-01T05:00:00+00:00"],
    },
    expected: {
      ...noFigures,
      firstIntent: "2026-01-01T00:00:00+07:00",
      firstSpec: "2026-01-01T05:00:00+00:00",
      daysIntentToSpec: 0.5,
    },
  },
];

const selfTestFailures = selfTestCases
  .filter(({dates, expected}) => {
    const actualRow = formatRow("", summarizeLoop(dates));

    return actualRow.join("|") !== formatRow("", expected).join("|");
  })
  .map(({name}) => name);

if (readChangeName("other/dir/change") !== undefined) {
  selfTestFailures.push("a folder outside intent/ is not a change");
}

if (readChangeName("intent/change") !== "change") {
  selfTestFailures.push("a direct child of intent/ is a change");
}

const changePaths = process.argv.slice(2);

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Loop measure self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const missingLines = changePaths
    .filter(changePath => !existsSync(changePath) || readChangeName(changePath) === undefined)
    .map(
      changePath =>
        `${changePath}: the folder does not exist or is not directly under ${intentDirectory}/; pass the path of an existing intent/<change> folder`,
    );

  if (missingLines.length > 0) {
    process.stderr.write(`${missingLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    const changes =
      changePaths.length > 0
        ? changePaths.map(changePath => readChangeName(changePath) ?? "")
        : readdirSync(intentDirectory, {
            withFileTypes: true,
          })
            .filter(entry => entry.isDirectory())
            .map(({name}) => name);

    const rows = changes.map(change => formatRow(change, summarizeLoop(readChangeDates(change))));

    process.stdout.write(`${formatTable([tableHeader, ...rows]).join("\n")}\n`);
  }
}
