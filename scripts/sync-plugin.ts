import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";

type AgentConfig = {
  description: string;
  readonly?: boolean;
  tools?: string[];
};

type Adapter = {
  agentFields: (agent: AgentConfig) => string[];
  directory: string;
  hasAuthoredEvals: boolean;
  manifest: Record<string, string>;
  manifestPath: string;
};

type SelfTestCase = {
  expected: string[];
  name: string;
  problems: string[];
};

const pluginRoot = "plugins/sdlc";
const sourceRoot = path.join(pluginRoot, "source");
const adaptersRoot = path.join(pluginRoot, "adapters");
const vendorNamesPath = path.join(adaptersRoot, "vendor-names.json");
const subagentConfigPath = path.join(adaptersRoot, "agents.json");
const claudeMarketplacePath = ".claude-plugin/marketplace.json";
const settingsPath = ".claude/settings.json";
const marketplacePaths = [claudeMarketplacePath, ".cursor-plugin/marketplace.json"];
const textExtensions = new Set([".json", ".md", ".sh", ".ts", ".yaml", ".yml"]);
const ignoredDirectories = new Set(["results"]);

const manifestFields = {
  name: "sdlc",
  description:
    "Runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a verifier subagent, and the default policies.",
  license: "MIT",
  homepage: "https://github.com/next-friday/next-friday-create-app/tree/main/plugins/sdlc",
  repository: "https://github.com/next-friday/next-friday-create-app",
};

/**
 * Find the subagent frontmatter fields the Claude Code adapter reads.
 * @param agent Subagent configuration.
 * @returns The `tools` field when the subagent lists tools.
 */
function findClaudeAgentFields(agent: AgentConfig): string[] {
  return agent.tools === undefined ? [] : [`tools: ${agent.tools.join(", ")}`];
}

/**
 * Find the subagent frontmatter fields the Cursor adapter reads.
 * @param agent Subagent configuration.
 * @returns The `readonly` field when the subagent sets it.
 */
function findCursorAgentFields(agent: AgentConfig): string[] {
  return agent.readonly === undefined ? [] : [`readonly: ${agent.readonly}`];
}

const adapters: Adapter[] = [
  {
    manifest: manifestFields,
    agentFields: findClaudeAgentFields,
    directory: "claude-code",
    manifestPath: ".claude-plugin/plugin.json",
    hasAuthoredEvals: true,
  },
  {
    agentFields: findCursorAgentFields,
    directory: "cursor",
    manifestPath: ".cursor-plugin/plugin.json",
    hasAuthoredEvals: false,
    manifest: {
      ...manifestFields,
      skills: "./skills/",
      agents: "./agents/",
    },
  },
];

const referencePattern = /\]\(([^\s)]+)\)|(?<![\w./-])(\.\.?\/[^\s"'<>)\]`]*)/g;
const urlScheme = /^[a-z][\d+.a-z-]*:/i;

/**
 * List every text file under a directory, as paths relative to it.
 * @param directory Directory to read; a missing directory has no files.
 * @param shouldSkipResults Whether to skip the folders that tools write, such as `results`.
 * @returns Relative file paths.
 */
function listFiles(directory: string, shouldSkipResults: boolean): string[] {
  return existsSync(directory)
    ? readdirSync(directory, {
        recursive: true,
        withFileTypes: true,
      })
        .filter(entry => entry.isFile())
        .map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)))
        .filter(
          file =>
            !shouldSkipResults ||
            file.split(path.sep).every(segment => !ignoredDirectories.has(segment)),
        )
    : [];
}

/**
 * Render a subagent with the frontmatter fields its tool reads.
 * @param name Subagent name.
 * @param fields Frontmatter fields after `name` and `description`.
 * @param agent Subagent configuration.
 * @param body Shared subagent body.
 * @returns The subagent file content.
 */
function renderAgent(name: string, fields: string[], agent: AgentConfig, body: string): string {
  return [
    `---`,
    `name: ${name}`,
    `description: ${agent.description}`,
    ...fields,
    `---`,
    ``,
    body,
  ].join("\n");
}

