# Intent: Restore the playbook plays the templates lost

Author: Joe Takara. Status: draft.

## Problem

A play-by-play check of the templates on `main` against the AI-native SDLC Playbook found plays that are missing or incomplete. Four of them were removed in pull request #55 because the setup looked too complex, without a check against the playbook first.

| Play (playbook page)                     | State on `main`                                                                                                                                                      |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continuous evals in CI (34–35)           | Missing: `agent-evals.yml` and `evals/` were removed in #55.                                                                                                         |
| AI in the PR review loop, step 4 (38)    | Incomplete: `REVIEW.md`, Claude Code Review, and `babysit-pr` exist; the `@claude` fix loop (`claude.yml`) was removed in #55.                                       |
| CI/CD integration and deployment (44–46) | Missing: the "Triage failed build" job, which page 45 shows, was removed in #55; deployment is not exposed through MCP; no rollback command exists.                  |
| Claude Tag and the lessons file (52)     | Missing: `lessons/`, where the post-mortem is written, was removed in #55.                                                                                           |
| Hooks as approval gates (40–41)          | Incomplete: `agent-production-gate.sh` checks for "production", but the deploy uses the `prod` environment, so the gate never fires.                                 |
| Closing the loop (48–51)                 | Incomplete: `bands.yaml` is an example only; there is no detection script or trigger, and step 7 ("add an eval for the incident") needs the evals that were removed. |
| Requirements and design (15–17)          | Incomplete: the brand, security, compliance, and UX policy skills exist but hold no policy yet.                                                                      |

## Proposed outcome

- Every play the playbook describes is present in the templates, or its absence is recorded with the playbook page and the reason.
- The four plays removed in #55 return: evals in CI, the `@claude` fix loop, the build triage job, and `lessons/`. They reach the Claude API with an API key secret, which management now allows, instead of workload identity federation.
- Rollback is a single command that the agent can run and that is rehearsed in staging (page 45, step 6).
- The production gate matches the command and environment the template actually deploys with.
- A change that removes or weakens part of a play cites the playbook page it affects, and the reviewer checks that page before approving.

## Affected users and systems

- Every project generated from the CLI: its CI workflows, `SETUP.md`, hooks, and folders.
- Each consumer's Claude API budget, because evals, the fix loop, and triage call the API.
- Policy owners, who write the content of the four policy skills.

## Constraints

- The agent may act up to the production gate and cannot pass it (page 46).
- Evals run on a schedule or on changes to `CLAUDE.md`, skills, or hooks, not on every change (page 34).
- Agent jobs in CI hold no production credentials and use short-lived, scoped tokens (page 45, step 3).

## Open questions

1. Do evals run on every pull request that changes the agent's configuration, or only on a schedule, to limit API cost?
2. Who writes the content of each policy skill, and from which source of truth?
3. Which metric does the first control band watch?
