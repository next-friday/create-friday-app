# Intent: Support Claude Code and Cursor from one source

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- Claude Code is the primary coding agent, and some teams work mainly in Cursor.
- The repository and the templates support both: `.agents/` is the source, and `scripts/sync-agent-rules.ts` renders it into `.claude/` and `.cursor/`.
- Every skill exists three times, in `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/`, in the root and in `templates/base/`. Cursor loads skills from all three ([Cursor: Skills](https://cursor.com/docs/skills)), and Cursor users report that it loads skills with the same name more than once, which wastes context ([Cursor forum](https://forum.cursor.com/t/critical-issue-duplicate-skills-loading-causing-context-window-waste-and-confusion/150137)). Unverified: whether a current Cursor release removes the duplicates.
- Most rendered files are copies that one agent could read from the source. The official documentation shows where each agent reads:

| What         | Claude Code reads                                                                                      | Cursor reads                                                                                                                      |
| :----------- | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Instructions | `CLAUDE.md`, which imports `AGENTS.md` ([Claude Code: memory](https://code.claude.com/docs/en/memory)) | `AGENTS.md`, in the root and in subdirectories ([Cursor: Rules](https://cursor.com/docs/rules))                                   |
| Scoped rules | `.claude/rules/` ([Claude Code: memory](https://code.claude.com/docs/en/memory))                       | Only `.mdc` files with Cursor's frontmatter in `.cursor/rules/` ([Cursor: Rules](https://cursor.com/docs/rules))                  |
| Skills       | `.claude/skills/` ([Claude Code: skills](https://code.claude.com/docs/en/skills))                      | `.agents/skills/`, `.cursor/skills/`, and `.claude/skills/` ([Cursor: Skills](https://cursor.com/docs/skills))                    |
| Subagents    | `.claude/agents/`                                                                                      | `.cursor/agents/` and `.claude/agents/` ([Cursor: Subagents](https://cursor.com/docs/subagents))                                  |
| Hooks        | `.claude/settings.json`                                                                                | Claude Code's hooks in `.claude/settings.json` ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)) |
| MCP servers  | `.mcp.json` ([Claude Code: MCP](https://code.claude.com/docs/en/mcp))                                  | `.cursor/mcp.json` ([Cursor: MCP](https://cursor.com/docs/mcp))                                                                   |
| Review       | `REVIEW.md` (playbook page 38)                                                                         | `.cursor/BUGBOT.md` and the `.md` files it links ([Cursor: Bugbot](https://cursor.com/docs/bugbot))                               |

- Symlinks do not solve the copies for Cursor. Cursor users report that it no longer follows symlinks to `.mdc` files ([Cursor forum](https://forum.cursor.com/t/cursor-no-longer-can-follow-symlinks-to-rules-mdc-files/146010)), and Cursor staff confirm that a `CLAUDE.md` symlinked to `AGENTS.md` loads twice, because Cursor removes duplicates by file name ([Cursor forum](https://forum.cursor.com/t/cursor-double-counts-symlinked-files-in-context-explorer-e-g-claude-md-agents-md/164295)). A `CLAUDE.md` that imports `@AGENTS.md`, as this repository has, avoids it.
- Subagents need a file per agent: Cursor users report that subagents written for Claude Code name tools that Cursor does not have ([Cursor forum](https://forum.cursor.com/t/no-way-to-opt-out-of-third-party-claude-code-codex-config-loading-the-flag-is-hardcoded/166558)).
- `scripts/sync-agent-rules.ts` is custom code, 236 lines in the root and 231 in `templates/base/`, although maintained tools such as [Ruler](https://github.com/intellectronica/ruler) and [rulesync](https://github.com/dyoshikawa/rulesync) render one source for both agents. `platform-and-library-first.md` asks a pull request to state why custom code is needed, and none records it.
- The Cursor copy has already drifted from the source: `.cursor/BUGBOT.md` lists `templates/turborepo/.github/labeler.yml`, which does not exist.
- The CI step that runs `pnpm rules:check` is named "Check Cursor rules match .agents/rules", although the check covers both `.claude/` and `.cursor/` copies. The name appears in the root `.github/workflows/ci.yml` and in every template's `ci.yml`.
- A new worktree starts without its setup. A worktree is a fresh checkout, so it has no `node_modules` and no `.env`, and neither tool's setup file exists in the root or the templates:
  - Cursor runs the commands in `.cursor/worktrees.json` when it creates a worktree, and its example installs dependencies and copies `.env` from `$ROOT_WORKTREE_PATH` ([Cursor: Worktrees](https://cursor.com/docs/configuration/worktrees)). The official Next.js repository runs `pnpm install` and `pnpm build` there ([vercel/next.js `.cursor/worktrees.json`](https://github.com/vercel/next.js/blob/canary/.cursor/worktrees.json)). Cursor users report that the `cp` step fails silently since Cursor 3.0 ([Cursor forum](https://forum.cursor.com/t/root-worktree-path-not-resolving-in-worktrees-json-after-cursor-3-0-worktree-migration/156856)), that the file is not found under WSL ([Cursor forum](https://forum.cursor.com/t/worktrees-setup-not-working-in-wsl/140001)), and that setup commands ask for approval ([Cursor forum](https://forum.cursor.com/t/new-worktree-command-requires-approval-for-setup-steps/158484)).
  - Claude Code copies the gitignored files that `.worktreeinclude` lists, such as `.env`, into every worktree it creates with git, and has no setup command: its documentation says to ask Claude to install dependencies or to run the project's setup by hand ([Claude Code: Worktrees](https://code.claude.com/docs/en/worktrees)). A `WorktreeCreate` hook replaces Claude Code's own worktree creation entirely and must print the new path ([Claude Code: Hooks](https://code.claude.com/docs/en/hooks)); community examples use it to run an install ([tfriedel/claude-worktree-hooks](https://github.com/tfriedel/claude-worktree-hooks)), which means the hook must also create the worktree itself.
  - The root's `.gitignore` does not ignore `.claude/worktrees/`, which the Claude Code documentation recommends; the templates already do.

## Proposed outcome

- Claude Code and Cursor get the same rules, skills, and guardrails from one source.
- Each instruction, rule, skill, and subagent exists once, in a place both agents read, so neither agent loads a copy twice. A file is rendered for one agent only where that agent's official documentation shows it cannot read the source; today that is Cursor's scoped `.mdc` rules, `.cursor/mcp.json`, and one subagent file per agent. No symlinks.
- The rendering uses a maintained tool when one does the job; the spec compares the tools with the current script.
- Claude Code stays the reference agent: a new control lands there first and is then rendered for Cursor.
- Where Cursor lacks a feature that Claude Code has, `AGENTS.md` says so, as it already does for plan mode, and CI and code owner review remain the boundary for both agents.
- No rendered file drifts from its source.
- Names and messages about the rendered copies name both agents.
- A new worktree gets its setup, in the root and in every template: `.cursor/worktrees.json` installs dependencies and copies `.env` for Cursor, `.worktreeinclude` copies `.env` for Claude Code, and the root's `.gitignore` ignores `.claude/worktrees/`. How a Claude Code worktree installs dependencies, by the session as the documentation says or by a `WorktreeCreate` hook that also creates the worktree, is decided in the spec.

## Affected users and systems

- Every engineer, whichever of the two agents they use, in this repository and in every generated project.
- `.agents/`, `scripts/sync-agent-rules.ts`, `.claude/`, `.cursor/`, and `AGENTS.md`.

## Constraints

- Each instruction, rule, skill, and subagent has one source; a file rendered from it is not edited by hand.
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- Rules, hooks, and agent settings are constitution files and change as `constitution-changes.md` describes.
