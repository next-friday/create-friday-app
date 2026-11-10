# Spec: Support Claude Code and Cursor from one source

From `intent/multi-agent-support/intent.md` (accepted 2026-11-09 by the merge of pull request #57). Status: draft.

Written at `main` `7aac1c3` with the `write-spec` skill as committed there. The agent wrote it as the next step of the loop, under `AGENTS.md`'s "Asking the product owner"; the product owner asked for it through another session, and no product owner prompt added a constraint to the skill's prompt.

The playbook PDF was not available while this spec was written. Every playbook quote and page number below comes from the intent or from another spec on `main`; this spec adds none. `intent/lean-agent-setup/spec.md`, written in the same pull request, decides which rules, skills, and hooks remain and what each gate blocks; this spec decides where each file lives and how each agent loads it. The templates' half assumes the monorepo layout of `intent/monorepo-apps/spec.md`: per-stack files move once into `templates/base/`, and the agent rules render once.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. Each instruction, rule, skill, subagent, hook, and MCP configuration has one source, in the root and in every template, and neither agent loads a copy of it twice.
2. A file is rendered for one agent only where that agent's official documentation shows it cannot read the source: Cursor's `.mdc` rules, `.cursor/mcp.json`, and one subagent file per agent.
3. Skills live only in `.claude/skills/`.
4. Claude Code and Cursor get the same guardrails as far as each supports them: Claude Code through `permissions.deny`, Cursor through its file-path gate and the shell gate's Cursor-only check.
5. A guard that must hold in Cursor is registered in `.cursor/hooks.json` and does not run twice; every other hook both agents run is registered once, in `.claude/settings.json`.
6. Where Cursor lacks a feature that Claude Code has, `AGENTS.md` says so.
7. `pnpm rules:check` fails when a rendered file differs from its source or a copy of a skill appears outside `.claude/skills/`. `.cursor/BUGBOT.md` links `AGENTS.md` and `REVIEW.md` instead of repeating them.
8. Names and messages about the rendered files name both agents.
9. A new worktree gets its setup in both agents.
10. No symlinks.

## Design

### Where each file lives

| What         | Source                                                        | Rendered                                               | Why                                                                                                                                                                                                                                                                                                                                                             |
| :----------- | :------------------------------------------------------------ | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instructions | `AGENTS.md`; `CLAUDE.md` holds only `@AGENTS.md`              | None                                                   | Cursor reads `AGENTS.md` ([Cursor: Rules](https://cursor.com/docs/rules)); Claude Code reads `CLAUDE.md` and its imports, and its documentation says to import `AGENTS.md` from a `CLAUDE.md` "In some sessions Claude can't read `AGENTS.md`" ([Claude Code: memory](https://code.claude.com/docs/en/memory)).                                                 |
| Rules        | `.claude/rules/<name>.md`                                     | `.cursor/rules/<name>.mdc`                             | Claude Code reads `.claude/rules/`; Cursor reads "Only `.mdc` files with Cursor's frontmatter in `.cursor/rules/`" (intent, from [Cursor: Rules](https://cursor.com/docs/rules)).                                                                                                                                                                               |
| Skills       | `.claude/skills/<name>/`                                      | None                                                   | "For compatibility, Cursor also loads skills from Claude and Codex directories: `.claude/skills/`" ([Cursor: Skills](https://cursor.com/docs/skills)), and the playbook puts skills there (page 25, step 3, from the intent).                                                                                                                                   |
| Subagents    | `.agents/agents/<name>.md` and `.agents/agents.json`          | `.claude/agents/<name>.md`, `.cursor/agents/<name>.md` | A Cursor subagent takes `readonly` and `is_background`; a Claude Code subagent restricts its tools with `tools` (intent). Cursor reads `.cursor/agents/` and `.claude/agents/`, and "`.cursor/` takes precedence over `.claude/`" ([Cursor: Subagents](https://cursor.com/docs/subagents)), so Cursor uses its own file. Neither agent reads `.agents/agents/`. |
| Hook scripts | `.agents/hooks/*.sh`; Cursor-only scripts in `.cursor/hooks/` | None                                                   | Scripts are run, not loaded. Registration is in **Hooks**.                                                                                                                                                                                                                                                                                                      |
| MCP servers  | `.mcp.json`                                                   | `.cursor/mcp.json`                                     | Claude Code reads `.mcp.json` ([Claude Code: MCP](https://code.claude.com/docs/en/mcp)); Cursor reads `.cursor/mcp.json` ([Cursor: MCP](https://cursor.com/docs/mcp)). `.agents/mcp.json` (`scripts/sync-agent-rules.ts`, line 176) goes.                                                                                                                       |
| Review       | `REVIEW.md` (`intent/lean-agent-setup/spec.md`)               | None                                                   | Claude Code Review reads `REVIEW.md` (page 38, from the intent). `.cursor/BUGBOT.md` is written by hand and links `REVIEW.md`, `AGENTS.md`, and the rule sources in `.claude/rules/` ([Cursor: Bugbot](https://cursor.com/docs/bugbot) reads the `.md` files it links, from the intent).                                                                        |

Removed, in the root and `templates/base/`: `.agents/rules/`, `.agents/rules.json`, `.agents/skills/`, `.cursor/skills/`, `.agents/mcp.json`, and the `@../../.agents/rules/<name>.md` import files in `.claude/rules/`, which become the rule bodies themselves.

**Rule frontmatter.** Each `.claude/rules/<name>.md` carries `description`, and `paths` when the rule is scoped. Claude Code reads `paths` ("Rules without `paths` frontmatter are loaded at launch", [Claude Code: memory](https://code.claude.com/docs/en/memory)); the renderer turns `description` and `paths` into Cursor's `description`, `globs`, and `alwaysApply`, as `renderCursorRule` does today from `.agents/rules.json` (`scripts/sync-agent-rules.ts`, lines 57–64). Unverified: whether Claude Code ignores the extra `description` key, because its documentation names only `paths`; the plan checks it in a session, and if it does not, the descriptions move to a JSON file next to the rules that only the renderer reads. **Proposal:** the renderer parses frontmatter with the `yaml` package, already in the root's lockfile (`yaml@2.9.1`, cited by `intent/monorepo-apps/spec.md`, **What the CLI writes**); Node.js has no YAML parser, so `platform-and-library-first.md`'s step 2 applies, and the templates add it as a development dependency, which the sync script uses.

**Rules render once.** `intent/monorepo-apps/spec.md` renders the rules once at the root with globs that cover every app template (**Templates in this repository**). This spec keeps that: under the monorepo layout `templates/base/.claude/rules/` is the one source, and the per-stack copies that `AGENTS.md` ("Template rule copies") describes go. Until then, each stack keeps its own `typescript-first` and `deterministic-testing` globs.

### Hooks

Cursor runs Claude Code's hooks from `.claude/settings.json`, mapping `PreToolUse` to `preToolUse`, `PostToolUse` to `postToolUse`, `SessionStart` to `sessionStart`, `Bash` to `Shell`, and `Edit` to `Write`, and "All matching hooks from every source run" ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)). It loads them only while **Include Third-Party Plugins, Skills, and Other Configs** (Cursor Settings → Agents → Third-Party Imports) is on, which is the default (same page). The intent's condition holds: a Cursor user can turn off reading Claude Code's configuration. So:

| Hook                                                           | Guard | Registered in                                                                                                       | In Cursor                                                                                                          |
| :------------------------------------------------------------- | :---- | :------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| Shell gate (`.agents/hooks/agent-shell-gate.sh`)               | Yes   | `.cursor/hooks.json` `beforeShellExecution`; `.claude/settings.json` `PreToolUse` with the argument `--claude-code` | Runs once, from `.cursor/hooks.json`. The `--claude-code` copy allows at once when the input has `cursor_version`. |
| Production gate (`.agents/hooks/agent-production-gate.sh`)     | Yes   | As the shell gate                                                                                                   | As the shell gate.                                                                                                 |
| File-path gate (`.cursor/hooks/agent-constitution-gate.sh`)    | Yes   | `.cursor/hooks.json` `preToolUse` only                                                                              | Cursor's counterpart to `permissions.deny`, which Cursor does not read (intent).                                   |
| Format after edit (`.agents/hooks/agent-format-after-edit.sh`) | No    | `.claude/settings.json` `PostToolUse` only; the `afterFileEdit` entry leaves `.cursor/hooks.json`                   | Runs while the option is on. With it off, lint-staged still formats at commit.                                     |
| Session-start reminder (`intent/playbook-plays/spec.md`)       | No    | `.claude/settings.json` `SessionStart` only                                                                         | Runs while the option is on; the script prints Cursor's `additional_context` JSON under Cursor, as that spec says. |

- **Telling the agents apart.** Cursor sends `cursor_version` in every hook's input and sets `CURSOR_PROJECT_DIR` and `CURSOR_VERSION` for every hook process; it also sets `CLAUDE_PROJECT_DIR` as an "Alias for project dir (Claude compatibility)" ([Cursor: Hooks](https://cursor.com/docs/agent/hooks)), so `CLAUDE_PROJECT_DIR` alone does not say which agent runs. The gates read `cursor_version`.
- **Output.** Cursor accepts "both Claude Code's nested `hookSpecificOutput` response format and the older flat response format" ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)); each gate still prints the format of the agent that runs it, as `intent/lean-agent-setup/spec.md` (**Gate messages**) sets out.
- **Today's double run.** The suppression, test-edit, shell, production, and format hooks are registered in both files (`.claude/settings.json`, lines 47–92; `.cursor/hooks.json`, lines 3–40), so with the option on, Cursor likely runs each twice. Unverified by a run in Cursor: whether Cursor applies the matcher `Bash|PowerShell|Monitor` (line 66) to its mapped `Shell` tool. The guard copies no-op under Cursor either way. `intent/lean-agent-setup/spec.md` removes the suppression and test-edit hooks.
- **`intent/playbook-plays/spec.md`** registers the reminder in both `.claude/settings.json` and `.cursor/hooks.json` (**Entering the loop**). Under this intent it is registered once, because it only informs and is not a guard; whichever spec lands second applies this registration. A Cursor user who turns the option off loses the reminder, not a guard.

### Guardrails per agent

| Guard                                            | Claude Code                                                                                                                                                                          | Cursor                                                                                                                                                       |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edits to the check configuration and agent files | `permissions.deny` `Edit(./…)` entries, which also cover `cat`, `sed`, `tee`, and redirect targets in Bash ([Claude Code: Permissions](https://code.claude.com/docs/en/permissions)) | File-path gate, and the shell gate's redirect and `tee` check, both reading the same `Edit(./…)` entries (`intent/lean-agent-setup/spec.md`, **Shell gate**) |
| Skipping Git hooks                               | Shell gate                                                                                                                                                                           | Shell gate                                                                                                                                                   |
| Production action                                | Production gate                                                                                                                                                                      | Production gate                                                                                                                                              |
| Reading `.env`, templates                        | `Read(.env*)`, then `Read(!.env.example)`                                                                                                                                            | Cursor's default ignore list (`.env*`) and `!.env.example` in `.cursorignore` ([Cursor: Ignore files](https://cursor.com/docs/context/ignore-files))         |

CI and code owner review remain the boundary for both agents (intent).

### What `AGENTS.md` says about Cursor

A short **Cursor** section in the root and in `templates/base/AGENTS.md`, next to convention 8's plan-mode line:

- Cursor does not read Claude Code's `permissions`; the file-path gate and the shell gate's Cursor check stand in for them.
- Keep **Include Third-Party Plugins, Skills, and Other Configs** on: Cursor runs the hooks in `.claude/settings.json` only while it is on, and the project's skills are in `.claude/skills/`.
- Cursor sets up a new worktree from `.cursor/worktrees.json`; Claude Code copies `.env` from `.worktreeinclude`, and the agent runs `pnpm install` in a new worktree (**Worktrees**).
- `AGENTS.md`'s architecture line, "Agent rules: `.agents/rules/*.md` and `.agents/rules.json` are the source", becomes "`.claude/rules/` and `.claude/skills/` are the source; `pnpm rules:sync` renders Cursor's rules and each agent's subagent file".

### Sync script and checks

`scripts/sync-agent-rules.ts`, in the root and `templates/base/`:

- Reads `.claude/rules/*.md` and renders `.cursor/rules/*.mdc`; renders subagents from `.agents/agents.json`, as today (lines 155–173); copies `.mcp.json` to `.cursor/mcp.json`.
- Stops copying skills (lines 99–100 and 147–153).
- Fails when any file is in `.agents/skills/`, `.cursor/skills/`, or `.agents/rules/`, naming it, so a copy that Cursor would load a second time cannot come back (requirement 7). Its orphan check stays for `.cursor/rules/` and the subagent folders (lines 190–208).
- Its messages name both agents: "Rendered Claude Code and Cursor files are out of date: … Run `pnpm rules:sync`." **Proposal:** the script and the commands keep their names (`rules:sync`, `rules:check`), which `AGENTS.md`, `CONTRIBUTING.md`, and CI already use.
- The CI step "Check Cursor rules match .agents/rules" (`.github/workflows/ci.yml`, line 94, and line 78 of each template's `ci.yml`) becomes "Check rendered Claude Code and Cursor files". `intent/ci/spec.md` may move it to another job; the name goes with it.

`scripts/sync-agent-rules.ts` and `.claude/settings.json` are in the constitution (`.claude/settings.json`, lines 22 and 26), as are `.cursor/hooks.json` and the rules. Their changes ship through their own issue, as `constitution-changes.md` requires. **Proposal:** together with `intent/lean-agent-setup/spec.md`'s constitution change, in one issue and one pull request (that spec's **The constitution change**).

### `.cursor/BUGBOT.md`

Hand-written, in the root and `templates/base/`. It keeps the review rules no other file states, and links `REVIEW.md`, `AGENTS.md` (which holds the stack replacement list, `intent/lean-agent-setup/spec.md`), and each rule source in `.claude/rules/`. Links to removed files go. `pnpm rules:check` does not render it, so the plan adds a check that every link in it resolves to a file. **Proposal:** in `scripts/sync-agent-rules.ts --check`.

### Worktrees

| Where             | Cursor                                                                                                                                                                                                                 | Claude Code                                                                                                                                                                                                                                                                                |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root              | `.cursor/worktrees.json`: `{"setup-worktree": ["pnpm install --frozen-lockfile"]}`                                                                                                                                     | `AGENTS.md`: "In a new worktree, run `pnpm install` first." `.gitignore` adds `/.claude/worktrees/`, as each template's `_gitignore` has it (`templates/nextjs/_gitignore`, line 47).                                                                                                      |
| `templates/base/` | `.cursor/worktrees.json`: `setup-worktree-unix` runs `pnpm install --frozen-lockfile`, then copies each app's `.env` from `$ROOT_WORKTREE_PATH` to the same path; `setup-worktree-windows` does the same in PowerShell | `.worktreeinclude` holds `.env`; the file "uses `.gitignore` syntax", so a bare name matches each app's `.env`, and "Only files that match a pattern and are also gitignored are copied" ([Claude Code: Worktrees](https://code.claude.com/docs/en/worktrees)). The same `AGENTS.md` line. |

The keys are Cursor's: `setup-worktree-unix` "Takes precedence over `setup-worktree` on Unix", with `setup-worktree-windows` for Windows ([Cursor: Worktrees](https://cursor.com/docs/configuration/worktrees)). Claude Code has no setup command; its documentation says to "ask Claude to install dependencies, or run your project's setup yourself" (same page), so the `AGENTS.md` line is the Claude Code half. `.env` lives in each app under `intent/monorepo-apps/spec.md` (**What the CLI writes**, step 6), so the copy walks `apps/*/*/.env`, not a root `.env`.

### Files that change

| File                                                                                    | Root | `templates/base/` | Constitution issue |
| :-------------------------------------------------------------------------------------- | :--- | :---------------- | :----------------- |
| `.agents/rules/`, `.agents/rules.json` → `.claude/rules/`; `.cursor/rules/` re-rendered | Yes  | Yes               | Yes                |
| `.agents/skills/`, `.cursor/skills/` removed; `.claude/skills/` the source              | Yes  | Yes               | No                 |
| `.agents/mcp.json` removed; `.mcp.json` the source; `.cursor/mcp.json` rendered         | No   | Yes (MCP stacks)  | No                 |
| `scripts/sync-agent-rules.ts`                                                           | Yes  | Yes               | Yes                |
| `.claude/settings.json`, `.cursor/hooks.json`, `.agents/hooks/*.sh`                     | Yes  | Yes               | Yes                |
| `.cursor/BUGBOT.md`, `AGENTS.md`, `CONTRIBUTING.md`                                     | Yes  | Yes               | No                 |
| `.github/workflows/ci.yml` (step name)                                                  | Yes  | Yes               | No                 |
| `.cursor/worktrees.json`, `.worktreeinclude` (templates), `.gitignore` (root)           | Yes  | Yes               | No                 |
| `package.json` (`yaml` development dependency)                                          | No   | Yes               | No                 |

### Order of work

1. The constitution issue, shared with `intent/lean-agent-setup/spec.md`: rules moved to `.claude/rules/`, the sync script, hook registration in both files.
2. Skills: delete `.agents/skills/` and `.cursor/skills/`, keep `.claude/skills/`; MCP source; `.cursor/BUGBOT.md`.
3. `AGENTS.md` **Cursor**, the CI step name, worktree files, and the root `.gitignore`.
4. The templates, in `templates/base/` once `intent/monorepo-apps/spec.md` lands, otherwise in each stack; render in a generated project and copy back, as `AGENTS.md` describes.
5. `pnpm verify` in the root, and in one generated project per template.

## Proof

- `pnpm rules:check` passes in the root and in each generated project, and fails when a file is added under `.agents/skills/` or `.cursor/skills/`, or when `.cursor/mcp.json` differs from `.mcp.json`.
- `find . -name SKILL.md -not -path './node_modules/*'` lists each skill once, under `.claude/skills/`, in the root and in a generated project.
- In Cursor, with a hook that appends one line per run to a file, registered the way **Hooks** describes: one shell command produces one shell-gate line with the option on and one with it off, and the format hook runs once per edit with the option on. The same run on `main` shows whether today's setup runs a hook twice.
- In Cursor with the option off, an edit to `.claude/settings.json` and `echo x > .cursor/hooks.json` are still blocked.
- In Claude Code, a new worktree of a generated project has each app's `.env`; in Cursor, a new worktree has `node_modules` and each app's `.env`.
- A Claude Code session lists each rule once in `/memory`, and Cursor lists each `.mdc` rule once.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should confirm that Cursor's file-path gate and ignore list are an acceptable counterpart to Claude Code's `permissions.deny`.
- **Constitution change:** moving the rules and changing the sync script and hook registration ship through their own issue, as `constitution-changes.md` requires, and the rest waits for it.
- **Not run in Cursor:** no Cursor client was available in this session. Which Claude Code events and matchers Cursor runs, and whether today's setup runs a hook twice, rest on Cursor's documentation; the Cursor run in **Proof** confirms them before the plan builds on them.
- **The option also names skills:** the option's name, **Include Third-Party Plugins, Skills, and Other Configs**, suggests that turning it off also stops Cursor loading `.claude/skills/`, while Cursor's skills page describes that loading without naming a setting. Unverified. If it does, a Cursor user who turns it off loses the project's skills; `AGENTS.md` asks Cursor users to keep it on, and the Cursor run in **Proof** checks it.
- **Rule frontmatter in Claude Code:** whether Claude Code ignores a `description` key in `.claude/rules/` is unverified (**Where each file lives**).
- **Worktree setup in Cursor:** Cursor users report that the `cp` step fails silently since Cursor 3.0, that the file is not found under WSL, and that setup commands ask for approval (intent, Cursor forum). The Cursor run checks the copy; a failed copy leaves the app without `.env`, and the app's `.env.example` names each variable.
- **Nested `AGENTS.md` under the monorepo layout:** `intent/monorepo-apps/spec.md` keeps the `AGENTS.md` that `create-next-app` and `nest new` write in each app. Claude Code reads a subdirectory's `AGENTS.md` "when Claude opens a file there with the Read tool and that subdirectory has none of the three `CLAUDE.md` files of its own", but by default only "when you have no `CLAUDE.md` in your working directory or above it" ([Claude Code: memory](https://code.claude.com/docs/en/memory)), and the root has one. Unverified whether those app files load in Claude Code; Cursor reads `AGENTS.md` in subdirectories (intent). The `monorepo-apps` plan checks it, and an app that needs them in Claude Code gets a `CLAUDE.md` holding `@AGENTS.md`.
- **Order with other specs:** `intent/lean-agent-setup/spec.md` removes and merges rules, skills, and hooks in the same files; `intent/monorepo-apps/spec.md` moves per-stack files into `templates/base/`; `intent/playbook-plays/spec.md` adds `.agents/skills/loop-status/` and `project-setup/`, which go in `.claude/skills/` under this spec, and registers the reminder once under this spec; `intent/loop-autonomy/spec.md` edits skills in `.agents/skills/`, which go in `.claude/skills/`. The plans need one agreed order.

## Open questions

The intent left three checks to this spec:

- Whether a Cursor user can turn off reading Claude Code's configuration: yes, **Include Third-Party Plugins, Skills, and Other Configs** ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)). So the guards stay in `.cursor/hooks.json`, and their `.claude/settings.json` copies allow at once under Cursor (**Hooks**).
- Which Claude Code hook events Cursor runs: answered from Cursor's documentation in **Hooks**; carried to the plan to confirm with the run in **Proof**.
- Whether today's setup runs a hook twice: likely, from "All matching hooks from every source run"; carried to the plan to confirm with the same run.