/**
 * Tell whether a reference leaves the plugin directory.
 * @param filePath Path of the file that holds the reference, from the repository root.
 * @param target Link target or path token.
 * @returns True for an absolute path, or a relative one that resolves outside the plugin directory.
 */
function isEscapingReference(filePath: string, target: string): boolean {
  const root = path.resolve(pluginRoot);
  const resolved = path.resolve(path.dirname(filePath), target.split("#", 1)[0] ?? "");

  return (
    target.startsWith("/") || (resolved !== root && !resolved.startsWith(`${root}${path.sep}`))
  );
}

/**
 * Find the references in a file that resolve outside the plugin directory.
 * @param filePath Path of the file from the repository root.
 * @param text File content.
 * @returns One message per reference that leaves the plugin directory.
 */
function findEscapingReferences(filePath: string, text: string): string[] {
  return Array.from(text.matchAll(referencePattern), ([, link, token]) => link ?? token ?? "")
    .filter(target => !urlScheme.test(target) && !target.startsWith("#"))
    .filter(target => isEscapingReference(filePath, target))
    .map(target => `${filePath}: ${target} leaves ${pluginRoot}/`);
}

/**
 * Find the names a file must not contain.
 * @param filePath Path of the file from the repository root.
 * @param text File content.
 * @param names Model and agent tool names from `vendor-names.json`.
 * @returns One message per name found.
 */
function findVendorNames(filePath: string, text: string, names: string[]): string[] {
  const lowerText = text.toLowerCase();

  return names
    .filter(name => {
      const parts = lowerText.split(name.toLowerCase());

      return parts
        .slice(0, -1)
        .some((before, index) => !/\w$/.test(before) && !/^\w/.test(parts[index + 1] ?? ""));
    })
    .map(name => `${filePath}: names "${name}"`);
}

/**
 * Find a `version` key in a manifest or in a marketplace file.
 * @param filePath Path of the manifest from the repository root.
 * @param text Manifest content.
 * @returns A message when the file holds a version at its top level, in `metadata`, or in a plugin entry.
 */
function findVersionKey(filePath: string, text: string): string[] {
  const {
    metadata,
    version,
    plugins = [],
  } = JSON.parse(text) as {
    metadata?: {version?: string};
    plugins?: {version?: string}[];
    version?: string;
  };

  const hasVersion = [version, metadata?.version, ...plugins.map(entry => entry.version)].some(
    value => value !== undefined,
  );

  return hasVersion ? [`${filePath}: holds a version key`] : [];
}

/**
 * Find what the repository's Claude Code settings lack to load the plugin from this tree.
 * @param settingsText Content of the settings file, or undefined when the file is missing.
 * @param pluginKey The plugin as `<plugin>@<marketplace>`.
 * @param marketplaceName The marketplace name.
 * @returns A message when the settings do not enable the plugin and register its marketplace.
 */
function findSettingsProblems(
  settingsText: string | undefined,
  pluginKey: string,
  marketplaceName: string,
): string[] {
  const {enabledPlugins, extraKnownMarketplaces} = JSON.parse(settingsText ?? "{}") as {
    enabledPlugins?: Record<string, boolean>;
    extraKnownMarketplaces?: Record<string, unknown>;
  };

  return enabledPlugins?.[pluginKey] === true &&
    extraKnownMarketplaces?.[marketplaceName] !== undefined
    ? []
    : [
        `${settingsPath}: must enable "${pluginKey}" under enabledPlugins and name "${marketplaceName}" under extraKnownMarketplaces; a person commits this file`,
      ];
}

/**
 * Render every adapter from the source.
 * @returns The expected content of each adapter file, by path from the repository root.
 */
