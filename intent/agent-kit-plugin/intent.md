# Intent: Ship the company's agent kit as a plugin

Author: Joe Takara. Status: draft.

## Problem

- The agent kit is the rules, skills, subagents, hooks, and scripts that guide Claude Code and Cursor. This repository keeps two copies of it by hand: one in the root and one in `templates/base/`. 78 files in the two copies are identical.
- The copies have already drifted. The root's `scripts/sync-agent-rules.ts` (lines 84–88) stops with an error when `.agents/rules.json` names a rule that has no file; the copy in `templates/base/scripts/sync-agent-rules.ts` lacks that check. A fix reached one copy only.
- The CLI copies the kit into a project once, when it generates the project. A later fix to a rule, skill, or hook never reaches the client projects that already exist.
- The playbook distributes this kind of kit through a plugin:
  - Page 25, step 3: put the skill in the repository, "or distribute it organization-wide through a plugin".
  - Page 43: every skill, agent, hook, and MCP server "arrived through the organization's approved plugin marketplace".
- Both agents support plugins:
  - A Claude Code plugin holds skills, subagents, hooks, and MCP servers, and updates come from its marketplace. It does not hold rules or `AGENTS.md` ([Claude Code: Plugins](https://code.claude.com/docs/en/plugins)).
  - Cursor installs rules from a plugin published through a marketplace ([Cursor: Rules](https://cursor.com/docs/rules)).

## Proposed outcome

- The pieces every company project shares, such as the policy skills, the shared skills, the subagents, and the agent hooks, ship as one company plugin through the company's own marketplace, for Claude Code and for Cursor.
- A generated project enables that plugin in its committed settings, so everyone who works in the project gets it, and an existing project gets a fix by updating the plugin.
- The template keeps only what belongs to each project: `AGENTS.md`, the project's rules, CI, and Git hooks.
- This repository keeps no second hand-made copy of the kit.

## Affected users and systems

- Every engineer and agent session in every generated project, and in this repository.
- `templates/base/` (`.agents/`, `.claude/`, `.cursor/`, `scripts/`), the root's copies of the same folders, and `SETUP.md`.

## Constraints

- CI and code owner review stay the boundary; the agent still cannot weaken the checks on its own work (page 32).
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- A generated project must still pass its own `pnpm verify`.

## Open questions

1. Which pieces go into the plugin, and which stay in the template?
2. Do cloud sessions, such as Claude Code on the web, load a plugin that a project enables in its committed settings? The Claude Code documentation says a cloud session does not load the plugins in a person's local settings.
3. Where does the company's marketplace live?
