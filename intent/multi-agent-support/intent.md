# Intent: Support Claude Code, Cursor, and Codex from one source

Author: Joe Takara. Status: draft.

## Problem

- Engineers use more than one coding agent. Claude Code is the primary agent, some teams work mainly in Cursor, and some engineers use Codex.
- The repository and the templates support Claude Code and Cursor: `.agents/` is the source, and `scripts/sync-agent-rules.ts` renders it into `.claude/` and `.cursor/`. Nothing mentions Codex.
- What a Codex session gets today:

  | Part of the setup                                                                       | Codex                                                                                                                                                                                   |
  | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `AGENTS.md`                                                                             | Read. Unverified: the source is a community guide, not OpenAI's documentation.                                                                                                          |
  | Skills in `.agents/skills/`                                                             | Read: OpenAI's Codex documentation says Codex scans `.agents/skills` from the working directory up to the repository root ([Agent Skills](https://developers.openai.com/codex/skills)). |
  | Rules and their scopes (`.agents/rules/`, `.agents/rules.json`)                         | Not loaded; `AGENTS.md` only points to the folder.                                                                                                                                      |
  | Hooks: format after edit, test-edit gate, production gate, shell gate, suppression gate | None. Community sources describe an experimental `.codex/hooks.json`; unverified.                                                                                                       |
  | Plan mode as the default, and the verifier subagent                                     | None.                                                                                                                                                                                   |

- The playbook's controls therefore depend on which agent an engineer opens: the production gate (pages 40–41) and the test-edit gate (page 32) do not run in a Codex session.
- The playbook audit suggested removing Cursor as unused. That suggestion is wrong: some teams use Cursor as their main agent.

## Proposed outcome

- Claude Code, Cursor, and Codex each get the same rules, skills, and guardrails, rendered from the one source in `.agents/`.
- Claude Code stays the reference agent: a new control lands there first and is then rendered for the others.
- Where an agent lacks a feature, such as hooks, `AGENTS.md` says so, and CI and code owner review remain the boundary that applies to every agent.
- Cursor support stays.

## Affected users and systems

- Every engineer, whichever agent they use, in this repository and in every generated project.
- `.agents/`, `scripts/sync-agent-rules.ts`, `.claude/`, `.cursor/`, `AGENTS.md`, and a new Codex configuration if Codex supports it.

## Constraints

- `.agents/` stays the single source; agent-specific folders are rendered, not edited by hand.
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- Rules, hooks, and agent settings are constitution files and change as `constitution-changes.md` describes.

## Open questions

1. Which Codex surfaces must be supported: the CLI, the IDE extension, or the cloud agent?
2. Is it enough that CI and code owner review enforce the guardrails for Codex, or must Codex sessions block actions as Claude Code does?
