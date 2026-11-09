# Intent: Keep dependencies current

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- Dependencies in this repository and in the templates fall behind their latest releases, so every generated project starts out of date.
- On 2026-11-08 the root and the templates were behind on:
  - the company configs, which `friday-code-standards` now releases together at one version (5.2.1 on 2026-11-08): `@next-friday/commitlint-config-friday` 4.0.0, `@next-friday/eslint-config-friday` 5.0.0 and 5.1.0, and `@next-friday/prettier-config-friday` 4.0.0, all instead of 5.2.1;
  - TypeScript at the root: 6.0.3 instead of 7.0.2, released 123 days earlier;
  - pnpm: 12.6.0 instead of 12.17.0 or later;
  - Node.js in `.nvmrc`: 24.22.1 instead of 24.22.2. Node.js 26 has been an LTS line since 26.13.0 on 2026-10-28 (nodejs.org `dist/index.json`), but every template's `engines` allows only Node.js 24 (`">=24.15.0 <25"` or `">=24.22.1 <25"` in `templates/<stack>/package.json`), and no reason for holding it back is recorded.
- Dependabot does not cover several of these:
  - It does not update `.nvmrc` or the `packageManager` field: its supported ecosystems list neither ([GitHub Docs: Supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)).
  - It raises no security alerts for these projects: "When pnpm writes `pnpm-lock.yaml` as two YAML documents, the dependency graph does not detect the dependencies in that file. This is the default format for pnpm 12 projects that pin a pnpm version" (same page). `intent/ci/intent.md` makes OSV-Scanner the templates' dependency vulnerability check.
  - The root groups take only minor and patch updates. A major such as TypeScript 7 gets its own pull request, because GitHub updates "any outdated dependencies that do not match a rule … in individual pull requests" ([GitHub Docs: Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)), and that pull request waits until someone merges it.
  - No `pnpm-workspace.yaml` sets `minimumReleaseAge`, so pnpm uses its built-in default of one day, which does not block an install: "The built-in 1440-minute default stays non-strict" (pnpm 12.6.0 `CHANGELOG.md`, line 859). The `minimumReleaseAgeExclude` entries therefore change nothing today, and old ones stay behind: `templates/base/pnpm-workspace.yaml` still lists `@next-friday/eslint-config-friday@5.0.0`, which no template installs, next to the 5.1.0 that every template uses, and `templates/turborepo/pnpm-workspace.yaml` repeats the pair. The seven-day wait that does apply is Dependabot's `cooldown` (`.github/dependabot.yml`).

## Proposed outcome

- Every dependency in the root and the templates is at its latest release once that release has passed the seven-day cooldown, or the reason it is held back is recorded.
- Company configs (`@next-friday/*`) skip the seven-day wait and are updated at the next scheduled Dependabot run, weekly on Monday today (`.github/dependabot.yml`): Dependabot's `cooldown` takes an `exclude` list that "Supports wildcards", so `@next-friday/*` is excluded from the wait ([GitHub Docs: Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)). If pnpm enforces a release age, `minimumReleaseAgeExclude` lists the name pattern `'@next-friday/*'`, which pnpm accepts ("the same `name`, `@scope/*`, and `name@version` patterns as `minimumReleaseAgeExclude`", pnpm 12.17.0 `CHANGELOG.md`), instead of one entry per version, and `minimumReleaseAgeExcludePrune` drops version entries the lockfile no longer resolves while it keeps name patterns (pnpm 12.6.0 `CHANGELOG.md`, line 1649).
- Node.js and pnpm are updated on a schedule by Renovate, whose `nvm` manager "keeps the `.nvmrc` file updated" and whose `npm` manager reads the `packageManager` field (renovatebot/renovate `lib/modules/manager/nvm/readme.md`; `lib/modules/manager/npm/extract/common/package-file.ts`); Dependabot's supported ecosystems include neither. Renovate updates only these two, so it never opens the same pull request as Dependabot: by default its `npm` manager updates every dependency in `package.json`, so the configuration allows only the `nvm` and `npm` managers (`enabledManagers` is "a way to allow only certain package managers and implicitly disable all others") and turns off every `npm` dependency except the `packageManager` type with two package rules, the second overriding the first, because "later rules may override configuration options from earlier ones" (renovatebot/renovate `docs/usage/configuration-options.md`). Renovate's `minimumReleaseAge` defaults to none (renovatebot/renovate `lib/config/options/index.ts`), so the Renovate configuration sets the same seven-day wait as Dependabot's `cooldown`. Whether Renovate also replaces Dependabot for the other dependencies is decided in the spec.
- Every major version opens its own pull request and waits for code owner review like any other change. A version held back is recorded in the configuration of the tool that updates it: for a dependency Dependabot updates, an `ignore` entry with `update-types: ["version-update:semver-major"]` in `.github/dependabot.yml` (same GitHub page); for Node.js and pnpm, which Renovate updates, a package rule with `"matchUpdateTypes": ["major"]` and `"enabled": false` (renovatebot/renovate `docs/usage/configuration-options.md`). Node.js 26 is the first major to decide: the templates move to it, or a Renovate package rule records why they stay on Node.js 24.

## Affected users and systems

- Every project generated from the CLI.
- This repository's `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.github/dependabot.yml`, and every template's equivalents.

## Constraints

- Dependabot's seven-day cooldown stays, as supply-chain protection. Whether pnpm also enforces a release age, and for how long, is decided in the spec.
- A generated project passes its own `pnpm verify` after each update.
