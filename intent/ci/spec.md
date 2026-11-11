# Spec: CI that follows Turborepo's guidance and fits private client projects

From `intent/ci/intent.md`. Status: accepted.

Written at `main` `dfac1fc` with the `write-spec` skill as committed there. The agent wrote it as the next step of the loop, under `AGENTS.md`'s "Asking the product owner"; no product owner prompt added a constraint to the skill's prompt.

The templates' half of this spec assumes the monorepo layout of `intent/monorepo-apps/spec.md`: one monorepo per project, with apps at `apps/<group>/<app>` and the docs site at `apps/docs`.

## Requirements

1. CI names no app in code. `turbo query affected` lists the changed apps, and each per-app job (end-to-end tests, container image, deploy) runs as a matrix over that list.
2. Checks run as `turbo run <task> --affected`, and every app lints itself as Turborepo's ESLint guide sets up, with a `--concurrency` that fits the runner's memory.
3. Container images build with `turbo prune <app> --docker`.
4. The root keeps its checks in separate jobs by kind and drops the Release Integrity job.
5. In the root and in every template, at pull request time and on the push to `main`, a change that touches only Markdown or other files that do not affect the running app runs Prettier, ESLint, and the secret scanners, and skips the rest. A change to code runs everything.
6. A check is skipped by a job condition, never by `paths` or `paths-ignore`, and one final job is the required check.
7. In the monorepo templates, each task lists its `inputs` and `futureFlags.affectedUsingTaskInputs` is on, so `--affected` selects tasks by input. A change under `apps/docs` builds and deploys the docs site.
8. The templates hold only what a private repository on GitHub Team can run without an add-on: CodeQL, Dependency Review, and Scorecard leave the templates. Semgrep and OSV-Scanner run on each pull request that changes code or dependencies. The root keeps CodeQL, Dependency Review, and Scorecard.
9. Both secret scanners stay, with the PAN rules in every template. diff-cover stays in the templates and Codecov in the root.
10. Trivy, hadolint, zizmor, and the pull request title check stay. The root runs actionlint and zizmor on every template's workflow files on each pull request that changes them.
11. The `changes` label is removed.
12. The root and every template have a rule in `.agents/rules/`, scoped to `.github/**`, that tells an agent how to write a workflow safely, following the Next.js `.github/AGENTS.md`.

## Design

### Classifying a change

The root's `changes` job already classifies a change with `dorny/paths-filter` and `.github/file-filters.yml`, whose `heavy` filter matches every file except Markdown and other files that do not affect the running app (`.github/workflows/ci.yml`, lines 17–61). Today it runs everything on every push (`"$EVENT_NAME" == "push"` sets `full_verification=true`, line 56), and gates `lint` and `format` on `full_verification` too (lines 66 and 102).

The change:

- The `changes` job outputs `code`, true when `heavy` or `ci_policy` matches, on pull requests and on pushes alike. On a push to `main`, `dorny/paths-filter` compares against "the most recent commit on the same branch before the push" (`dorny/paths-filter` `README.md`), so merging a README change no longer counts as code.
- `lint`, `format`, and the secret scanners run on every change, with no condition. ESLint lints the `.md` files, so a Markdown change is still checked.
- Every other job runs only when `code` is true.
- **All Checks** stays the one required check. GitHub reports "Success" for "A job is skipped by a conditional", while a workflow skipped by path filtering leaves its checks "in a 'Pending' state" that "block merging" (GitHub Docs: Troubleshooting required status checks).

This follows the official Next.js repository: its `changes` job sets `docs-only`, its tests run only when `docs-only` is false, and `lint` runs on every change (`vercel/next.js` `.github/workflows/build_and_test.yml`, cited in the intent).

The templates' `ci.yml` gets the same `changes` job and the same split, with `templates/base/.github/file-filters.yml` as its filter.

### Turborepo in the templates

