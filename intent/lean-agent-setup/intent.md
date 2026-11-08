# Intent: A lean agent setup that matches the playbook

Author: Joe Takara. Status: draft.

## Problem

The agent setup in this repository and in the templates is heavier than the AI-native SDLC Playbook asks for. Each item below was checked against the playbook before it was listed.

| Problem                                                                                                                                                                                                                                                                                   | Where                                                                                                            | Playbook                                                                                                                                                        |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The shell gate, which blocks agent commands that bypass checks, is a 366-line bash script with a 260-line test script, and every generated project carries both. `AGENTS.md` itself says the gate "is a convenience, not a security boundary: CI and code-owner review are the boundary". | `.agents/hooks/agent-shell-gate.sh`, `scripts/check-agent-gates.ts`, and the same two files in `templates/base/` | Page 27: build-phase hooks "should be fast and scoped"; the example hook is ten lines. Page 32: the agent must not be able to weaken the check on its own work. |

## Proposed outcome

- The shell gate is small, in the root and in every template: it blocks only the bypasses that matter, such as skipping Git hooks and editing protected paths, and its test covers only those cases.

## Affected users and systems

- Every engineer and agent session in this repository and in every generated project.
- `.agents/hooks/`, `scripts/`, `package.json` scripts, and `AGENTS.md`, in the root and in `templates/`.

## Constraints

- The agent still cannot weaken the checks on its own work (page 32); CI and code owner review stay the boundary.
- Hooks are constitution files and change as `constitution-changes.md` describes.