function renderAdapters(): Map<string, string> {
  const expected = new Map<string, string>();
  const skillsDirectory = path.join(sourceRoot, "skills");
  const agentsDirectory = path.join(sourceRoot, "agents");

  const agentsConfig = JSON.parse(readFileSync(subagentConfigPath, "utf8")) as Record<
    string,
    AgentConfig
  >;

  for (const adapter of adapters) {
    const adapterRoot = path.join(adaptersRoot, adapter.directory);

    expected.set(
      path.join(adapterRoot, adapter.manifestPath),
      `${JSON.stringify(adapter.manifest, undefined, 2)}\n`,
    );

    for (const file of listFiles(skillsDirectory, false)) {
      expected.set(
        path.join(adapterRoot, "skills", file),
        readFileSync(path.join(skillsDirectory, file), "utf8"),
      );
    }

    for (const [name, agent] of Object.entries(agentsConfig)) {
      const body = readFileSync(path.join(agentsDirectory, `${name}.md`), "utf8");

      expected.set(
        path.join(adapterRoot, "agents", `${name}.md`),
        renderAgent(name, adapter.agentFields(agent), agent, body),
      );
    }
  }

  return expected;
}

const subagent: AgentConfig = {
  description: "d",
};

const versionProblem = "m.json: holds a version key";
const testPluginKey = "p@m";
const testMarketplaceName = "m";
const settingsProblem = `${settingsPath}: must enable "${testPluginKey}" under enabledPlugins and name "${testMarketplaceName}" under extraKnownMarketplaces; a person commits this file`;

const selfTestCases: SelfTestCase[] = [
  {
    name: "a link into the plugin passes",
    expected: [],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/skills/sdlc/SKILL.md"),
      "[a](playbooks/build.md) and `../../brand-policy/SKILL.md` and [b](https://example.com/../x)",
    ),
  },
  {
    name: "a link above the plugin fails",
    expected: [`${path.join(pluginRoot, "source/a.md")}: ../../../AGENTS.md leaves ${pluginRoot}/`],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/a.md"),
      "[x](../../../AGENTS.md)",
    ),
  },
  {
    name: "an import above the plugin fails",
    expected: [
      `${path.join(pluginRoot, "source/scripts/a.ts")}: ../../../../scripts/b.ts leaves ${pluginRoot}/`,
    ],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/scripts/a.ts"),
      'import "../../../../scripts/b.ts";',
    ),
  },
  {
    name: "an absolute link fails",
    expected: [`${path.join(pluginRoot, "a.md")}: /etc/passwd leaves ${pluginRoot}/`],
    problems: findEscapingReferences(path.join(pluginRoot, "a.md"), "[x](/etc/passwd)"),
  },
  {
    name: "a listed name fails in any case and an unlisted one passes",
    expected: ['a.md: names "Vendor"'],
    problems: findVendorNames("a.md", "VENDOR and others", ["Vendor", "Other"]),
  },
  {
    name: "a listed name inside a longer word passes",
    expected: [],
    problems: findVendorNames("a.md", "vendors and unvendored", ["Vendor"]),
  },
  {
    name: "a manifest with a version fails",
    expected: [versionProblem],
    problems: findVersionKey("m.json", '{"name": "sample", "version": "1.0.0"}'),
  },
  {
    name: "a marketplace entry with a version fails",
    expected: [versionProblem],
    problems: findVersionKey("m.json", '{"plugins": [{"name": "sample", "version": "1.0.0"}]}'),
  },
  {
    name: "a marketplace with a version in its metadata fails",
    expected: [versionProblem],
    problems: findVersionKey("m.json", '{"metadata": {"version": "1.0.0"}, "plugins": []}'),
  },
  {
    name: "a marketplace with a version at its top level fails",
    expected: [versionProblem],
    problems: findVersionKey("m.json", '{"version": "1.0.0", "plugins": [{"name": "sample"}]}'),
  },
  {
    name: "a manifest without a version passes",
    expected: [],
    problems: findVersionKey("m.json", '{"name": "sample", "plugins": [{"name": "sample"}]}'),
  },
  {
    name: "settings that enable the plugin and name the marketplace pass",
    expected: [],
    problems: findSettingsProblems(
      '{"enabledPlugins": {"p@m": true}, "extraKnownMarketplaces": {"m": {}}}',
      testPluginKey,
      testMarketplaceName,
    ),
  },
  {
    name: "settings without the marketplace fail",
    expected: [settingsProblem],
    problems: findSettingsProblems(
      '{"enabledPlugins": {"p@m": true}}',
      testPluginKey,
      testMarketplaceName,
    ),
  },
  {
    name: "settings with the plugin disabled fail",
    expected: [settingsProblem],
    problems: findSettingsProblems(
      '{"enabledPlugins": {"p@m": false}, "extraKnownMarketplaces": {"m": {}}}',
      testPluginKey,
      testMarketplaceName,
    ),
  },
  {
    name: "a missing settings file fails",
    expected: [settingsProblem],
    problems: findSettingsProblems(undefined, testPluginKey, testMarketplaceName),
  },
  {
    name: "a subagent renders its tool's fields",
    expected: ["---\nname: a\ndescription: d\nreadonly: true\n---\n\nbody"],
    problems: [renderAgent("a", ["readonly: true"], subagent, "body")],
  },
];

