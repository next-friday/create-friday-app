# Intent: An independent agent reviews each change before it is pushed

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

Review bots that run after a push hold up the loop:

- **CodeRabbit:** its free open source limit was used up on 2026-11-09: "You've used all free OSS reviews for now. Wait for the free limit to reset". On pull requests #68 and #69 it posted only that notice, with the next review 43 and 41 minutes away, and on #66 "Review rate limited". None of the three got a review. Nothing under `templates/` sets it up.
- **Bugbot:** every generated project sets it up to review each pull request by the rules in `.cursor/BUGBOT.md` (`templates/base/SETUP.md`, line 11 and section 5, line 84). A second bot on each pull request adds another wait after the push. This repository has `.cursor/BUGBOT.md` too, but Bugbot posted nothing on #65, #67, or #75.

The agent's own check before a person sees the work is weak. The verifier subagent (`.agents/agents/verifier.md`, rendered to `.claude/agents/` and `.cursor/agents/`) runs the app and reports, but it does not apply the review passes in `REVIEW.md`. Nothing calls it: a search finds it only in `.agents/agents.json` and its rendered copies.

The playbook puts an independent check before the work reaches a person. A verifier subagent runs "a fresh context window once the session believes the work is done. This way the verdict is not colored by the assumptions that produced the code" (page 31). The maintenance stage uses "an independent confidence gate between stages, a deterministic check or an adversarial reviewing agent" (page 48).

## Proposed outcome

- Before every push, an independent reviewer subagent with a fresh context reviews the diff. It reads only the diff, `REVIEW.md`, `spec.md`, and `plan.md`. It runs the passes `REVIEW.md` names: bugs, security, and compliance with the spec and plan. The reviewer only reports; it does not edit.
- A hook, not the agent's memory, enforces the review. Before an agent session runs `git push`, the hook blocks the push unless the review ran on the commit being pushed. The playbook: "A skill is a control, though an advisory one ... nothing forces a session to comply with it. A policy that must always hold needs something deterministic behind the skill, such as a hook that blocks the action or a review pass that re-checks the policy at the PR" (page 26). The review pass at the PR is Claude Code Review, below. Both agents already run hooks before a shell command: Claude Code through `PreToolUse` in `.claude/settings.json`, Cursor through `beforeShellExecution` in `.cursor/hooks.json`.
- The agent fixes every Important finding before it pushes, and writes the reviewer's findings into the pull request, so a code owner sees what was checked. The playbook keeps the record on the pull request: "The PR thread records both the request and the change" (page 38).
- Bugbot and CodeRabbit are removed. Rules in `.cursor/BUGBOT.md` that the review still needs move into `.agents/review.md`, so the review rules have one source.
- Claude Code Review reviews each pull request (pages 37–38), so a change a person writes without an agent is still reviewed. Every generated project sets it up (`templates/base/SETUP.md`, line 74). This repository has not turned it on: no pull request from #65 to #78 has a Claude Code Review check run, so it is turned on here.
- Findings neither approve nor block a pull request: "Findings do not approve or block a PR on their own, and branch protection still requires approval from a code owner" (page 38).
- The same holds in this repository and in every generated project.

## Affected users and systems

- The product owner, the engineers, and the agents of this repository and of every generated project.
- In the root and in `templates/base/`: `.agents/review.md` and its rendered `REVIEW.md`, `.cursor/BUGBOT.md`, `.agents/agents/` and `.agents/agents.json` with their rendered `.claude/agents/` and `.cursor/agents/`, the hook configuration (`.agents/hooks/`, `.claude/settings.json`, `.cursor/hooks.json`), and the `git-workflow` skill.
- `AGENTS.md` and `README.md` in the root and in each `templates/<stack>/`, and `templates/base/SETUP.md`.
- The Claude Code Review setting for this repository, which an admin turns on.
- The CodeRabbit installation on this repository, which a person removes in GitHub.

## Constraints

- The product owner decided on 2026-11-10: the reviewer replaces Bugbot and CodeRabbit, Claude Code Review stays, a hook enforces the review because agents forget steps, and the change applies in this repository and in every generated project.
- The product owner stopped using Bugbot and CodeRabbit on 2026-11-10, before this change is built. Until the reviewer and its hook exist, agents do not wait for either bot, and they run a reviewer subagent by hand before each push.
- Approval comes from a person: "Approval comes from a human through branch protection" (page 39). The reviewer never approves.
- A file in the constitution changes through `constitution-changes.md`.

## Open questions

- How does a pull request show that the review ran, so a skipped review is visible to the code owner and to CI?
- Cursor sessions also write code in these projects, and the subagent sync already renders to `.cursor/agents/` (`scripts/sync-agent-rules.ts`, lines 101–104). Does the same reviewer subagent and its hook work there as in Claude Code?
- How does the hook know the review ran on the commit being pushed, in a way the agent cannot fake by writing the record itself?
