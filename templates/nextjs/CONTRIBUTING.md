# Contributing

Use this guide to prepare changes to this repository.

## Prerequisites

- Use the Node.js version declared by `.nvmrc` and `package.json#engines`.
- Change the Node.js version in `.nvmrc` and the `Dockerfile` together. Dependabot updates only the `Dockerfile`.
- Install pnpm once with `npm install --global pnpm`. It switches to the version declared by `package.json#packageManager` automatically.
- Use Claude Code v2.1.295 or later. It reads `AGENTS.md` directly and supports the `onFailure` field the agent hooks use.
- Install gitleaks 8.19 or later, which the `pre-commit` hook runs, and jq, which the agent hooks and the `pre-push` hook (`pnpm gates:check`) need: `brew install gitleaks jq` on macOS, or install them from each project's releases on Linux.

From the repository root:

```sh
npm install --global pnpm
pnpm install
```

## Quality standards

- Fix lint, type, and test failures at their root cause.
- Put unit tests next to the code as `*.test.ts` and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.
- Treat `coverage/` as generated output.
- Do not commit `.env` files or credentials.

## Verification

Run the narrowest check that covers the change while you work. Git hooks run these checks:

| Hook               | Checks                                                                                                                                                |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit`       | blocks commits on `main` except the first commit of a new repository, gitleaks on staged changes, `pnpm rules:check`, and lint-staged on staged files |
| `commit-msg`       | commitlint                                                                                                                                            |
| `pre-merge-commit` | blocks merge commits on `main`                                                                                                                        |
| `pre-push`         | blocks pushes to `main` except the push that creates it, then `pnpm check`: the static checks and the unit tests related to your changes              |

- **Scans:** CI also runs coverage, the build, the container image, and the secret, SAST, and OSV scans. Dependabot and OSV-Scanner report vulnerable dependencies.
- **End-to-end tests:** run `pnpm test:e2e` when you change pages. It starts the development server unless one is already running. Run `pnpm exec playwright install chromium` once before the first run. CI runs it against the production build on every pull request that is ready for review and changes code.
- **Coverage:** CI requires 95% branch coverage on changed lines in `app/`, except `layout.tsx`.

Run `pnpm verify` for repository changes.

Agent rules live in `.agents/rules/` with their scope in `.agents/rules.json`. After you change either, run `pnpm rules:sync` to regenerate `.claude/rules/` and `.cursor/rules/`.

## Pull requests

We use trunk-based development. `main` is the only long-lived branch, and every deploy promotes a commit from `main` (see the Deploy section in the README).

- Branch from `main` and merge back within a day or two. Do not create `develop` or release branches.
- Merge unfinished work behind a feature flag or keep it unreachable instead of holding a long-lived branch.
- Pull requests are squash-merged, so the pull request title becomes the commit on `main`.
- Write commit messages in the format that `@next-friday/commitlint-config-friday` defines. Pull request titles use `<type>(<scope>): <subject>`, which `.github/workflows/validate-pr-title.yml` checks.
- Keep each pull request focused on one cohesive change.
- Describe observable page, route, content, or configuration effects.
- Report only checks that actually ran and include their results.
- Add or update tests only when they protect a distinct observable contract.
