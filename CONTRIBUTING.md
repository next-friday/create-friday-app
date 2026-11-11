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
- Preserve the CLI arguments, prompts, and stack names unless the change explicitly declares a breaking contract.
- Edit source under `src/`, tests under `test/`, and templates under `templates/`.
- Treat `dist/` as generated output.

## Templates

Each stack is `templates/base` plus `templates/<stack>`. The CLI copies `base`, then the stack directory, into the new project.

- `base` holds the files every stack uses with the same content, such as the Git hooks, gitleaks, and agent rules. It is not a template on its own.
- A stack directory holds the files whose content differs by stack, such as `package.json` or `eslint.config.ts`. A stack replaces a `base` file only when that stack needs different content (rule 4 in `AGENTS.md`).
- Each stack stores its `.gitignore` as `_gitignore`, because npm leaves `.gitignore` out of published packages. The CLI renames it.

The root lint, format, Knip, and test configs skip `templates/`. To change or check a template, generate a project under the template's own name, so the rename changes nothing and files can be copied back as they are:

```sh
pnpm build
dir="$(mktemp -d)"
(cd "$dir" && node "$OLDPWD/dist/main.mjs" next-friday-template-nestjs --stack nestjs < /dev/null)
cd "$dir/next-friday-template-nestjs" && git add --all && pnpm verify
```

Copy edited files back to `base` or the stack directory, and `.gitignore` back as `_gitignore`. Leave out `.env`, which the CLI writes from `.env.example`. Leave out `pnpm-lock.yaml`: `pnpm pack` drops nested lockfiles, so the generated project creates its own on the first `pnpm install`. The `Template` jobs in CI generates each stack from the packed CLI and runs `pnpm verify` and `pnpm build`.

## Verification

Run the narrowest check that covers the change. Run `pnpm verify` before submitting package-wide changes.

For focused checks, use the relevant script in [`package.json`](package.json).

Three jobs in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) run only in CI: Template, which generates each stack and runs its checks; Consumer Smoke, which installs the packed CLI with npm and runs it; and Compatibility, which runs the tests on the Node.js versions and operating systems in its matrix. Do not report them as local successes. Run `pnpm audit` locally for the Dependency Audit job. Pull requests also run Dependency Review and OpenSSF Scorecard. CodeQL on this repository stays on GitHub default setup so an advanced workflow does not conflict with it. Generated projects ship an advanced CodeQL workflow.

## Git hooks

| Hook         | What it does                                                                                        |
| :----------- | :-------------------------------------------------------------------------------------------------- |
| `pre-commit` | Rejects commits on `main`, scans staged changes with gitleaks (`.gitleaks.toml`), runs lint-staged. |
| `commit-msg` | Checks the message with `@next-friday/commitlint-config-friday`.                                    |
| `pre-push`   | Rejects pushes to `main`, then runs `pnpm verify`.                                                  |

Work on a branch named `<type>/<short-description>`, for example `git switch --create fix/empty-directory-check`.

## Release intent

Use [`.changeset/README.md`](.changeset/README.md) to decide whether the change needs a changeset and which release type it is, including what counts as breaking.

## Releasing

1. A pull request that adds a changeset merges into `main`.
2. [`.github/workflows/release.yml`](.github/workflows/release.yml) opens or updates the `chore(release): version package` pull request, which bumps the version and writes `CHANGELOG.md`.
3. Merging that pull request runs `pnpm verify`, stages the package on npm with provenance from the `Release` environment, and then creates the `v<version>` tag and GitHub release, before the version is on npm. Any later run on `main` skips a version whose tag exists: npm refuses to stage a version twice, and CI cannot list staged versions because npm lets a trusted-publishing token run only `npm stage publish` and `npm publish`.
4. A package maintainer approves the staged version, with 2FA, under **Staged Packages** on the package's npmjs.com page. The new version reaches the registry only then. This is the production gate: CI can stage a release but cannot publish it.

Two cases need a maintainer, because CI cannot see what npm has staged:

- **Staged, but the run failed before it created the tag.** Every later run fails at `npm stage publish`. Create the tag and release from the commit the run built: `gh release create v<version> --target <commit> --title v<version> --notes-file <file>`, where the file holds that version's `CHANGELOG.md` section without its heading.
- **A maintainer rejected the staged version.** Delete its release and tag with `gh release delete v<version> --cleanup-tag --yes`, then ship the fix as a new version through a changeset.

The package's trusted publisher on npmjs.com is `next-friday/next-friday-create-app`, workflow `release.yml`, environment `Release`, with only `npm stage publish` allowed under **Allowed actions**. Allowing `npm publish` there would let CI publish directly and remove the gate. npm treats every field as case-sensitive and checks them only when a release publishes.

To try a pull request before release, add the `preview` label. [`.github/workflows/preview.yml`](.github/workflows/preview.yml) publishes it to pkg.pr.new and comments the install command.

## Repository settings

A repository admin sets these once in the GitHub repository settings. Git does not record them.

- **General → Pull Requests:** select **Automatically delete head branches**, so a branch is deleted when its pull request merges.
- **General → Pull Requests → Allow squash merging:** set the default commit message to the pull request title alone ([configure commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)). Each commit on `main` is then the pull request title and number, with only co-author trailers in the body; the pull request description holds the why.
- **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**, because every workflow declares the permissions it needs. Also select **Allow GitHub Actions to create and approve pull requests**, so [`.github/workflows/release.yml`](.github/workflows/release.yml) can open the `chore(release): version package` pull request.

