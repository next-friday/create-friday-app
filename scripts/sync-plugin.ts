import {execFileSync} from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

type AgentConfig = {
  description: string;
  readonly?: boolean;
  tools?: string[];
};

type HookConfig = {
  argument?: string;
  event: string;
  loopLimit?: number;
  script: string;
};

type HookCase = {
  argument?: string;
  changedFiles?: string[];
  committed?: boolean;
  expected: string;
  filesBeforeTurn?: string[];
  input: Record<string, unknown>;
  name: string;
  savedReply?: string;
};

type Adapter = {
  agentFields: (agent: AgentConfig) => string[];
  directory: string;
  hasAuthoredEvals: boolean;
  manifest: Record<string, string>;
  manifestPath: string;
  renderHooks?: (hooks: HookConfig[]) => string;
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
const toolWordsPath = path.join(adaptersRoot, "tool-words.json");
const hookConfigPath = path.join(adaptersRoot, "hooks.json");
const hooksDirectory = path.join(sourceRoot, "hooks");
const hookCasesSuffix = ".cases.json";
const hookTimeoutSeconds = 10;
const claudeMarketplacePath = ".claude-plugin/marketplace.json";
const templateRoot = path.join("templates", "base");
const templatePluginRoot = path.join(templateRoot, pluginRoot);
const sourceScriptsDirectory = path.join(sourceRoot, "scripts");
const templateScriptsDirectory = path.join(templateRoot, "scripts");
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

/**
 * Build the shell command that runs a hook script through `sh`.
 * @param pluginRootVariable The variable the tool sets to the plugin directory.
 * @param hook The event, script, and argument that `hooks.json` names for the adapter.
 * @returns The command, with the argument after the script when the hook has one.
 */
function renderHookCommand(pluginRootVariable: string, hook: HookConfig): string {
  const argument = hook.argument === undefined ? "" : ` ${hook.argument}`;

  return `sh "\${${pluginRootVariable}}/hooks/${hook.script}"${argument}`;
}

/**
 * Render the hook file the Claude Code adapter loads from `hooks/hooks.json`.
 * @param hooks The hooks that `hooks.json` names for the adapter.
 * @returns The file content, which runs each script through `sh`.
 */
function renderClaudeHooks(hooks: HookConfig[]): string {
  return `${JSON.stringify(
    {
      hooks: Object.fromEntries(
        hooks.map(hook => [
          hook.event,
          [
            {
              hooks: [
                {
                  timeout: hookTimeoutSeconds,
                  type: "command",
                  command: renderHookCommand("CLAUDE_PLUGIN_ROOT", hook),
                },
              ],
            },
          ],
        ]),
      ),
    },
    undefined,
    2,
  )}\n`;
}

/**
 * Render the hook file the Cursor adapter loads from `hooks/hooks.json`.
 * @param hooks The hooks that `hooks.json` names for the adapter.
 * @returns The file content, which runs each script through `sh` and caps the follow-ups of a `stop` hook.
 */
function renderCursorHooks(hooks: HookConfig[]): string {
  return `${JSON.stringify(
    {
      version: 1,
      hooks: Object.fromEntries(
        hooks.map(hook => [
          hook.event,
          [
            {
              command: renderHookCommand("CURSOR_PLUGIN_ROOT", hook),
              ...(hook.loopLimit !== undefined && {
                loop_limit: hook.loopLimit,
              }),
            },
          ],
        ]),
      ),
    },
    undefined,
    2,
  )}\n`;
}

const adapters: Adapter[] = [
  {
    manifest: manifestFields,
    agentFields: findClaudeAgentFields,
    renderHooks: renderClaudeHooks,
    directory: "claude-code",
    manifestPath: ".claude-plugin/plugin.json",
    hasAuthoredEvals: true,
  },
  {
    agentFields: findCursorAgentFields,
    renderHooks: renderCursorHooks,
    directory: "cursor",
    manifestPath: ".cursor-plugin/plugin.json",
    hasAuthoredEvals: false,
    manifest: {
      ...manifestFields,
      skills: "./skills/",
      agents: "./agents/",
      hooks: "./hooks/hooks.json",
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
 * @param names Agent tool names from `vendor-names.json`.
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
 * Run a hook script on one input.
 * @param script Path of the script from the repository root.
 * @param argument The script's argument, if any.
 * @param input The hook input.
 * @param stateDirectory The temporary directory the script keeps its state in.
 * @returns The standard output, or a message when the script exits non-zero.
 */
function runHookScript(
  script: string,
  argument: string | undefined,
  input: Record<string, unknown>,
  stateDirectory: string,
): string {
  try {
    return execFileSync("sh", argument === undefined ? [script] : [script, argument], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        TMPDIR: stateDirectory,
      },
      input: JSON.stringify(input),
    });
  } catch {
    return "script failed";
  }
}

/**
 * Write the same content to each file of a hook case's repository.
 * @param repository The repository's path.
 * @param files Paths relative to the repository.
 * @param content The content of each file.
 */
function writeCaseFiles(repository: string, files: string[], content: string): void {
  for (const file of files) {
    mkdirSync(path.join(repository, path.dirname(file)), {
      recursive: true,
    });

    writeFileSync(path.join(repository, file), content);
  }
}

/**
 * Commit every file of a hook case's repository that Git does not ignore.
 * @param repository The repository's path.
 */
function commitCaseFiles(repository: string): void {
  for (const gitArguments of [
    ["add", "--all"],
    [
      "-c",
      "user.name=case",
      "-c",
      "user.email=case@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "--message",
      "case",
    ],
  ]) {
    execFileSync("git", gitArguments, {
      cwd: repository,
      stdio: ["ignore", "ignore", "pipe"],
    });
  }
}

/**
 * Create a Git repository with one commit that holds a source file, a plan, and an ignore rule for `coverage/`, for a hook case.
 * @param parentDirectory The directory to create the repository in.
 * @returns The repository's path.
 */
function createCaseRepository(parentDirectory: string): string {
  const repository = path.join(parentDirectory, "repository");

  mkdirSync(repository);

  execFileSync("git", ["init", "--quiet"], {
    cwd: repository,
    stdio: ["ignore", "ignore", "pipe"],
  });

  writeCaseFiles(repository, ["src/version.ts", "intent/app-version/plan.md"], "first\n");
  writeCaseFiles(repository, [".gitignore"], "coverage/\n");
  commitCaseFiles(repository);

  return repository;
}

/**
 * Run a hook script on one case in a private state directory.
 * @param script Path of the script from the repository root.
 * @param hookCase The case. A saved reply is stored first by the script's `save` argument. Changed files make the case run in a new Git repository: the script takes its `snapshot`, the files are written, and the case input gains the repository as `cwd` and `workspace_roots`.
 * @returns The standard output of the script on the case input.
 */
function runHookCase(script: string, hookCase: HookCase): string {
  const stateDirectory = mkdtempSync(path.join(tmpdir(), "sdlc-hook-case-"));

  try {
    if (hookCase.savedReply !== undefined) {
      runHookScript(
        script,
        "save",
        {
          text: hookCase.savedReply,
          conversation_id: hookCase.input.conversation_id,
        },
        stateDirectory,
      );
    }

    if (hookCase.changedFiles === undefined) {
      return runHookScript(script, hookCase.argument, hookCase.input, stateDirectory);
    }

    const input = {
      ...hookCase.input,
      cwd: createCaseRepository(stateDirectory),
    };

    const caseInput = {
      ...input,
      workspace_roots: [input.cwd],
    };

    writeCaseFiles(input.cwd, hookCase.filesBeforeTurn ?? [], "before\n");
    runHookScript(script, "snapshot", caseInput, stateDirectory);
    writeCaseFiles(input.cwd, hookCase.changedFiles, "changed\n");

    if (hookCase.committed === true) {
      commitCaseFiles(input.cwd);
    }

    return runHookScript(script, hookCase.argument, caseInput, stateDirectory);
  } finally {
    rmSync(stateDirectory, {
      force: true,
      recursive: true,
    });
  }
}

/**
 * Tell what a hook did from its standard output.
 * @param output Standard output of the hook script.
 * @returns `pass` for no output, `block` for a block decision or a follow-up message, otherwise the output itself.
 */
function findHookOutcome(output: string): string {
  if (output.trim() === "") {
    return "pass";
  }

  try {
    const {decision, followup_message: followupMessage} = JSON.parse(output) as {
      decision?: string;
      followup_message?: string;
    };

    return decision === "block" || followupMessage !== undefined ? "block" : output;
  } catch {
    return output;
  }
}

/**
 * Find the cases of a hook script whose outcome differs from the expected one.
 * @param script Path of the script from the repository root.
 * @param cases Hook cases with the expected outcome of each.
 * @param run Runs the script on one case and returns its standard output.
 * @returns One message per case that did not pass or block as expected.
 */
function findHookCaseProblems(
  script: string,
  cases: HookCase[],
  run: (hookCase: HookCase) => string,
): string[] {
  return cases
    .map(hookCase => ({
      expected: hookCase.expected,
      name: hookCase.name,
      outcome: findHookOutcome(run(hookCase)),
    }))
    .filter(({expected, outcome}) => outcome !== expected)
    .map(
      ({expected, name, outcome}) =>
        `${script}: case "${name}" expected ${expected}, got ${outcome}`,
    );
}

/**
 * Find the problems of one hook script.
 * @param script Path of the script from the repository root.
 * @returns A message when the script fails `sh -n`, has no case file, or has a case that fails.
 */
function findScriptProblems(script: string): string[] {
  const casesPath = path.join(
    path.dirname(script),
    `${path.basename(script, ".sh")}${hookCasesSuffix}`,
  );

  try {
    execFileSync("sh", ["-n", script], {
      stdio: "pipe",
    });
  } catch {
    return [`${script}: fails \`sh -n\``];
  }

  return existsSync(casesPath)
    ? findHookCaseProblems(
        script,
        JSON.parse(readFileSync(casesPath, "utf8")) as HookCase[],
        hookCase => runHookCase(script, hookCase),
      )
    : [`${casesPath}: is missing`];
}

/**
 * Find the problems of every hook script in the source.
 * @returns The problems of each script, in file order.
 */
function findHookProblems(): string[] {
  return listFiles(hooksDirectory, false)
    .filter(file => path.extname(file) === ".sh")
    .flatMap(file => findScriptProblems(path.join(hooksDirectory, file)));
}

/**
 * Find where a generated project holds a rendered adapter file.
 * @param adapterFile Path of the file in an adapter, from the repository root.
 * @returns The path of its copy under the template, which has no `adapters` directory.
 */
function findTemplateCopyPath(adapterFile: string): string {
  return path.join(templatePluginRoot, path.relative(adaptersRoot, adapterFile));
}

/**
 * Render the marketplace file of a generated project from the repository's own.
 * @param marketplaceText Content of the repository's `.claude-plugin/marketplace.json`.
 * @returns The content with each plugin's source pointing at the adapter copy a generated project holds.
 */
function renderTemplateMarketplace(marketplaceText: string): string {
  const marketplace = JSON.parse(marketplaceText) as {plugins: {source: string}[]};

  return `${JSON.stringify(
    {
      ...marketplace,
      plugins: marketplace.plugins.map(entry => ({
        ...entry,
        source: `./${path.join(pluginRoot, path.basename(entry.source))}`,
      })),
    },
    undefined,
    2,
  )}\n`;
}

/**
 * Render what a generated project holds of the plugin: the adapters with their eval cases, the marketplace file, and the three scripts.
 * @param adapterFiles The expected content of each adapter file, from `renderAdapters`.
 * @returns The expected content of each file under `templates/base/`, by path from the repository root.
 */
function renderTemplateCopy(adapterFiles: Map<string, string>): Map<string, string> {
  return new Map([
    ...[...adapterFiles].map(([file, content]): [string, string] => [
      findTemplateCopyPath(file),
      content,
    ]),
    ...adapters
      .filter(({hasAuthoredEvals}) => hasAuthoredEvals)
      .map(({directory}) => path.join(adaptersRoot, directory, "evals"))
      .flatMap(evalsDirectory =>
        listFiles(evalsDirectory, true).map((file): [string, string] => {
          const evalFile = path.join(evalsDirectory, file);

          return [findTemplateCopyPath(evalFile), readFileSync(evalFile, "utf8")];
        }),
      ),
    [
      path.join(templateRoot, claudeMarketplacePath),
      renderTemplateMarketplace(readFileSync(claudeMarketplacePath, "utf8")),
    ],
    ...listFiles(sourceScriptsDirectory, false).map((file): [string, string] => [
      path.join(templateScriptsDirectory, file),
      readFileSync(path.join(sourceScriptsDirectory, file), "utf8"),
    ]),
  ]);
}

/**
 * Replace each tool word of the source with the text one agent tool needs, such as a path in the person's home directory.
 * @param text Source text.
 * @param words Each tool word, such as `{{rules-file}}`, and its text for one agent tool.
 * @returns The text with every tool word replaced.
 */
function renderToolWords(text: string, words: Record<string, string>): string {
  let rendered = text;

  for (const [word, value] of Object.entries(words)) {
    rendered = rendered.split(word).join(value);
  }

  return rendered;
}

/**
 * Find tool words a render left in place, because the tool's map in `tool-words.json` lacks them.
 * @param filePath Path of the rendered file.
 * @param text Rendered text.
 * @returns One problem for each tool word left in the text.
 */
function findToolWords(filePath: string, text: string): string[] {
  return Array.from(
    text.matchAll(/\{\{[a-z]+(?:-[a-z]+)*\}\}/gu),
    ([word]) => `${filePath}: holds the tool word ${word}; add it to ${toolWordsPath}`,
  );
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

  const hooksConfig = JSON.parse(readFileSync(hookConfigPath, "utf8")) as Record<
    string,
    HookConfig[]
  >;

  const toolWords = JSON.parse(readFileSync(toolWordsPath, "utf8")) as Record<
    string,
    Record<string, string>
  >;

  for (const adapter of adapters) {
    const adapterRoot = path.join(adaptersRoot, adapter.directory);

    expected.set(
      path.join(adapterRoot, adapter.manifestPath),
      `${JSON.stringify(adapter.manifest, undefined, 2)}\n`,
    );

    const words = toolWords[adapter.directory] ?? {};

    for (const file of listFiles(skillsDirectory, false)) {
      const text = readFileSync(path.join(skillsDirectory, file), "utf8");

      expected.set(path.join(adapterRoot, "skills", file), renderToolWords(text, words));
    }

    const hooks = hooksConfig[adapter.directory];

    if (hooks !== undefined && adapter.renderHooks !== undefined) {
      expected.set(path.join(adapterRoot, "hooks", "hooks.json"), adapter.renderHooks(hooks));

      const scripts = new Set(hooks.map(hook => hook.script));

      for (const script of scripts) {
        expected.set(
          path.join(adapterRoot, "hooks", script),
          readFileSync(path.join(hooksDirectory, script), "utf8"),
        );
      }
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
const blockingOutput = '{"decision":"block"}';

const hookCases: HookCase[] = [
  {
    name: "a",
    expected: "pass",
    input: {
      blocks: false,
    },
  },
  {
    name: "b",
    expected: "block",
    input: {
      blocks: true,
    },
  },
];

/**
 * Stand in for a hook script that blocks the inputs that say so.
 * @param hookCase The hook case.
 * @returns A block decision when the input blocks, otherwise no output.
 */
function runBlockingStub(hookCase: HookCase): string {
  return hookCase.input.blocks === true ? blockingOutput : "";
}

/**
 * Stand in for a hook script that blocks the inputs that do not say so.
 * @param hookCase The hook case.
 * @returns A block decision when the input does not block, otherwise no output.
 */
function runInvertedStub(hookCase: HookCase): string {
  return runBlockingStub(hookCase) === "" ? blockingOutput : "";
}

/**
 * Stand in for a hook script that blocks only when it gets the `followup` argument.
 * @param hookCase The hook case.
 * @returns A follow-up message when the case carries the `followup` argument, otherwise no output.
 */
function runArgumentStub(hookCase: HookCase): string {
  return hookCase.argument === "followup" ? '{"followup_message":"m"}' : "";
}

const selfTestCases: SelfTestCase[] = [
  {
    name: "an adapter file is copied under the template without the adapters directory",
    expected: [path.join(templatePluginRoot, "claude-code/skills/a/SKILL.md")],
    problems: [findTemplateCopyPath(path.join(adaptersRoot, "claude-code/skills/a/SKILL.md"))],
  },
  {
    name: "the template marketplace points at the copy a generated project holds",
    expected: ['{"name":"m","plugins":[{"name":"p","source":"./plugins/sdlc/claude-code"}]}'],
    problems: [
      JSON.stringify(
        JSON.parse(
          renderTemplateMarketplace(
            '{"name":"m","plugins":[{"name":"p","source":"./plugins/sdlc/adapters/claude-code"}]}',
          ),
        ),
      ),
    ],
  },
  {
    name: "a link into the plugin passes",
    expected: [],
    problems: findEscapingReferences(
      path.join(pluginRoot, "source/skills/sdlc-mode/SKILL.md"),
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
    name: "a tool word is replaced with its text for the tool",
    expected: ["see ~/rules"],
    problems: [
      renderToolWords("see {{rules-file}}", {
        "{{rules-file}}": "~/rules",
      }),
    ],
  },
  {
    name: "a tool word that the tool's map lacks fails",
    expected: [`a.md: holds the tool word {{model-switch}}; add it to ${toolWordsPath}`],
    problems: findToolWords("a.md", renderToolWords("use {{model-switch}}", {})),
  },
  {
    name: "a listed name fails in any case and an unlisted one passes",
    expected: ['a.md: names "Cursor"'],
    problems: findVendorNames("a.md", "CURSOR and others", ["Cursor", "Other"]),
  },
  {
    name: "a listed name inside a longer word passes",
    expected: [],
    problems: findVendorNames("a.md", "cursors and precursor", ["Cursor"]),
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
    name: "a hook case that passes or blocks as expected passes",
    expected: [],
    problems: findHookCaseProblems("h.sh", hookCases, runBlockingStub),
  },
  {
    name: "a hook case with the other outcome fails",
    expected: [
      'h.sh: case "a" expected pass, got block',
      'h.sh: case "b" expected block, got pass',
    ],
    problems: findHookCaseProblems("h.sh", hookCases, runInvertedStub),
  },
  {
    name: "a hook that prints anything but a block decision fails",
    expected: ['h.sh: case "a" expected pass, got oops'],
    problems: findHookCaseProblems("h.sh", hookCases.slice(0, 1), () => "oops"),
  },
  {
    name: "a hook case hands its argument to the runner",
    expected: [],
    problems: findHookCaseProblems(
      "h.sh",
      [
        {
          name: "a",
          expected: "block",
          argument: "followup",
          input: {},
        },
        {
          name: "b",
          expected: "pass",
          input: {},
        },
      ],
      runArgumentStub,
    ),
  },
  {
    name: "a hook renders its event and script through sh",
    expected: [`sh "\${CLAUDE_PLUGIN_ROOT}/hooks/h.sh"`],
    problems: [
      (
        JSON.parse(
          renderClaudeHooks([
            {
              event: "Stop",
              script: "h.sh",
            },
          ]),
        ) as {
          hooks: {Stop: {hooks: {command: string}[]}[]};
        }
      ).hooks.Stop[0]?.hooks[0]?.command ?? "",
    ],
  },
  {
    name: "a hook renders its argument and loop limit for Cursor",
    expected: [
      JSON.stringify({
        version: 1,
        hooks: {
          stop: [
            {
              command: `sh "\${CURSOR_PLUGIN_ROOT}/hooks/h.sh" followup`,
              loop_limit: 1,
            },
          ],
        },
      }),
    ],
    problems: [
      JSON.stringify(
        JSON.parse(
          renderCursorHooks([
            {
              event: "stop",
              script: "h.sh",
              argument: "followup",
              loopLimit: 1,
            },
          ]),
        ),
      ),
    ],
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
  const adapterFiles = renderAdapters();
  const expected = new Map([...adapterFiles, ...renderTemplateCopy(adapterFiles)]);

  const orphans = [
    ...adapters.flatMap(({directory, hasAuthoredEvals}) => {
      const adapterRoot = path.join(adaptersRoot, directory);

      return listFiles(adapterRoot, false)
        .map(file => path.join(adapterRoot, file))
        .filter(
          file =>
            !expected.has(file) &&
            !(hasAuthoredEvals && file.startsWith(path.join(adapterRoot, "evals"))),
        );
    }),
    ...[templatePluginRoot, path.join(templateRoot, path.dirname(claudeMarketplacePath))].flatMap(
      directory =>
        listFiles(directory, false)
          .map(file => path.join(directory, file))
          .filter(file => !expected.has(file)),
    ),
  ];

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
      ...[...expected]
        .filter(([file]) => file.includes(`${path.sep}skills${path.sep}`))
        .flatMap(([file, content]) => findToolWords(file, content)),
      ...listFiles(pluginRoot, true)
        .filter(file => textExtensions.has(path.extname(file)))
        .map(file => path.join(pluginRoot, file))
        .flatMap(file => findEscapingReferences(file, readFileSync(file, "utf8"))),
      ...listFiles(sourceRoot, true)
        .map(file => path.join(sourceRoot, file))
        .flatMap(file => findVendorNames(file, readFileSync(file, "utf8"), vendorNames)),
      ...findHookProblems(),
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
        `Checked ${expected.size} plugin files and ${selfTestCases.length} self-tests; none stale.\n`,
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

    process.stdout.write(`Synced ${expected.size} plugin files; ${staleFiles.length} updated.\n`);
  }
}