| Concern        | Design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout depth | `fetch-depth: 2`, as Turborepo's GitHub Actions guide uses it (`guides/ci-vendors/github-actions.mdx`, bundled with `turbo` 2.11.10), because "if the checkout is too shallow, all packages will be considered changed" (`crafting-your-repository/constructing-ci.mdx`). A pull request also fetches its base branch, as today's `ci.yml` does.                                                                                                                                                                   |
| Checks         | Each check is a `turbo run <task> --affected` step. With `"futureFlags": { "affectedUsingTaskInputs": true }` in the root `turbo.json`, "a task is only selected if the changed files match its `inputs` configuration" (`reference/configuration.mdx`). Each task lists its `inputs`, such as `"inputs": ["$TURBO_DEFAULT$", "!README.md"]`. `apps/docs` keeps Markdown in its `build` inputs, because its Markdown is the site's content.                                                                        |
| Lint           | Each app has its own `eslint.config` and a `lint` script running `eslint .`. The root `turbo.json` declares `"lint": { "dependsOn": ["^lint"] }`, and the root runs `turbo run lint` (`guides/tools/eslint.mdx`). CI passes `--concurrency 2`. Turborepo defaults to 10 tasks at once ("Default: `10`", `reference/run.mdx`), and one app's lint peaked at about 1,219 MB on 2026-11-09 (the intent's measurement). The runner's memory is not verified in this spec, so the plan measures it and sets the number. |
| Changed apps   | A `changed-apps` job runs `turbo query affected --packages` and outputs the paths under `apps/` as a JSON list. It replaces `templates/turborepo/.github/scripts/affected-apps.sh`, which names `app` and `backoffice`.                                                                                                                                                                                                                                                                                            |
| Per-app jobs   | End-to-end tests, the image, and the deploy each take `strategy.matrix.app: ${{ fromJSON(needs.changed-apps.outputs.apps) }}`, and each skips an app that lacks the file it needs (`test:e2e` script, `Dockerfile`), as `intent/monorepo-apps/spec.md` describes in **What an app's files tell CI**. Turborepo's documentation has no matrix example; the matrix is the community pattern the intent cites (WarpBuild; OneUptime). An empty list skips the job by its condition.                                   |
| Images         | Each app's `Dockerfile` builds from `turbo prune <package> --docker`. The `--docker` flag splits the pruned workspace into a dependency layer and a source layer "to optimize caching with Docker" (`guides/tools/docker.mdx`), so a dependency change in one app does not rebuild another. The pushed image path and the digest deploy follow `intent/monorepo-apps/spec.md`.                                                                                                                                     |

### The root's jobs

- **Release Integrity** is removed from `ci.yml` (lines 321–343), and from **All Checks**' `needs` (line 405). On the release pull request it repeats `format:check`, `sort-package-json:check`, `build`, and `check:publint`, which the `format` and `package-validation` jobs of the same run already check.
- The `release_pr` output of `changes` goes away with its only consumer.

### Scanners

| Scanner                           | Root                                                                                                                         | Templates                                                                                                                                                                                                                                                                                                     |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CodeQL                            | Kept (default setup)                                                                                                         | `templates/base/.github/workflows/codeql.yml` removed                                                                                                                                                                                                                                                         |
| Dependency Review                 | Kept                                                                                                                         | `templates/base/.github/workflows/dependency-review.yml` removed                                                                                                                                                                                                                                              |
| Scorecard                         | Kept                                                                                                                         | `templates/base/.github/workflows/scorecard.yml` removed                                                                                                                                                                                                                                                      |
| Semgrep (`sast.yml`), OSV-Scanner | Not present                                                                                                                  | Move into `ci.yml` as jobs that run when `code` is true, because a separate workflow cannot read the `changes` job's outputs. Their `paths-ignore` (`templates/base/.github/workflows/osv-scanner.yml`, line 8, and line 8 of each `sast.yml`) goes away, and their weekly runs move to `ci.yml`'s `schedule` |
| gitleaks, TruffleHog              | Kept on every change                                                                                                         | Kept on every change; the PAN rules in `.gitleaks.toml` stay                                                                                                                                                                                                                                                  |
| Trivy, hadolint                   | Not present                                                                                                                  | Kept in the image job                                                                                                                                                                                                                                                                                         |
| zizmor, actionlint                | Also run on `templates/**/.github/workflows/` whenever a pull request changes those paths, by passing the paths as arguments | Kept (`zizmor.yml`)                                                                                                                                                                                                                                                                                           |
| Patch coverage                    | Codecov                                                                                                                      | diff-cover                                                                                                                                                                                                                                                                                                    |
| Pull request title                | Kept                                                                                                                         | Kept                                                                                                                                                                                                                                                                                                          |

What Dependency Review reports in the root: on 2026-11-09, on Dependabot's pull request that bumped `knip` and `pkg-pr-new`, it listed "File: pnpm-lock.yaml", "+ knip@6.44.1", "+ pkg-pr-new@0.0.93", and the two removed versions, and reported "did not detect any vulnerable packages" (job `129217856736`). It therefore reads the direct dependencies of the root's two-document `pnpm-lock.yaml`. Whether it also lists transitive changes was not seen, because that pull request changed none.

The root's `zizmor.yml` runs on `paths: [".github/**"]` with `inputs: .github` (lines 6 and 36). It adds `templates/**/.github/**` to its paths and passes the changed template workflow directories to both zizmor and actionlint. actionlint checks the files it is given: "When paths to YAML workflow files are given as arguments, actionlint checks them" (`rhysd/actionlint` `docs/usage.md`).

### Labels

The `changes` entry in the root's `.github/labeler.yml` (lines 1–4) is removed. It matches `**`, so it labels every pull request. `templates/base/.github/labeler.yml` has no such entry.

### The workflow rule

