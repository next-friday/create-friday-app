# Intent: Support Claude Code and Cursor from one source

Author: Joe Takara (Developer Productivity). Status: accepted.

## Problem

- Claude Code is the primary coding agent, and some teams work mainly in Cursor.
- The repository and the templates support both: `.agents/` is the source, and `scripts/sync-agent-rules.ts` renders it into `.claude/` and `.cursor/`.
- Every skill exists three times, in `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/`, in the root and in `templates/base/`. Cursor loads skills from all three ([Cursor: Skills](https://cursor.com/docs/skills)), and Cursor users report that it loads skills with the same name more than once, which wastes context ([Cursor forum](https://forum.cursor.com/t/critical-issue-duplicate-skills-loading-causing-context-window-waste-and-confusion/150137)). Unverified: whether a current Cursor release removes the duplicates.
- Most rendered files are copies that one agent could read from the source. The official documentation shows where each agent reads:

| What         | Claude Code reads                                                                                      | Cursor reads                                                                                                                                                                        |
| :----------- | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instructions | `CLAUDE.md`, which imports `AGENTS.md` ([Claude Code: memory](https://code.claude.com/docs/en/memory)) | `AGENTS.md`, in the root and in subdirectories ([Cursor: Rules](https://cursor.com/docs/rules))                                                                                     |
| Scoped rules | `.claude/rules/` ([Claude Code: memory](https://code.claude.com/docs/en/memory))                       | Only `.mdc` files with Cursor's frontmatter in `.cursor/rules/` ([Cursor: Rules](https://cursor.com/docs/rules))                                                                    |
| Skills       | `.claude/skills/` ([Claude Code: skills](https://code.claude.com/docs/en/skills))                      | `.agents/skills/`, `.cursor/skills/`, and `.claude/skills/` ([Cursor: Skills](https://cursor.com/docs/skills))                                                                      |
| Subagents    | `.claude/agents/`                                                                                      | `.cursor/agents/` and `.claude/agents/` ([Cursor: Subagents](https://cursor.com/docs/subagents))                                                                                    |
| Hooks        | `.claude/settings.json`                                                                                | `.cursor/hooks.json`, and Claude Code's hooks in `.claude/settings.json` but not its permissions ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)) |
| MCP servers  | `.mcp.json` ([Claude Code: MCP](https://code.claude.com/docs/en/mcp))                                  | `.cursor/mcp.json` ([Cursor: MCP](https://cursor.com/docs/mcp))                                                                                                                     |
| Review       | `REVIEW.md` (playbook page 38)                                                                         | `.cursor/BUGBOT.md` and the `.md` files it links ([Cursor: Bugbot](https://cursor.com/docs/bugbot))                                                                                 |

- Symlinks cannot replace the copies, although the official Next.js repository links `.claude/skills` to `.agents/skills` ([vercel/next.js](https://github.com/vercel/next.js/tree/canary/.claude)):
  - The templates reach projects through the npm package, and `npm pack` leaves symlinks out. A test package with a linked folder and a linked file packed only the real file.
  - On Windows, "Git checks a committed symlink out as a plain text file unless `core.symlinks` is enabled", and creating one "needs Administrator privileges or Developer Mode" ([Claude Code: memory](https://code.claude.com/docs/en/memory)). This applies to the root as well as the templates.
- `CLAUDE.md` stays, holding only `@AGENTS.md`. Claude Code reads `AGENTS.md` directly from v2.1.277 when no `CLAUDE.md` exists, but not in every session (an older version, the reading plugin turned off, or the first session after an upgrade), and its documentation says to keep such a `CLAUDE.md` "if some of your sessions can't load `AGENTS.md` directly" ([Claude Code: memory](https://code.claude.com/docs/en/memory)). Anthropic's own repositories use `CLAUDE.md`; the official Next.js repository has only `AGENTS.md`.
- Subagents need a file per agent: a Cursor subagent takes `name`, `description`, `model`, `readonly`, and `is_background` ([Cursor: Subagents](https://cursor.com/docs/subagents)), while a Claude Code subagent restricts its tools with `tools` ([Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)), as the templates' verifier does (`templates/base/.agents/agents.json`).
- `.cursor/BUGBOT.md` is written by hand, not rendered, so `pnpm rules:check` does not cover it, and it has already drifted from `AGENTS.md`: it lists `templates/turborepo/.github/labeler.yml`, which does not exist. `intent/lean-agent-setup/intent.md` fixes it: the list lives only in `AGENTS.md`, and `.cursor/BUGBOT.md` links to it.
- Cursor likely runs each agent hook twice today: "All matching hooks from every source run" ([Cursor: Third-party hooks](https://cursor.com/docs/reference/third-party-hooks)), and the same scripts are registered in both `.cursor/hooks.json` and `.claude/settings.json`. Unverified by a run in Cursor.
- The CI step that runs `pnpm rules:check` is named "Check Cursor rules match .agents/rules", although the check covers both `.claude/` and `.cursor/` copies. The name appears in the root `.github/workflows/ci.yml` and in every template's `ci.yml`.
- A new worktree starts without its setup. A worktree is a fresh checkout, so it has no `node_modules` and no `.env`, and neither tool's setup file exists in the root or the templates:
  - Cursor runs the commands in `.cursor/worktrees.json` when it creates a worktree, and its example installs dependencies and copies `.env` from `$ROOT_WORKTREE_PATH` ([Cursor: Worktrees](https://cursor.com/docs/configuration/worktrees)). The official Next.js repository runs `pnpm install` and `pnpm build` there ([vercel/next.js `.cursor/worktrees.json`](https://github.com/vercel/next.js/blob/canary/.cursor/worktrees.json)). Cursor users report that the `cp` step fails silently since Cursor 3.0 ([Cursor forum](https://forum.cursor.com/t/root-worktree-path-not-resolving-in-worktrees-json-after-cursor-3-0-worktree-migration/156856)), that the file is not found under WSL ([Cursor forum](https://forum.cursor.com/t/worktrees-setup-not-working-in-wsl/140001)), and that setup commands ask for approval ([Cursor forum](https://forum.cursor.com/t/new-worktree-command-requires-approval-for-setup-steps/158484)).
  - Claude Code copies the gitignored files that `.worktreeinclude` lists, such as `.env`, into every worktree it creates with git, and has no setup command: its documentation says to ask Claude to install dependencies or to run the project's setup by hand ([Claude Code: Worktrees](https://code.claude.com/docs/en/worktrees)).
  - The root has no `.env`; the templates write one from `.env.example`.
  - The root's `.gitignore` does not ignore `.claude/worktrees/`, which the Claude Code documentation recommends; the templates already do.

## Proposed outcome

- Claude Code and Cursor get the same rules and skills from one source, and the same guardrails as far as each agent supports them: Claude Code through `permissions.deny`, Cursor through its own file-path hook, because Cursor's documentation names only Claude Code's hooks among what it reads from `.claude/settings.json`, not its permissions.
- Each instruction, rule, skill, and hook has one source, and neither agent loads a copy twice. A hook that both agents run is wired once, in `.claude/settings.json`, which Cursor also reads, unless a Cursor user can turn off reading Claude Code's configuration: then the guards that must hold also stay in `.cursor/hooks.json`, and the spec checks that setting and that no guard runs twice; `.cursor/hooks.json` keeps only hooks that exist for Cursor alone, such as its file-path gate. The spec confirms with a run in Cursor which Claude Code hook events Cursor runs, and whether today's setup runs a hook twice. A file is rendered for one agent only where that agent's official documentation shows it cannot read the source; today that is Cursor's scoped `.mdc` rules, `.cursor/mcp.json`, and a subagent file per agent, rendered from one subagent source, because the two agents use different subagent fields. Skills live only in `.claude/skills/`, where the playbook puts them (page 25, step 3) and Cursor also reads them. No symlinks.
- Where Cursor lacks a feature that Claude Code has, `AGENTS.md` says so, as it already does for plan mode, and CI and code owner review remain the boundary for both agents.
- No rendered file drifts from its source, and the hand-written `.cursor/BUGBOT.md` links to `AGENTS.md` instead of repeating it (`intent/lean-agent-setup/intent.md`).
- Names and messages about the rendered copies name both agents.
- A new worktree gets its setup. In the root and in every template, `.cursor/worktrees.json` installs dependencies for Cursor, and a Claude Code session installs them as its documentation says. In the templates, `.cursor/worktrees.json` also copies `.env`, and `.worktreeinclude` copies it for Claude Code. The root's `.gitignore` ignores `.claude/worktrees/`.

## Affected users and systems

- Every engineer, whichever of the two agents they use, in this repository and in every generated project.
- `.agents/`, `scripts/sync-agent-rules.ts`, `.claude/`, `.cursor/`, and `AGENTS.md`.

## Constraints

- Each instruction, rule, skill, and subagent has one source; a file rendered from it is not edited by hand.
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- A change to hooks, rules, or agent settings goes through a pull request that code owners approve.

## Open questions

Not recorded when this intent was written.
