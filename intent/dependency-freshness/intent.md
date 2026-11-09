# Intent: Keep dependencies current

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- Dependencies in this repository and in the templates fall behind their latest releases, so every generated project starts out of date.
- On 2026-11-08 the root and the templates were behind on:
  - the company configs, which `friday-code-standards` now releases together at one version (5.2.1 on 2026-11-08): `@next-friday/commitlint-config-friday` 4.0.0, `@next-friday/eslint-config-friday` 5.0.0 and 5.1.0, and `@next-friday/prettier-config-friday` 4.0.0, all instead of 5.2.1;
  - TypeScript at the root: 6.0.3 instead of 7.0.2, released 123 days earlier;
  - pnpm: 12.6.0 instead of 12.17.0 or later;
  - Node.js in `.nvmrc`: 24.22.1 instead of 24.22.2.
- Dependabot does not cover several of these:
  - It does not update `.nvmrc` or the `packageManager` field.
  - The root groups take only minor and patch updates. A major such as TypeScript 7 gets its own pull request, because GitHub updates "any outdated dependencies that do not match a rule … in individual pull requests" ([GitHub Docs: Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)), and that pull request waits until someone merges it.
  - No `pnpm-workspace.yaml` sets `minimumReleaseAge`, so pnpm uses its built-in default of one day, which does not block an install: "The built-in 1440-minute default stays non-strict" (pnpm 12.6.0 `CHANGELOG.md`, line 859). The `minimumReleaseAgeExclude` entries therefore change nothing today, and old ones stay behind: `templates/base/pnpm-workspace.yaml` still lists `@next-friday/eslint-config-friday@5.0.0`, which no template installs, next to the 5.1.0 that every template uses, and `templates/turborepo/pnpm-workspace.yaml` repeats the pair. The seven-day wait that does apply is Dependabot's `cooldown` (`.github/dependabot.yml`).

## Proposed outcome

- Every dependency in the root and the templates is at its latest release once that release has passed the seven-day cooldown, or the reason it is held back is recorded.
- Company configs (`@next-friday/*`) are updated as soon as they are published: Dependabot's `cooldown` takes an `exclude` list that "Supports wildcards", so `@next-friday/*` is excluded from the seven-day wait ([GitHub Docs: Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)).
- Node.js and pnpm are updated on a schedule by Renovate, whose `nvm` manager "keeps the `.nvmrc` file updated" and whose `npm` manager reads the `packageManager` field (renovatebot/renovate `lib/modules/manager/nvm/readme.md`; `lib/modules/manager/npm/extract/common/package-file.ts`); Dependabot's supported ecosystems include neither. Whether Renovate also replaces Dependabot for the other dependencies is decided in the spec.
- Every major version opens its own pull request and waits for code owner review like any other change. A version held back is recorded in `.github/dependabot.yml` as an `ignore` entry with `update-types: ["version-update:semver-major"]` for that dependency, with its reason beside it (same GitHub page).

## Affected users and systems

- Every project generated from the CLI.
- This repository's `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.github/dependabot.yml`, and every template's equivalents.

## Constraints

- Dependabot's seven-day cooldown stays, as supply-chain protection. Whether pnpm also enforces a release age, and for how long, is decided in the spec.
- A generated project passes its own `pnpm verify` after each update.
