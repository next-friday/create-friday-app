# Intent: CI that follows the playbook and Turborepo's guidance

Author: Joe Takara. Status: draft.

## Problem

The CI in this repository and in the templates has drifted from the AI-native SDLC Playbook and from Turborepo's official guidance. It works, but it is the traditional kind: deterministic scripts only, with every judgment step left to a person.

| Problem                                                                                                                                                     | Where                                                                                                                                       | Source                                                           |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------- |
| The AI-native steps are missing: evals, the triage summary of a failed build, and the `@claude` fix loop.                                                   | `templates/`, root                                                                                                                          | Playbook pages 34–35, 38, 44–45                                  |
| There is no rollback command, so rollback is a manual runbook.                                                                                              | `templates/*/.github/workflows/deploy.yml`                                                                                                  | Playbook page 45, step 6                                         |
| The production gate checks for "production", but deploys target the `prod` environment, so the gate never fires.                                            | `templates/base/.agents/hooks/agent-production-gate.sh`                                                                                     | Playbook pages 40–41                                             |
| CI names each app in code: `affected-apps.sh` lists `app` and `backoffice`, and each Dockerfile copies every app's `package.json` instead of `turbo prune`. | `templates/turborepo/.github/scripts/affected-apps.sh`, `templates/turborepo/apps/*/Dockerfile`                                             | Turborepo docs: `constructing-ci.mdx`, `guides/tools/docker.mdx` |
| The root CI splits checks into many jobs that each install dependencies again, while the pre-push hook already runs the same `pnpm verify`.                 | `.github/workflows/ci.yml`                                                                                                                  | This repository                                                  |
| The root "Triage failed build" job still uses workload identity federation, which no other workflow uses.                                                   | `.github/workflows/ci.yml`, lines 345–398                                                                                                   | This repository                                                  |
| Scanners overlap: CodeQL and Semgrep both run static analysis; OSV-Scanner repeats what Dependabot and Dependency Review already report.                    | `templates/base/.github/workflows/codeql.yml`, `templates/*/.github/workflows/sast.yml`, `templates/base/.github/workflows/osv-scanner.yml` | This repository                                                  |
| Every pull request gets the `changes` label, which tells a reviewer nothing.                                                                                | `.github/labeler.yml`                                                                                                                       | This repository                                                  |

## Proposed outcome

- CI does what the playbook's CI plays describe: evals run when the agent's configuration changes, a failed build gets a triage summary, `@claude` on a review comment pushes a fix, and rollback is one rehearsed command.
- Evals run both on every pull request that changes `CLAUDE.md`, `AGENTS.md`, skills, hooks, or `evals/`, and on a nightly schedule, as the playbook's `agent-evals.yml` example shows (pages 34–35).
- The agent may act up to the production gate and cannot pass it, and the gate matches how the project really deploys.
- CI follows Turborepo's official guidance: it finds changed apps with `turbo query affected`, runs checks with `turbo run --affected`, builds images with `turbo prune --docker`, and names no app in code.
- The root CI runs every check in one job, `pnpm verify`, the same command the pre-push hook runs, as the templates' CI already does. It keeps the jobs that test the product: Template, Consumer Smoke, and Compatibility.
- Each check has one tool:
  - Keep CodeQL for static analysis; it is the default for teams on GitHub and reports into the Security tab and the pull request. Remove Semgrep (`sast.yml`).
  - Keep both secret scanners: gitleaks runs fast at commit time and in CI, and holds the payment card (PAN) rules in `.gitleaks.toml`, which stay in every template even though no template handles payments, because client projects may, and card numbers can leak through fixtures, logs, or copied test data (pages 4 and 27); TruffleHog in CI checks whether a found secret is still live.
  - Keep Dependency Review with Dependabot for dependency vulnerabilities. Remove OSV-Scanner.
  - Keep diff-cover for the templates' patch coverage gate: it runs inside CI with no paid service, which private projects need. The root keeps Codecov, which is free for this open-source repository. A Vitest threshold cannot replace either, because it measures the whole project, not the changed lines.
  - Keep Trivy, hadolint, zizmor, Scorecard, and the pull request title check; none overlaps another tool.
  - Remove the `changes` label from `.github/labeler.yml`.
- A CI decision that departs from the playbook or from a tool's official documentation records the decision as an architecture decision record (ADR) beside the project's other ADRs, with its reason.

## Affected users and systems

- This repository's `.github/workflows/`.
- Every template's `.github/workflows/`, `.github/scripts/`, Dockerfiles, and `SETUP.md`.
- Each consumer's Claude API budget, because evals, triage, and the fix loop call the API.

## Constraints

- Workflow files at the root of this repository cannot be pushed from an agent session; a person commits them.
- Claude API access uses an API key secret.
- Related intents: `intent/restore-playbook-plays/intent.md` covers the plays outside CI, and `intent/monorepo-apps/intent.md` covers CI for apps at `apps/<group>/<app>`, the remote cache, and image promotion.