## Pull requests

- Use `<type>(<scope>): <subject>` for pull request titles. The scope is required and lowercase, and the subject is at most 50 characters. [`.github/workflows/validate-pr-title.yml`](.github/workflows/validate-pr-title.yml) lists the allowed types and enforces this.
- Commit messages follow `@next-friday/commitlint-config-friday`. The `commit-msg` hook checks them.
- Keep each pull request focused on one cohesive change.
- Describe observable CLI effects.
- Report only checks that actually ran and include their results.
- Add or update tests only when they protect a distinct observable contract.
- After a pull request that only reformats code merges, the next pull request lists its commit on `main` in `.git-blame-ignore-revs` at the repository root, creating the file the first time, with a `#` comment that names the change, as [GitHub Docs](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files) shows. GitHub then hides that commit in the blame view.

## The loop

A change moves through the stages of the AI-native SDLC Playbook: Plan, Design, Build, Test, Deploy, and Maintain. [`.agents/skills/sdlc/SKILL.md`](.agents/skills/sdlc/SKILL.md) starts each stage, and each stage's playbook in `.agents/skills/sdlc/playbooks/` names the gate that follows it.

This repository is the source of truth for intents, specs, plans, and lessons (the playbook asks for one named source of truth per artifact, page 22). This repository's own choice is that GitHub pull requests are the source of truth for reviews and approvals. No other tracker is used.

### Plays this repository has

| Play (playbook page)                     | Where it lives                                                                                |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------- |
| Intent home (12–13)                      | [`intent/`](intent/README.md)                                                                 |
| Interviews in Plan and Build (12, 19–20) | `.agents/skills/sdlc/playbooks/plan.md` and `build.md`                                        |
| Requirements and design (15–17)          | `.agents/skills/sdlc/playbooks/design.md` and the four policy skills in `.agents/skills/`     |
| Feedback loop (31–33)                    | **Verifying your work** in `AGENTS.md`, and `.claude/agents/verifier.md`                      |
| PR review loop, step 4 (38)              | `REVIEW.md` (rendered from `.agents/review.md`) and `.agents/skills/sdlc/playbooks/review.md` |
| CI/CD step 1, triage (45)                | The **Triage failed build** job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)     |
| Closing the loop (48–51)                 | [`bands.yaml`](bands.yaml)                                                                    |
| Claude Tag and the lessons file (52)     | [`lessons/`](lessons/README.md)                                                               |

### How the loop is measured

Indicators are the playbook's own words, shortened by cutting words, with the page they come from. The last row is this repository's own, from `intent/loop-autonomy/spec.md`.

| Play (page of the indicators)     | Leading indicator                                                                                                           | Lagging indicator                                                                                                               | Where it is read                                                                                                                |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| Intent home (13)                  | Time from first conversation to a committed `intent.md`.                                                                    | The share of `intent.md` files that the product owner accepts into Design rather than closes.                                   | Git history of `intent/`, and the merge or the closed pull request. The first conversation is not collected in this repository. |
| Interviews in Plan and Build (21) | Share of changes that merge from the first implementation pass, and time from plan approval to merged PR.                   | Rework cycles per change, and how often the merged diff still matches the committed `plan.md`.                                  | Pull request metadata.                                                                                                          |
| Requirements and design (17)      | Elapsed time between the `intent.md` commit and the `spec.md` commit for the same change.                                   | Requirements rework after build starts: count `spec.md` commits dated after the first `plan.md` commit for the same change.     | `git log`.                                                                                                                      |
| Feedback loop (33)                | First-pass CI success rate for agent-written changes.                                                                       | Review time per PR, and the change failure rate from an incident tracker.                                                       | The CI system and pull request metadata. The incident tracker is not collected in this repository.                              |
| PR review loop, step 4 (39)       | Time to first review, and the share of review comments resolved without a human touching the branch.                        | Defects and vulnerabilities caught before merge set against those escaping to production.                                       | The pull request history. Escapes to production are not collected in this repository.                                           |
| CI/CD step 1, triage (46)         | The share of pipeline failures triaged without paging a human.                                                              | DevOps Research and Assessment (DORA) measures.                                                                                 | The CI/CD pipeline logs. DORA measures are not collected in this repository.                                                    |
| Closing the loop (51)             | Time from band breach to an `intent.md` in the triage queue.                                                                | The share of findings that become merged fixes, and repeat incidents of the same class.                                         | Not collected in this repository: it has `bands.yaml` but no detection script.                                                  |
| Hooks as approval gates (44)      | Time spent waiting on each approval gate.                                                                                   | Gate violations reaching production before and after hooks.                                                                     | Hook decisions in the OpenTelemetry export. Violations reaching production are not collected in this repository.                |
| Carry each step without asking    | Time from the head commit when the pull request opened to its `created_at`. A pull request with no such CI run is left out. | The share of the agent's pull requests that reach green with no push or comment from a person other than reviews and approvals. | The first CI run's `head_sha`, that commit's timestamp, and the pull request's `created_at`; the pull request timeline.         |
