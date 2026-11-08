# Intent: Support Claude Code and Cursor from one source

Author: Joe Takara. Status: draft.

## Problem

- Claude Code is the primary coding agent, and some teams work mainly in Cursor.
- The repository and the templates support both: `.agents/` is the source, and `scripts/sync-agent-rules.ts` renders it into `.claude/` and `.cursor/`.
- The Cursor copy has already drifted from the source: `.cursor/BUGBOT.md` lists `templates/turborepo/.github/labeler.yml`, which does not exist.

## Proposed outcome

- Claude Code and Cursor get the same rules, skills, and guardrails, rendered from the one source in `.agents/`.
- Claude Code stays the reference agent: a new control lands there first and is then rendered for Cursor.
- Where Cursor lacks a feature that Claude Code has, `AGENTS.md` says so, as it already does for plan mode, and CI and code owner review remain the boundary for both agents.
- No rendered file drifts from its source.

## Affected users and systems

- Every engineer, whichever of the two agents they use, in this repository and in every generated project.
- `.agents/`, `scripts/sync-agent-rules.ts`, `.claude/`, `.cursor/`, and `AGENTS.md`.

## Constraints

- `.agents/` stays the single source; `.claude/` and `.cursor/` are rendered, not edited by hand.
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- Rules, hooks, and agent settings are constitution files and change as `constitution-changes.md` describes.