const selfTestFailures = selfTestCases
  .filter(({expected, problems}) => JSON.stringify(expected) !== JSON.stringify(problems))
  .map(({name}) => name);

if (selfTestFailures.length > 0) {
  const failureLines = selfTestFailures.map(name => `- ${name}`);

  process.stderr.write(`Plugin sync self-tests failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const isCheckOnly = process.argv.includes("--check");
  const expected = renderAdapters();

  const orphans = adapters.flatMap(({directory, hasAuthoredEvals}) => {
    const adapterRoot = path.join(adaptersRoot, directory);

    return listFiles(adapterRoot, false)
      .map(file => path.join(adapterRoot, file))
      .filter(
        file =>
          !expected.has(file) &&
          !(hasAuthoredEvals && file.startsWith(path.join(adapterRoot, "evals"))),
      );
  });

  const staleFiles = [
    ...[...expected]
      .filter(([file, content]) => !existsSync(file) || readFileSync(file, "utf8") !== content)
      .map(([file]) => file),
    ...orphans,
  ];

  if (isCheckOnly) {
    const vendorNames = JSON.parse(readFileSync(vendorNamesPath, "utf8")) as string[];

    const {name: marketplaceName} = JSON.parse(readFileSync(claudeMarketplacePath, "utf8")) as {
      name: string;
    };

    const problems = [
      ...staleFiles.map(file => `${file}: is stale; run \`pnpm plugin:sync\``),
      ...listFiles(pluginRoot, true)
        .filter(file => textExtensions.has(path.extname(file)))
        .map(file => path.join(pluginRoot, file))
        .flatMap(file => findEscapingReferences(file, readFileSync(file, "utf8"))),
      ...listFiles(sourceRoot, true)
        .map(file => path.join(sourceRoot, file))
        .flatMap(file => findVendorNames(file, readFileSync(file, "utf8"), vendorNames)),
      ...[
        ...adapters.map(({directory, manifestPath}) =>
          path.join(adaptersRoot, directory, manifestPath),
        ),
        ...marketplacePaths,
      ]
        .filter(file => existsSync(file))
        .flatMap(file => findVersionKey(file, readFileSync(file, "utf8"))),
      ...findSettingsProblems(
        existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : undefined,
        `${manifestFields.name}@${marketplaceName}`,
        marketplaceName,
      ),
    ];

    if (problems.length > 0) {
      process.stderr.write(`${problems.join("\n")}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `Checked ${expected.size} plugin adapter files and ${selfTestCases.length} self-tests; none stale.\n`,
      );
    }
  } else {
    for (const file of orphans) {
      rmSync(file);
    }

    const renderedStaleFiles = staleFiles.filter(staleFile => expected.has(staleFile));

    for (const file of renderedStaleFiles) {
      mkdirSync(path.dirname(file), {
        recursive: true,
      });

      writeFileSync(file, expected.get(file) ?? "");
    }

    process.stdout.write(
      `Synced ${expected.size} plugin adapter files; ${staleFiles.length} updated.\n`,
    );
  }
}
