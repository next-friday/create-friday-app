# Intent: Keep dependencies current

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- Dependencies in this repository and in the templates fall behind their latest releases, so every generated project starts out of date.
- On 2026-11-08 the root and the templates were behind on:
  - the company configs, which `friday-code-standards` now releases together at one version (5.2.1 on 2026-11-08): `@next-friday/commitlint-config-friday` 4.0.0, `@next-friday/eslint-config-friday` 5.0.0 and 5.1.0, and `@next-friday/prettier-config-friday` 4.0.0, all instead of 5.2.1;
  - TypeScript at the root: 6.0.3 instead of 7.0.2, released 122 days earlier;
  - pnpm: 12.6.0 instead of 12.17.0 or later;
  - Node.js in `.nvmrc`: 24.22.1 instead of 24.22.2.
- Dependabot does not cover several of these:
  - It does not update `.nvmrc` or the `packageManager` field.
  - The root groups take only minor and patch updates, so a major such as TypeScript 7 waits.
  - A new company config version needs a manual entry in `minimumReleaseAgeExclude` before pnpm installs it. Old entries stay behind: `templates/base/pnpm-workspace.yaml` still lists `@next-friday/eslint-config-friday@5.0.0`, which no template installs, next to the 5.1.0 that every template uses.

## Proposed outcome

- Every dependency in the root and the templates is at its latest release once that release has passed the seven-day cooldown, or the reason it is held back is recorded.
- Company configs (`@next-friday/*`) are updated as soon as they are published, without the cooldown.
- Node.js, pnpm, and major versions are updated on a schedule, not only when someone notices.

## Affected users and systems

- Every project generated from the CLI.
- This repository's `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.github/dependabot.yml`, and every template's equivalents.

## Constraints

- The seven-day cooldown and `minimumReleaseAge` stay, as supply-chain protection.
- A generated project passes its own `pnpm verify` after each update.

## Open questions

1. What updates Node.js and pnpm on a schedule, since Dependabot does not?
2. Who updates a company config when it is published, and how does the update reach `minimumReleaseAgeExclude`?
3. Which major updates wait for review, and where is the reason recorded?
