import {existsSync, readFileSync} from "node:fs";
import {parse} from "yaml";

type Tier = "1sigma" | "2sigma" | "3sigma";

type Series = {
  baseline: number[];
  recent: number[];
};

type TierSetting = {
  action: string;
  routes?: string[];
  tools?: string;
};

type Bands = {
  metric: string;
  tiers: Record<Tier, TierSetting>;
};

type Parsed<Value> = {problem: string} | {value: Value};

type Detection = {
  mean: number;
  rule?: string;
  sigma: number;
  tier?: Tier;
};

type DetectionRule = {
  description: string;
  fires: (deviations: number[]) => boolean;
  tier: Tier;
};

type SelfTestCase = {
  name: string;
  passes: boolean;
};

const supportedRules = "western_electric";
const minimumBaselineValues = 8;
const maximumRecentValues = 8;
const bandsPath = "bands.yaml";
const jsonNull: unknown = JSON.parse("null");

/**
 * Check that a value is a plain object.
 * @param value Any parsed value.
 * @returns Whether the value is a non-null, non-array object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check that a value is a list of finite numbers.
 * @param value Any parsed value.
 * @returns Whether the value is an array whose items are all finite numbers.
 */
function isNumberList(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every(item => typeof item === "number" && Number.isFinite(item))
  );
}

/**
 * Check that a value is a list of text.
 * @param value Any parsed value.
 * @returns Whether the value is an array whose items are all text.
 */
function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

/**
 * Read the values file: `{"baseline": number[], "recent": number[]}`.
 * @param text JSON content.
 * @returns The series, or the first problem found.
 */
function readSeries(text: string): Parsed<Series> {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch (error) {
    return {
      problem: `the file is not valid JSON: ${(error as Error).message}`,
    };
  }

  if (!isRecord(data) || !isNumberList(data.baseline) || !isNumberList(data.recent)) {
    return {
      problem: 'the file must be {"baseline": number[], "recent": number[]} with numbers only',
    };
  }

  const {baseline, recent} = data;

  if (baseline.length < minimumBaselineValues) {
    return {
      problem: `"baseline" needs at least ${minimumBaselineValues} values; found ${baseline.length}`,
    };
  }

  if (recent.length === 0 || recent.length > maximumRecentValues) {
    return {
      problem: `"recent" needs 1 to ${maximumRecentValues} values; found ${recent.length}`,
    };
  }

  return {
    value: {
      baseline,
      recent,
    },
  };
}

/**
 * Read one tier of `bands.yaml`.
 * @param value The tier's parsed value.
 * @returns The tier's setting, or undefined when `action` is not text, or `tools` or `routes` has the wrong type.
 */
function readTierSetting(value: unknown): TierSetting | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const {action, routes, tools} = value;
  const isToolsValid = tools === undefined || typeof tools === "string";
  const isRoutesValid = routes === undefined || isTextList(routes);

  if (typeof action !== "string" || action === "") {
    return undefined;
  }

  return isToolsValid && isRoutesValid
    ? {
        action,
        routes,
        tools,
      }
    : undefined;
}

/**
 * Read `bands.yaml`: `metric`, `rules`, and one setting for each of the three tiers.
 * @param text YAML content.
 * @returns The bands, or the first problem found.
 */
function readBands(text: string): Parsed<Bands> {
  let data: unknown;

  try {
    data = parse(text);
  } catch (error) {
    return {
      problem: `the file is not valid YAML: ${(error as Error).message}`,
    };
  }

  if (!isRecord(data)) {
    return {
      problem: "the file must be a YAML mapping with metric, rules, and tiers",
    };
  }

  const {metric, rules, tiers} = data;

  if (typeof metric !== "string" || metric === "") {
    return {
      problem: '"metric" must be the name of the metric',
    };
  }

  if (rules !== supportedRules) {
    return {
      problem: `"rules" must be ${supportedRules}`,
    };
  }

  const tierSettings = isRecord(tiers) ? tiers : {};
  const oneSigma = readTierSetting(tierSettings["1sigma"]);
  const twoSigma = readTierSetting(tierSettings["2sigma"]);
  const threeSigma = readTierSetting(tierSettings["3sigma"]);

  if (oneSigma === undefined || twoSigma === undefined || threeSigma === undefined) {
    return {
      problem:
        'each of "1sigma", "2sigma", and "3sigma" must be set under "tiers" with an "action"; "tools" is text and "routes" is a list',
    };
  }

  return {
    value: {
      metric,
      tiers: {
        "1sigma": oneSigma,
        "2sigma": twoSigma,
        "3sigma": threeSigma,
      },
    },
  };
}

