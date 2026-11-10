# Intent: An independent agent reviews each change before it is pushed

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

Review bots that run after a push hold up the loop:

- **CodeRabbit:** its free plan for open source ran out on 2026-11-09. On pull requests #68 and #69 it posted only "Review limit reached", with the next review 43 and 41 minutes away, and on #66 "Review rate limited". None of the three got a review. It is installed in this repository only.
- **Bugbot:** it reviews each pull request in every generated project (`templates/base/SETUP.md`, step 5 and line 11), by the rules in `.cursor/BUGBOT.md`. A second bot on each pull request adds another wait after the push.

The agent's own check before a person sees the work is weak. `.claude/agents/verifier.md` runs the app and reports, but it does not apply the review passes in `REVIEW.md`, and on 2026-11-10 no build called it.

The playbook puts an independent check before the work reaches a person. A verifier subagent runs "a fresh context window once the session believes the work is done. This way the verdict is not colored by the assumptions that produced the code" (page 31). The maintenance stage uses "an independent confidence gate between stages, a deterministic check or an adversarial reviewing agent" (page 48).

## Proposed outcome

- Before every push, an independent reviewer subagent with a fresh context reviews the diff. It reads only the diff, `REVIEW.md`, `spec.md`, and `plan.md`. It runs the passes `REVIEW.md` names: bugs, security, and compliance with the spec and plan. The reviewer only reports; it does not edit.
- The agent fixes every Important finding before it pushes, and writes the reviewer's findings into the pull request, so a code owner sees what was checked. The playbook keeps the record on the pull request: "The PR thread records both the request and the change" (page 38).
- Bugbot and CodeRabbit are removed. Rules in `.cursor/BUGBOT.md` that the review still needs move into `.agents/review.md`, so the review rules have one source.
- Claude Code Review stays on each pull request (pages 37–38), so a change a person writes without an agent is still reviewed.
- Findings neither approve nor block a pull request: "Findings do not approve or block a PR on their own, and branch protection still requires approval from a code owner" (page 38).
- The same holds in this repository and in every generated project.

## Affected users and systems

- The product owner, the engineers, and the agents of this repository and of every generated project.
- `.agents/review.md` and its rendered `REVIEW.md`, `.cursor/BUGBOT.md`, `.claude/agents/`, the `git-workflow` skill, `AGENTS.md`, `README.md`, and `templates/base/SETUP.md`, in the root and in `templates/base/`.
- The CodeRabbit installation on this repository, which a person removes in GitHub.

## Constraints

- The product owner decided on 2026-11-10: the reviewer replaces Bugbot and CodeRabbit, Claude Code Review stays, and the change applies in this repository and in every generated project.
- A person approves and merges (page 39). The reviewer never approves.
- A file in the constitution changes through `constitution-changes.md`.

## Open questions

- How does a pull request show that the review ran, so a skipped review is visible to the code owner and to CI?
- Cursor sessions also write code in these projects. How does the same review run there?
- A Git hook cannot call a model on every machine, because it needs network access and a key. So where is "before every push" enforced: in the agent's workflow, in a hook, or in both?
