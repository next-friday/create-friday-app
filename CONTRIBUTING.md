# Contributing to @next-friday/create-app

This repository contains one ESM package, `@next-friday/create-app`, the CLI that generates Next Friday projects.

## Code of conduct

Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Prerequisites

- Use the Node.js version declared by `.nvmrc` and `package.json#engines`.
- Use the pnpm version declared by `package.json#packageManager` through Corepack.
- Install [gitleaks](https://github.com/gitleaks/gitleaks#installing), for example `brew install gitleaks`. The pre-commit hook refuses to commit without it.
- Install [jq](https://jqlang.org/download/). The agent hooks refuse to run without it.
- Allow `editorconfig-checker` to fetch its binary. `pnpm format:check`, which `pnpm verify` and the pre-push hook run, downloads it through the GitHub releases API on first use; set `GITHUB_TOKEN` to avoid the anonymous rate limit. Where that API is unreachable, as in a Claude Code cloud session, place the release binary before the first run:

  ```sh
  mkdir -p node_modules/editorconfig-checker/bin/latest
  curl -fsSL https://github.com/editorconfig-checker/editorconfig-checker/releases/download/v4.0.2/editorconfig-checker-linux-amd64.tar.gz \
    | tar -xz -C node_modules/editorconfig-checker/bin/latest
  ```

From the repository root:

```sh
corepack enable
git clone https://github.com/next-friday/next-friday-create-app.git
cd next-friday-create-app
pnpm install
```

`pnpm install` installs the Git hooks.

## Quality standards

- Fix lint, type, test, documentation, and packaging failures at their root cause.

## Templates

Each stack is `templates/base` plus `templates/<stack>`. The CLI copies `base`, then the stack directory, into the new project.

- `base` holds the files every stack uses with the same content, such as the Git hooks, gitleaks, and agent rules. It is not a template on its own.
- A stack directory holds the files whose content differs by stack, such as `package.json` or `eslint.config.ts`. `AGENTS.md` says when a stack replaces a `base` file.
- Each stack stores its `.gitignore` as `_gitignore`, because npm leaves `.gitignore` out of published packages. The CLI renames it.

The root lint, format, Knip, and test configs skip `templates/`. To change or check a template, generate a project and run its `pnpm verify`, as `AGENTS.md` shows. Copy edited files back to `base` or the stack directory, and `.gitignore` back as `_gitignore`. Leave out `.env`, which the CLI writes from `.env.example`. Leave out `pnpm-lock.yaml`: `pnpm pack` drops nested lockfiles, so the generated project creates its own on the first `pnpm install`.

## Verification

Run the narrowest check that covers the change. Run `pnpm verify` before submitting package-wide changes.

For focused checks, use the relevant script in [`package.json`](package.json).

Run `pnpm evals:run` after you change `AGENTS.md`, a skill under `plugins/friday/source/skills/`, or a hook under `.agents/hooks/`, and add `--case <name>` to run one case. It runs the cases in `plugins/friday/adapters/claude-code/evals/` with `claude plugin eval` on your own Claude login, scores each case with and without the plugin, so it spends your Claude usage, and it is not part of `pnpm verify`.

Three jobs in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) run only in CI: Template, which generates each stack and runs its checks; Consumer Smoke, which installs the packed CLI with npm and runs it; and Compatibility, which runs the tests on the Node.js versions and operating systems in its matrix. Run `pnpm audit` locally for the Dependency Audit job. These workflows have no local command: Dependency Review, Zizmor with Actionlint, Secret Scan (TruffleHog and Gitleaks), and pull request title validation run on pull requests; the Triage failed build job comments on a failing pull request from this repository; OpenSSF Scorecard runs on pushes to `main`, weekly, and when a branch protection rule changes. CodeQL on this repository stays on GitHub default setup so an advanced workflow does not conflict with it. Generated projects ship an advanced CodeQL workflow.

## Git hooks

| Hook         | What it does                                                                                        |
| :----------- | :-------------------------------------------------------------------------------------------------- |
| `pre-commit` | Rejects commits on `main`, scans staged changes with gitleaks (`.gitleaks.toml`), runs lint-staged. |
| `commit-msg` | Checks the message with `@next-friday/commitlint-config-friday`.                                    |
| `pre-push`   | Rejects pushes to `main`, then runs `pnpm verify`.                                                  |

## Release intent

Use [`.changeset/README.md`](.changeset/README.md) to decide whether the change needs a changeset and which release type it is, including what counts as breaking.

## Releasing

1. A pull request that adds a changeset merges into `main`.
2. [`.github/workflows/release.yml`](.github/workflows/release.yml) opens or updates the `chore(release): version package` pull request, which bumps the version and writes `CHANGELOG.md`.
3. Merging that pull request runs `pnpm verify`, packs the package, stages it on npm with `npm stage publish` from the `Release` environment, and then creates the `v<version>` tag and GitHub release, before the version is on npm. Any later run on `main` skips a version whose tag exists, because CI cannot see what npm has staged.
4. A package maintainer approves the staged version, with 2FA, under **Staged Packages** on the package's npmjs.com page. The new version reaches the registry only then. This is the production gate: CI can stage a release but cannot publish it.

Two cases need a maintainer, because CI cannot see what npm has staged:

- **Staged, but the run failed before it created the tag.** Every later run fails at `npm stage publish`. Create the tag and release from the commit the run built: `gh release create v<version> --target <commit> --title v<version> --notes-file <file>`, where the file holds that version's `CHANGELOG.md` section without its heading.
- **A maintainer rejected the staged version.** Delete its release and tag with `gh release delete v<version> --cleanup-tag --yes`, then ship the fix as a new version through a changeset.

The package's trusted publisher on npmjs.com is `next-friday/next-friday-create-app`, workflow `release.yml`, and environment `Release`. The workflow stages with `npm stage publish` and never runs `npm publish`; npm's own checks of these fields and of the allowed actions are not verified here.

To try a pull request before release, add the `preview` label. [`.github/workflows/preview.yml`](.github/workflows/preview.yml) publishes it to pkg.pr.new and comments the install command.

## Repository settings

A repository admin sets these once in the GitHub repository settings. Git does not record them.

- **General → Pull Requests:** select **Automatically delete head branches**, so a branch is deleted when its pull request merges.
- **General → Pull Requests → Allow squash merging:** set the default commit message to the pull request title alone ([configure commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)). Each commit on `main` is then the pull request title and number, with only co-author trailers in the body; the pull request description holds the why.
- **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**, because every workflow declares the permissions it needs. Also select **Allow GitHub Actions to create and approve pull requests**, so [`.github/workflows/release.yml`](.github/workflows/release.yml) can open the `chore(release): version package` pull request.
- **Actions variables:** set `ANTHROPIC_FEDERATION_RULE_ID` and `ANTHROPIC_ORGANIZATION_ID`, which the Triage failed build job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) passes to `anthropics/claude-code-action`. Without them the job runs with empty inputs.
- **Branch protection for `main`:** require the status check `All Checks`, the job that fails when any verification job fails or is cancelled.
- **Environments:** create `Release`, which the `Stage on npm` job in [`.github/workflows/release.yml`](.github/workflows/release.yml) runs in.
- **Codecov:** the `Test & Coverage` job uploads `coverage/lcov.info` with `use_oidc` on pushes and on pull requests from this repository, and the upload does not fail the job.