/**
 * Compute the mean and the sample standard deviation; equal values give exactly zero.
 * @param values At least two numbers.
 * @returns The mean and the standard deviation.
 */
function computeMeanAndSigma(values: number[]): {mean: number; sigma: number} {
  const [first = 0] = values;

  if (values.every(value => value === first)) {
    return {
      mean: first,
      sigma: 0,
    };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);

  return {
    mean,
    sigma: Math.sqrt(squares / (values.length - 1)),
  };
}

/**
 * Count the points at least `limit` standard deviations from the mean on one side.
 * @param deviations Distances from the mean in standard deviations.
 * @param limit The distance in standard deviations.
 * @param side 1 for above the mean, -1 for below.
 * @returns The number of points that far on that side.
 */
function countBeyond(deviations: number[], limit: number, side: -1 | 1): number {
  return deviations.filter(deviation => deviation * side >= limit).length;
}

/**
 * Check whether `count` of the last `window` points are `limit` or more standard deviations out on one side.
 * @param deviations Recent distances from the mean in standard deviations, oldest first.
 * @param window How many of the newest points to look at.
 * @param count How many of them must be that far out.
 * @param limit The distance in standard deviations.
 * @returns Whether either side holds enough points.
 */
function hasPointsBeyond(
  deviations: number[],
  window: number,
  count: number,
  limit: number,
): boolean {
  const newest = deviations.slice(-window);

  return countBeyond(newest, limit, 1) >= count || countBeyond(newest, limit, -1) >= count;
}

/**
 * Check whether every point lies on one side of the mean, none on it.
 * @param deviations Distances from the mean in standard deviations.
 * @returns Whether all points are above the mean or all are below it.
 */
function isOneSided(deviations: number[]): boolean {
  return (
    deviations.every(deviation => deviation > 0) || deviations.every(deviation => deviation < 0)
  );
}

const detectionRules: DetectionRule[] = [
  {
    description: "the latest point is 3 sigma from the mean",
    tier: "3sigma",
    fires: deviations => Math.abs(deviations.at(-1) ?? 0) >= 3,
  },
  {
    description: "2 of the last 3 points are 2 sigma out on one side",
    tier: "2sigma",
    fires: deviations => hasPointsBeyond(deviations, 3, 2, 2),
  },
  {
    description: "4 of the last 5 points are 1 sigma out on one side",
    tier: "1sigma",
    fires: deviations => hasPointsBeyond(deviations, 5, 4, 1),
  },
  {
    description: "8 points in a row are on one side of the mean",
    tier: "1sigma",
    fires: deviations => deviations.length === maximumRecentValues && isOneSided(deviations),
  },
];

/**
 * Apply the Western Electric rules to the newest values, using the baseline's mean and standard deviation.
 * @param series The baseline and the recent values.
 * @returns The mean, the standard deviation, and the highest tier that fires with its rule.
 */
function detect(series: Series): Detection {
  const {mean, sigma} = computeMeanAndSigma(series.baseline);

  if (sigma === 0) {
    return series.recent.some(value => value !== mean)
      ? {
          mean,
          sigma,
          rule: "the baseline has no spread and a recent value differs",
          tier: "3sigma",
        }
      : {
          mean,
          sigma,
        };
  }

  const deviations = series.recent.map(value => (value - mean) / sigma);
  const fired = detectionRules.find(({fires}) => fires(deviations));

  return {
    mean,
    sigma,
    rule: fired?.description,
    tier: fired?.tier,
  };
}

/**
 * Build the fields of the output line for a detection.
 * @param bands The bands from `bands.yaml`.
 * @param detection The detection.
 * @returns The fields; absent values are undefined.
 */
function toReport(bands: Bands, detection: Detection): Record<string, unknown> {
  const setting = detection.tier === undefined ? undefined : bands.tiers[detection.tier];

  return {
    metric: bands.metric,
    tier: detection.tier,
    action: setting?.action,
    tools: setting?.tools,
    routes: setting?.routes,
    mean: detection.mean,
    sigma: detection.sigma,
    rule: detection.rule,
  };
}

