import {existsSync, readFileSync} from "node:fs";

type Problem = {
  file: string;
  message: string;
};

type SetupFiles = {
  codeowners: string;
  security: string;
  zizmor: string;
};

type SelfTestCase = {
  expectedFiles: string[];
  files: SetupFiles;
  name: string;
};

const codeownersPath = ".github/CODEOWNERS";
const securityPath = "SECURITY.md";
const zizmorPath = ".github/zizmor.yml";
const securityPlaceholder = "example.com";
const zizmorPlaceholder = "@your-org/your-team";
const ownersStep = "step 2 (Owners) of SETUP.md";

/**
 * Find the CODEOWNERS problem: no line that is neither blank nor a comment.
 * @param codeowners Content of `.github/CODEOWNERS`.
 * @returns At most one problem.
 */
function findCodeownersProblems(codeowners: string): Problem[] {
  const hasRule = codeowners.split("\n").some(line => {
    const trimmed = line.trim();

    return trimmed !== "" && !trimmed.startsWith("#");
  });

  return hasRule
    ? []
    : [
        {
          file: codeownersPath,
          message: `has no owner line; add the lines ${ownersStep} lists`,
        },
      ];
}

/**
 * Find the placeholder a setup file still holds.
 * @param file Path of the file.
 * @param content Content of the file.
 * @param placeholder Text the template ships and the project must replace.
 * @returns At most one problem.
 */
function findPlaceholderProblems(file: string, content: string, placeholder: string): Problem[] {
  return content.includes(placeholder)
    ? [
        {
          file,
          message: `still contains ${placeholder}; replace it as ${ownersStep} says`,
        },
      ]
    : [];
}

/**
 * Check the files a project must edit once, after it is created from the template.
 * @param files Content of each setup file.
 * @returns Every problem found, each naming its file.
 */
function checkSetup(files: SetupFiles): Problem[] {
  return [
    ...findCodeownersProblems(files.codeowners),
    ...findPlaceholderProblems(securityPath, files.security, securityPlaceholder),
    ...findPlaceholderProblems(zizmorPath, files.zizmor, zizmorPlaceholder),
  ];
}

const configuredFiles: SetupFiles = {
  codeowners: "# Owners\n\n* @acme/platform\n",
  security: "Report vulnerabilities to `security@acme.test`.\n",
  zizmor: "# Owner: @acme/platform.\n",
};

const selfTestCases: SelfTestCase[] = [
  {
    files: configuredFiles,
    name: "every file is configured",
    expectedFiles: [],
  },
  {
    name: "CODEOWNERS holds only comments and blank lines",
    expectedFiles: [codeownersPath],
    files: {
      ...configuredFiles,
      codeowners: "# * @your-org/your-team\n\n",
    },
  },
  {
    name: "CODEOWNERS is empty",
    expectedFiles: [codeownersPath],
    files: {
      ...configuredFiles,
      codeowners: "",
    },
  },
  {
    name: "an indented owner line with CRLF line endings counts",
    expectedFiles: [],
    files: {
      ...configuredFiles,
      codeowners: "# Owners\r\n  * @acme/platform\r\n",
    },
  },
  {
    name: "SECURITY.md keeps the example address",
    expectedFiles: [securityPath],
    files: {
      ...configuredFiles,
      security: "Email `security@example.com`.\n",
    },
  },
  {
    name: "zizmor.yml keeps the owner placeholder",
    expectedFiles: [zizmorPath],
    files: {
      ...configuredFiles,
      zizmor: "# Owner: @your-org/your-team.\n",
    },
  },
  {
    name: "a fresh project fails on all three files",
    expectedFiles: [codeownersPath, securityPath, zizmorPath],
    files: {
      codeowners: "# * @your-org/your-team\n",
      security: "security@example.com\n",
      zizmor: "# Owner: @your-org/your-team.\n",
    },
  },
];

const selfTestFailures = selfTestCases
  .filter(
    ({expectedFiles, files}) =>
      checkSetup(files)
        .map(problem => problem.file)
        .join(",") !== expectedFiles.join(","),
  )
  .map(({name}) => name);

const setupPaths = [codeownersPath, securityPath, zizmorPath];
const missingPaths = setupPaths.filter(setupPath => !existsSync(setupPath));

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Setup self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else if (missingPaths.length > 0) {
  process.stderr.write(`Run from the project root: ${missingPaths.join(", ")} must exist.\n`);
  process.exitCode = 1;
} else {
  const problemLines = checkSetup({
    codeowners: readFileSync(codeownersPath, "utf8"),
    security: readFileSync(securityPath, "utf8"),
    zizmor: readFileSync(zizmorPath, "utf8"),
  }).map(({file, message}) => `${file}: ${message}`);

  if (problemLines.length > 0) {
    process.stderr.write(`${problemLines.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Checked ${setupPaths.length} setup files.\n`);
  }
}
