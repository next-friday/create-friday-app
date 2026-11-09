# Intent: Add the playbook plays the templates miss

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

A play-by-play check of the templates on `main` against the AI-native SDLC Playbook found plays that are missing or incomplete.

| Play (playbook page)                     | State on `main`                                                                                                                                                      |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continuous evals in CI (34–35)           | Missing: there is no `agent-evals.yml` or `evals/`.                                                                                                                  |
| AI in the PR review loop, step 4 (38)    | Incomplete: `REVIEW.md`, Claude Code Review, and `babysit-pr` exist; the `@claude` fix loop (`claude.yml`) is missing.                                               |
| CI/CD integration and deployment (44–46) | Missing: there is no "Triage failed build" job, which page 45 shows; deployment is not exposed through MCP; no rollback command exists.                              |
| Claude Tag and the lessons file (52)     | Missing: there is no `lessons/`, where the post-mortem is written.                                                                                                   |
| Hooks as approval gates (40–41)          | Incomplete: `agent-production-gate.sh` checks for "production", but the deploy uses the `prod` environment, so the gate never fires.                                 |
| Closing the loop (48–51)                 | Incomplete: `bands.yaml` is an example only; there is no detection script or trigger, and step 7 ("add an eval for the incident") needs the evals that were removed. |
| Requirements and design (15–17)          | Incomplete: the brand, security, compliance, and UX policy skills exist but hold no policy yet.                                                                      |

## Proposed outcome

- Every play the playbook describes is present in the templates, or its absence is recorded with the playbook page and the reason.
- The four missing plays are added: evals in CI, the `@claude` fix loop, the build triage job, and `lessons/`. They reach the Claude API with an API key secret instead of workload identity federation, as the playbook's eval example does (pages 34–35). This departs from page 45, step 3, which asks for short-lived, scoped tokens, and from Anthropic's own repositories, which use workload identity federation (for example `anthropics/claude-code-action`, `.github/workflows/issue-triage.yml`). That change's `spec.md` and `plan.md` record the departure and its reason: workload identity federation needs setup the team chose not to take on.
- Rollback is a single command that the agent can run and that is rehearsed in staging (page 45, step 6).
- The production gate matches the command and environment the template actually deploys with.
- A change that removes or weakens part of a play records the reason in that change's `spec.md` or `plan.md`, which the playbook commits as the audit trail (pages 7 and 20), so the departure is visible in review and later.

## Affected users and systems

- Every project generated from the CLI: its CI workflows, `SETUP.md`, hooks, and folders.
- Each consumer's Claude API budget, because evals, the fix loop, and triage call the API.
- Policy owners, who write the content of the four policy skills.

## Constraints

- The agent may act up to the production gate and cannot pass it (page 46).
- Evals run as `intent/ci/intent.md` decides.
- Agent jobs in CI hold no production credentials (page 45, step 3). Their Claude API key is the one departure from that step's short-lived, scoped tokens, recorded in that change's `spec.md` and `plan.md`.

## Open questions

1. Who writes the content of each policy skill, and from which source of truth?
2. Which metric does the first control band watch?