/**
 * Write the fields as one JSON line, with each absent value as JSON null.
 * @param report The fields from `toReport`.
 * @returns The JSON text.
 */
function serializeReport(report: Record<string, unknown>): string {
  return JSON.stringify(report, (_key, value: unknown) => value ?? jsonNull);
}

const baselineValues = [10, 12, 10, 12, 10, 12, 10, 12];
const nonNumberBaseline = [...baselineValues, "1"];
const shortBaseline = baselineValues.slice(1);

const nineValues = Array.from(
  {
    length: 9,
  },
  () => 1,
);

const fractionBaseline = Array.from(
  {
    length: 8,
  },
  () => 0.1,
);

const flatBaseline = Array.from(
  {
    length: 8,
  },
  () => 5,
);

const baselineMean = 11;
const baselineSigma = computeMeanAndSigma(baselineValues).sigma;

/**
 * Name the tier the rules give for recent values at the given distances from the baseline's mean.
 * @param deviations Distances in standard deviations, oldest first.
 * @returns The tier, or undefined when no rule fires.
 */
function tierAt(...deviations: number[]): Tier | undefined {
  const recent = deviations.map(deviation => baselineMean + deviation * baselineSigma);

  return detect({
    baseline: baselineValues,
    recent,
  }).tier;
}

/**
 * Write a values file.
 * @param baseline The baseline values.
 * @param recent The recent values.
 * @returns The JSON text.
 */
function seriesText(baseline: unknown[], recent: unknown[]): string {
  return JSON.stringify({
    baseline,
    recent,
  });
}

/**
 * Check that a read failed.
 * @param result The result of a read.
 * @returns Whether it holds a problem.
 */
function hasProblem(result: Parsed<unknown>): boolean {
  return "problem" in result;
}

const validBands = [
  "metric: ci_test_failure_rate",
  "rules: western_electric",
  "tiers:",
  "  1sigma: {action: log}",
  '  2sigma: {action: diagnose, tools: "Read,Grep"}',
  "  3sigma: {action: propose, routes: [pull_request]}",
].join("\n");

const validBandsRead = readBands(validBands);
const bandsForReport = "value" in validBandsRead ? validBandsRead.value : undefined;

const twoSigmaReport =
  bandsForReport &&
  serializeReport(
    toReport(bandsForReport, {
      rule: "r",
      tier: "2sigma",
      mean: 1,
      sigma: 1,
    }),
  );

const noTierReport =
  bandsForReport &&
  serializeReport(
    toReport(bandsForReport, {
      mean: 1,
      sigma: 1,
    }),
  );