A new rule, `.agents/rules/github-workflows.md`, scoped to `.github/**` in `.agents/rules.json`, rendered to Claude Code and Cursor by `pnpm rules:sync`, in the root and in `templates/base/`. It carries the Next.js `.github/AGENTS.md` sections that apply here:

- Use `pull_request`, not `pull_request_target`.
- Set `permissions: {}` at the workflow level and grant each job the least it needs.
- Pin third-party actions to a full commit SHA with the tag as a trailing comment.
- Pass `persist-credentials: false` to `actions/checkout` unless the job pushes.
- Route untrusted values through an environment variable, and start multi-line `run:` blocks with `set -euo pipefail`.

The rule links to `vercel/next.js` `.github/AGENTS.md` rather than copying it whole.

**The `pull_request_target` exception.** `pr-triage.yml` runs `actions/labeler` on `pull_request_target`, with `permissions: {}` at the top and `contents: read` and `pull-requests: write` for its one job, and it checks out nothing (`.github/workflows/pr-triage.yml`, lines 4–29). The labeler's documentation says a fork pull request gets "read access tokens for `pull_request` events, at most", recommends `pull_request_target` so the action can write labels, and warns to use it only in workflows "carefully designed to avoid executing untrusted code" (`actions/labeler` `README.md`). The Next.js guide allows the same case: "If you genuinely need secrets on a fork PR, never check out the PR's HEAD ref in the privileged job". The rule keeps `pr-triage.yml` as the one allowed `pull_request_target` workflow, on the condition that it checks out no code.

The rule is in the constitution: agents may not edit `.agents/rules/**` or `.agents/rules.json` (`.claude/settings.json`, deny list). It therefore ships through its own issue and pull request, as `constitution-changes.md` requires, and the rest of this change does not depend on it.

### Files that change

| File                                                                     | Change                                                                                                                 |
| :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`                                               | `changes` outputs `code`; `lint` and `format` run on every change; Release Integrity removed                           |
| `.github/workflows/zizmor.yml`                                           | Adds the template workflow paths                                                                                       |
| `.github/labeler.yml`                                                    | `changes` label removed                                                                                                |
| `templates/base/.github/workflows/`                                      | `codeql.yml`, `dependency-review.yml`, `scorecard.yml`, and `osv-scanner.yml` removed; OSV-Scanner moves into `ci.yml` |
| The monorepo template's `ci.yml`, `deploy.yml`, `sast.yml`, `turbo.json` | `changes` job, `changed-apps` matrix, `--affected` tasks with `inputs`, per-app lint, `turbo prune` images             |
| Each app template's `package.json`, `eslint.config`, `Dockerfile`        | Own `lint` script and ESLint config; `Dockerfile` from `turbo prune --docker`                                          |
| `templates/turborepo/.github/scripts/affected-apps.sh`                   | Removed                                                                                                                |
| `.agents/rules/github-workflows.md`, `.agents/rules.json`                | In the separate constitution change                                                                                    |
| `templates/base/SETUP.md`                                                | Drops the steps for the removed scanners                                                                               |

### Order of work

1. Open the constitution issue for the workflow rule.
2. The root: `changes` and the job conditions, Release Integrity, the labeler, and zizmor and actionlint on template workflows.
3. The templates' scanners.
4. The monorepo template's CI, together with `intent/monorepo-apps/spec.md`, which builds the layout it runs on.

## Proof

- A pull request that changes only `README.md` runs `lint`, `format`, and the secret scanners, skips the other jobs, and **All Checks** passes. A pull request that changes `src/` runs every job. Both hold for a push to `main`.
- A pull request that breaks a template workflow, for example with an unknown key, fails actionlint in the root before it merges.
- In a generated monorepo with two apps, a change to one app runs end-to-end tests, builds an image, and deploys only for that app; a change to `apps/docs/src/content/docs/` builds and deploys only the docs site.
- No workflow in the root or the templates names an app: `grep -rn 'apps/app\|backoffice' .github templates/base/.github` finds nothing.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should confirm removing CodeQL, Dependency Review, and Scorecard from the templates, and the `pull_request_target` exception.
- **Constitution change:** the workflow rule needs its own issue and pull request, which a code owner approves (`constitution-changes.md`).
- **Order with `monorepo-apps`:** the templates' CI half runs on the layout that `intent/monorepo-apps/spec.md` builds. Both change `ci.yml`, `deploy.yml`, and the Dockerfiles, so they land together or `monorepo-apps` lands first.
- **Lint concurrency:** the runner's memory was not measured here. `--concurrency 2` is a starting value from one measurement; the plan measures it.
- **Dependency Review on transitive changes:** not observed. A Dependabot pull request that changes a transitive dependency shows what it reports.

## Open questions

- The intent asks the spec to check what Dependency Review reports on a pull request that changes a dependency. Answered in **Scanners**, for direct dependencies; the transitive case is carried to **Areas of concern**.
- The intent leaves the `pull_request_target` conflict to the spec. Answered in **The workflow rule**.
