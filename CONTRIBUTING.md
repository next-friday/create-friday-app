# Contributing to @next-friday/create-app

This repository contains one ESM package, `@next-friday/create-app`, the CLI that generates Next Friday projects.

## Code of conduct

Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Prerequisites

- Use the Node.js version declared by `.nvmrc` and `package.json#engines`.
- Use the pnpm version declared by `package.json#packageManager` through Corepack.
- Install [gitleaks](https://github.com/gitleaks/gitleaks#installing), for example `brew install gitleaks`. The pre-commit hook refuses to commit without it.

From the repository root:

```sh
corepack enable
git clone https://github.com/next-friday/create-friday-app.git
cd create-friday-app
pnpm install
```

`pnpm install` installs the Git hooks.

## Quality standards

- Fix lint, type, test, documentation, and packaging failures at their root cause.
- Preserve the CLI arguments, prompts, and generated project layout unless the change explicitly declares a breaking contract.
- Edit source under `src/`, tests under `test/`, and templates under `templates/`.
- Treat `dist/` as generated output.

## Templates

Each stack is `templates/base` plus `templates/<stack>`. The CLI copies `base`, then the stack directory, into the new project.

- `base` holds the files every stack uses with the same content, such as the Git hooks, gitleaks, and agent rules. It is not a template on its own.
- A stack directory holds the files whose content differs by stack, such as `package.json` or `eslint.config.ts`. No path exists in both.
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

Three jobs in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) run only in CI: Template, which generates each stack and runs its checks; Consumer Smoke, which installs the packed CLI with npm and runs it; and Compatibility, which runs the tests on the Node.js versions and operating systems in its matrix. Do not report them as local successes. Run `pnpm audit` locally for the Dependency Audit job.

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
3. Merging that pull request runs `pnpm verify`, publishes to npm with provenance from the `Release` environment, and creates a GitHub release.

npm attaches a trusted publisher only to an existing package, so the first release publishes with an npm automation token:

1. Store the token as the `NPM_BOOTSTRAP_TOKEN` secret of the `Release` environment.
2. After the first publish, add `next-friday/create-friday-app` with workflow `release.yml` and environment `Release` as the package's trusted publisher on npmjs.com.
3. Delete the secret and the `NODE_AUTH_TOKEN` line from `release.yml`.

To try a pull request before release, add the `preview` label. [`.github/workflows/preview.yml`](.github/workflows/preview.yml) publishes it to pkg.pr.new and comments the install command.

## Pull requests

- Use `<type>(<scope>): <subject>` for pull request titles. The scope is required and lowercase, and the subject is at most 50 characters. [`.github/workflows/validate-pr-title.yml`](.github/workflows/validate-pr-title.yml) lists the allowed types and enforces this.
- Commit messages follow `@next-friday/commitlint-config-friday`. The `commit-msg` hook checks them.
- Keep each pull request focused on one cohesive change.
- Describe observable CLI effects.
- Report only checks that actually ran and include their results.
- Add or update tests only when they protect a distinct observable contract.