const selfTestCases: SelfTestCase[] = [
  {
    name: "values inside one sigma",
    passes: tierAt(0.5, -0.5, 0.2) === undefined,
  },
  {
    name: "the latest point at 3 sigma",
    passes: tierAt(0, 0, 3.2) === "3sigma",
  },
  {
    name: "the latest point at -3 sigma",
    passes: tierAt(0, 0, -3.2) === "3sigma",
  },
  {
    name: "a point at 3 sigma that is not the latest",
    passes: tierAt(3.2, 0, 0) === undefined,
  },
  {
    name: "2 of the last 3 at 2 sigma",
    passes: tierAt(2.2, 0, 2.5) === "2sigma",
  },
  {
    name: "2 at 2 sigma on opposite sides",
    passes: tierAt(2.2, 0, -2.5) === undefined,
  },
  {
    name: "one point at 2 sigma",
    passes: tierAt(0, 0, 2.5) === undefined,
  },
  {
    name: "4 of the last 5 at 1 sigma",
    passes: tierAt(1.2, 1.1, 0, 1.5, 1.3) === "1sigma",
  },
  {
    name: "3 of the last 5 at 1 sigma",
    passes: tierAt(1.2, 0, 0, 1.5, 1.3) === undefined,
  },
  {
    name: "8 in a row on one side",
    passes: tierAt(0.1, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1, 0.2) === "1sigma",
  },
  {
    name: "7 in a row on one side",
    passes: tierAt(0.1, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1) === undefined,
  },
  {
    name: "8 in a row with one on the other side",
    passes: tierAt(0.1, 0.2, 0.1, -0.3, 0.1, 0.2, 0.1, 0.2) === undefined,
  },
  {
    name: "the highest tier wins",
    passes: tierAt(2.2, 2.4, 3.5) === "3sigma",
  },
  {
    name: "a baseline without spread and an equal value",
    passes:
      detect({
        baseline: flatBaseline,
        recent: [5],
      }).tier === undefined,
  },
  {
    name: "a baseline of equal fractions and eight equal values",
    passes:
      detect({
        baseline: fractionBaseline,
        recent: fractionBaseline,
      }).tier === undefined,
  },
  {
    name: "a baseline without spread and a different value",
    passes:
      detect({
        baseline: flatBaseline,
        recent: [5, 6],
      }).tier === "3sigma",
  },
  {
    name: "a series with a missing key",
    passes: hasProblem(readSeries('{"baseline": []}')),
  },
  {
    name: "a series with a non-number",
    passes: hasProblem(readSeries(seriesText(nonNumberBaseline, [1]))),
  },
  {
    name: "a baseline of 7 values",
    passes: hasProblem(readSeries(seriesText(shortBaseline, [1]))),
  },
  {
    name: "no recent value",
    passes: hasProblem(readSeries(seriesText(baselineValues, []))),
  },
  {
    name: "9 recent values",
    passes: hasProblem(readSeries(seriesText(baselineValues, nineValues))),
  },
  {
    name: "a series that is not JSON",
    passes: hasProblem(readSeries("{")),
  },
  {
    name: "a valid series",
    passes: "value" in readSeries(seriesText(baselineValues, [1])),
  },
  {
    name: "complete bands",
    passes: bandsForReport !== undefined,
  },
  {
    name: "bands without a tier",
    passes: hasProblem(readBands(validBands.replace("  1sigma: {action: log}\n", ""))),
  },
  {
    name: "bands with a tier without an action",
    passes: hasProblem(readBands(validBands.replace("{action: log}", "{tools: Read}"))),
  },
  {
    name: "bands with another rule set",
    passes: hasProblem(readBands(validBands.replace("western_electric", "nelson"))),
  },
  {
    name: "bands that are not YAML",
    passes: hasProblem(readBands("a: [")),
  },
  {
    name: "a report for a tier with tools",
    passes:
      twoSigmaReport?.includes('"action":"diagnose","tools":"Read,Grep","routes":null') === true,
  },
  {
    name: "a report without a tier",
    passes: noTierReport?.includes('"tier":null,"action":null,"tools":null,"routes":null') === true,
  },
];

const selfTestFailures = selfTestCases.filter(({passes}) => !passes).map(({name}) => name);
const argumentsList = process.argv.slice(2);

/**
 * Print a problem and mark the run as failed.
 * @param message The problem.
 */
function fail(message: string): void {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

/**
 * Detect on a values file and print the JSON line, or print the problem.
 * @param valuesPath The path of the JSON values file.
 */
function run(valuesPath: string): void {
  if (!existsSync(valuesPath)) {
    fail(`${valuesPath}: the file does not exist; pass the path of the JSON values file`);

    return;
  }

  if (!existsSync(bandsPath)) {
    fail(`${bandsPath}: the file does not exist; run this from the project root`);

    return;
  }

  const series = readSeries(readFileSync(valuesPath, "utf8"));
  const bands = readBands(readFileSync(bandsPath, "utf8"));

  if ("problem" in series) {
    fail(`${valuesPath}: ${series.problem}`);
  } else if ("problem" in bands) {
    fail(`${bandsPath}: ${bands.problem}`);
  } else {
    const report = toReport(bands.value, detect(series.value));

    process.stdout.write(`${serializeReport(report)}\n`);
  }
}

/**
 * Validate `bands.yaml` and report the self-tests that ran.
 */
function checkCommittedBands(): void {
  if (!existsSync(bandsPath)) {
    fail(`${bandsPath}: the file does not exist; run this from the project root`);

    return;
  }

  const bands = readBands(readFileSync(bandsPath, "utf8"));

  if ("problem" in bands) {
    fail(`${bandsPath}: ${bands.problem}`);
  } else {
    process.stdout.write(
      `Ran ${selfTestCases.length} bands self-tests and checked ${bandsPath}.\n`,
    );
  }
}

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  fail(`Bands self-tests failed:\n${failureLines.join("\n")}`);
} else if (argumentsList.length === 0) {
  checkCommittedBands();
} else if (argumentsList.length > 1) {
  fail("pass one argument: the path of the JSON file with the baseline and recent values");
} else {
  run(argumentsList.at(0) ?? "");
}