## Pull requests

- Use `<type>(<scope>): <subject>` for pull request titles. The scope is required and lowercase, and the subject is at most 50 characters. [`.github/workflows/validate-pr-title.yml`](.github/workflows/validate-pr-title.yml) lists the allowed types and enforces this.
- Keep each pull request focused on one cohesive change.
- Describe observable CLI effects.
- After a pull request that only reformats code merges, the next pull request lists its commit on `main` in `.git-blame-ignore-revs` at the repository root, creating the file the first time, with a `#` comment that names the change, as [GitHub Docs](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files) shows. GitHub then hides that commit in the blame view.

## The loop

A change moves through the playbooks in `plugins/friday/source/skills/sdlc/playbooks/`: plan, design, build, review, deploy, and maintain, plus fix for a defect and question for a question. [`plugins/friday/source/skills/sdlc/SKILL.md`](plugins/friday/source/skills/sdlc/SKILL.md) matches a request to one playbook and runs it to the next human gate.

This repository is the source of truth for intents, specs, plans, and lessons (the playbook asks for one named source of truth per artifact, page 22). This repository's own choice is that GitHub pull requests are the source of truth for reviews and approvals. No other tracker is used.

### Plays this repository has

| Play (playbook page)                     | Where it lives                                                                                                        |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| Intent home (12–13)                      | [`intent/`](intent/README.md)                                                                                         |
| Interviews in Plan and Build (12, 19–20) | `plugins/friday/source/skills/sdlc/playbooks/plan.md` and `build.md`                                                  |
| Requirements and design (15–17)          | `plugins/friday/source/skills/sdlc/playbooks/design.md` and the four policy skills in `plugins/friday/source/skills/` |
| Feedback loop (31–33)                    | **Verifying your work** in `AGENTS.md`, and `plugins/friday/source/agents/verifier.md`                                |
| PR review loop, step 4 (38)              | `REVIEW.md` (rendered from `.agents/review.md`) and `plugins/friday/source/skills/sdlc/playbooks/review.md`           |
| CI/CD step 1, triage (45)                | The **Triage failed build** job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                             |
| Closing the loop (48–51)                 | [`bands.yaml`](bands.yaml)                                                                                            |
| Claude Tag and the lessons file (52)     | [`lessons/`](lessons/README.md)                                                                                       |

### How the loop is measured

`pnpm loop:measure` reads git history and prints one row per `intent/<change>/` folder: the days from the first `intent.md` commit to the first `spec.md` commit, the commits to `intent.md` after the first `spec.md` commit, and the commits to `spec.md` after the first `plan.md` commit. The other plays' indicators are not collected in this repository.
