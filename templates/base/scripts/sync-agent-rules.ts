import {existsSync, readdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";

type RuleConfig = {
  description: string;
  globs?: string[];
};

const sourceDirectory = ".agents/rules";
const configPath = ".agents/rules.json";

const claudeExtras: Record<string, string> = {
  "agents-guide.md": "@../../AGENTS.md\n",
};

/**
 * List the names of files with an extension in a directory.
 * @param directory Directory to read.
 * @param extension File extension, including the dot.
 * @returns File names without the extension.
 */
function listNames(directory: string, extension: string): string[] {
  return readdirSync(directory)
    .filter(file => file.endsWith(extension))
    .map(file => file.slice(0, -extension.length));
}

/**
 * Render the Claude Code rule: an import for an always-on rule, the full body behind `paths` for a scoped rule.
 * @param name Rule name.
 * @param rule Rule configuration.
 * @param body Shared rule body.
 * @returns The `.claude/rules` file content.
 */
function renderClaudeRule(name: string, rule: RuleConfig, body: string): string {
  if (rule.globs === undefined) {
    return `@../../${sourceDirectory}/${name}.md\n`;
  }

  const paths = rule.globs.map(glob => `  - "${glob}"`).join("\n");

  return `---\npaths:\n${paths}\n---\n\n${body}`;
}

/**
 * Render the Cursor rule with the full body, because Cursor does not inline referenced files.
 * @param rule Rule configuration.
 * @param body Shared rule body.
 * @returns The `.cursor/rules` file content.
 */
function renderCursorRule(rule: RuleConfig, body: string): string {
  const scope =
    rule.globs === undefined
      ? "alwaysApply: true"
      : `globs: "${rule.globs.join(",")}"\nalwaysApply: false`;

  return `---\ndescription: "${rule.description}"\n${scope}\n---\n\n${body}`;
}

const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, RuleConfig>;
const configNames = Object.keys(config);
const sourceNames = listNames(sourceDirectory, ".md");
const missingConfig = sourceNames.filter(name => !configNames.includes(name));
const missingSource = configNames.filter(name => !sourceNames.includes(name));

if (missingConfig.length > 0 || missingSource.length > 0) {
  throw new Error(
    `${configPath} and ${sourceDirectory} must list the same rules. Missing from ${configPath}: ${missingConfig.join(", ") || "none"}. Missing from ${sourceDirectory}: ${missingSource.join(", ") || "none"}.`,
  );
}

const claudeDirectory = ".claude/rules";
const cursorDirectory = ".cursor/rules";
const expected = new Map<string, string>();

for (const name of configNames) {
  const rule = config[name];
  const body = readFileSync(path.join(sourceDirectory, `${name}.md`), "utf8");

  expected.set(path.join(claudeDirectory, `${name}.md`), renderClaudeRule(name, rule, body));
  expected.set(path.join(cursorDirectory, `${name}.mdc`), renderCursorRule(rule, body));
}

for (const [file, content] of Object.entries(claudeExtras)) {
  expected.set(path.join(claudeDirectory, file), content);
}

const orphans = [
  ...listNames(claudeDirectory, ".md").map(name => path.join(claudeDirectory, `${name}.md`)),
  ...listNames(cursorDirectory, ".mdc").map(name => path.join(cursorDirectory, `${name}.mdc`)),
].filter(file => !expected.has(file));

if (orphans.length > 0) {
  throw new Error(
    `Generated rule files without a source: ${orphans.join(", ")}. Delete them or add the rule to ${configPath}.`,
  );
}

const isCheckOnly = process.argv.includes("--check");

const staleFiles = [...expected].filter(
  ([file, content]) => !existsSync(file) || readFileSync(file, "utf8") !== content,
);

if (!isCheckOnly) {
  for (const [file, content] of staleFiles) {
    writeFileSync(file, content);
  }
}

if (isCheckOnly && staleFiles.length > 0) {
  process.stderr.write(
    `Agent rules are out of date: ${staleFiles.map(([file]) => file).join(", ")}. Run \`pnpm rules:sync\`.\n`,
  );

  process.exitCode = 1;
} else {
  process.stdout.write(
    `${isCheckOnly ? "Checked" : "Synced"} ${expected.size} agent rule files; ${staleFiles.length} ${isCheckOnly ? "stale" : "updated"}.\n`,
  );
}
