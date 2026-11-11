# Spec: Keep dependencies current

From `intent/dependency-freshness/intent.md`. Status: accepted.

Written at `main` `dfac1fc` with the `write-spec` skill as committed there, as the next step of the loop. The product owner's request added no constraint to the skill's prompt.

## Requirements

1. Every dependency in the root and in every template is at its latest release once that release is seven days old, or the configuration of the tool that updates it records why it is held back.
2. Company configs (`@next-friday/*`) skip the seven-day wait and are updated at the next scheduled Dependabot run.
3. Dependabot keeps updating npm dependencies, GitHub Actions, Docker images, and pip requirements, with its seven-day `cooldown`.
4. Renovate updates Node.js in `.nvmrc` and pnpm in the `packageManager` field, and nothing else, with the same seven-day wait.
5. Every major version opens its own pull request. No configuration ignores every major. A held-back major is recorded for that one dependency, in the configuration of the tool that updates it, and the record is removed when the hold ends.
6. pnpm enforces the same seven-day release age at install time (proposed; see **Open questions**), with `'@next-friday/*'` excluded by name pattern instead of one entry per version.
7. A generated project passes its own `pnpm verify` after each update.

## Design

### Versions that change now

The latest releases on 2026-11-09, from `npm view <package> time` and nodejs.org `dist/index.json`:

| Dependency                                                                                                          | Where                                              | Today                                                                                        | After                                | Released                    |
| :------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------- | :-------------------------- |
| `@next-friday/commitlint-config-friday`, `@next-friday/eslint-config-friday`, `@next-friday/prettier-config-friday` | `package.json`, `templates/<stack>/package.json`   | 4.0.0, 5.1.0, 4.0.0                                                                          | 5.2.1 each                           | 2026-11-08                  |
| `typescript`                                                                                                        | `package.json`                                     | 6.0.3                                                                                        | 7.0.2 (the templates already pin it) | 2026-07-08                  |
| pnpm (`packageManager`)                                                                                             | `package.json`, `templates/<stack>/package.json`   | 12.6.0                                                                                       | 12.17.0                              | 2026-10-30                  |
| Node.js                                                                                                             | `.nvmrc`, `templates/base/.nvmrc`                  | 24.22.1                                                                                      | 26.13.0                              | 2026-10-28, first LTS of 26 |
| Node.js range                                                                                                       | `engines.node` in `templates/<stack>/package.json` | `">=24.15.0 <25"` (`nestjs`, `nextjs`, `nodejs`); `">=24.22.1 <25"` (`payload`, `turborepo`) | `">=26.13.0 <27"`                    |                             |

- pnpm 12.18.0 (2026-11-05) is four days old on 2026-11-09, so it waits for Renovate's next run after 2026-11-12.
- Node.js 24 entered maintenance on 2026-10-20, and 26 became LTS on 2026-10-28 (`nodejs/Release` `schedule.json`). The packages the templates install accept Node.js 26: `payload` `"^22.23.4||>=24.22.1"`, `vitest` `"^22.12.0||^24.0.0||>=26.0.0"`, `eslint` `"^20.19.0||^22.13.0||>=24"`, `next` `">=20.9.0"`, `@nestjs/core` `">=20"`, and each `@next-friday/*` config at 5.2.1 `">=24.15.0"` (`npm view <package> engines`). So the templates move to Node.js 26 and no hold is recorded.
- The root's `engines.node` stays `">=24.15.0"`: it is the CLI's public contract (`AGENTS.md`, the **Preserve CLI arguments, prompts, and stack names** convention), and it already allows Node.js 26. Only the root's development and release version in `.nvmrc` moves.
- The plan updates every other dependency that `pnpm outdated` reports in the root and in a project generated from each stack, under requirement 1. On 2026-11-09 that includes `next` 16.4.3 in `templates/nextjs/package.json`, line 43, and `templates/turborepo/apps/app/package.json`, line 21, whose 16.4.4 turns seven days old that day.

### Dependabot

`.github/dependabot.yml`, `templates/base/.github/dependabot.yml`, and `templates/turborepo/.github/dependabot.yml`, which replaces the base file (`AGENTS.md`, the **A stack replaces a `base` file** convention):

- Every `cooldown` block gains `exclude: ["@next-friday/*"]`. GitHub documents `exclude` as the "List of dependencies **excluded from cooldown** (up to **150 items**). Supports wildcards (`*`)", and "The `exclude` list always take precedence over the `include` list" (`github/docs` `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`, lines 226 and 292).
- `default-days: 7` stays, as the intent's constraint requires.
- The `ignore` entry for `dependency-name: "*"` with `version-update:semver-major` is removed from both template files (`templates/base/.github/dependabot.yml`, lines 18–21; `templates/turborepo/.github/dependabot.yml`, lines 18–21). It holds back every major, which requirement 5 forbids. Majors then open "in individual pull requests" ("Any outdated dependencies that do not match a rule are updated in individual pull requests", same file, line 326).
- The Docker `ignore` for `node` majors stays, as the record of a hold for that one dependency: Node.js majors move with `.nvmrc`, which Renovate proposes, and the image changes by hand in that pull request, as each template's `CONTRIBUTING.md` already says ("Change the Node.js version in `.nvmrc` and the `Dockerfile` together", `templates/<stack>/CONTRIBUTING.md`, line 8). Each Dockerfile's image moves to Node.js 26 in this change.
- The root's template entry lists `directories: ["/templates/*"]` instead of naming each stack. GitHub says "The `directories` key supports globbing and the wildcard character `*`" (same file, line 308). The list then follows `intent/monorepo-apps/spec.md`, which removes `templates/turborepo/` and adds `templates/starlight/`, without an edit. Dependabot already reaches a template's workspace packages from the template's root: pull request #61 (`28cd9af`) changed `templates/turborepo/apps/app/package.json`.

### Renovate

A new `.github/renovate.json` in the root and in `templates/base/`, one of the file names Renovate reads (`.github/renovate.json{,c,5}`, `renovatebot/renovate` `lib/config/app-strings.ts`):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "enabledManagers": ["nvm", "npm"],
  "minimumReleaseAge": "7 days",
  "schedule": ["* 9-11 * * 1"],
  "timezone": "Asia/Bangkok",
  "packageRules": [
    {"matchManagers": ["npm"], "enabled": false},
    {"matchManagers": ["npm"], "matchDepTypes": ["packageManager"], "enabled": true}
  ]
}
```

- `enabledManagers` "is a way to allow only certain package managers and implicitly disable all others" (`renovatebot/renovate` `docs/usage/configuration-options.md`, line 1735).
- The `nvm` manager "Simply keeps the `.nvmrc` file updated" (`lib/modules/manager/nvm/readme.md`). The `npm` manager reads `packageManager` as its own dependency type, `packageManager: 'packageManager'` (`lib/modules/manager/npm/extract/common/package-file.ts`, line 70).
- The second package rule turns the `packageManager` type back on, because "later rules may override configuration options from earlier ones, if they both specify the same option" (`configuration-options.md`, line 3202). Every other npm dependency stays with Dependabot, so the two tools never open the same pull request.
- `minimumReleaseAge` defaults to `null` (`lib/config/options/index.ts`, line 2439), so it is set to the same seven days as Dependabot's `cooldown`. Renovate "adds a "pending" status check" until the age passes (`configuration-options.md`, line 3000).
- The schedule matches Dependabot's Monday morning in Bangkok (`.github/dependabot.yml`). Renovate "supports the standard Cron syntax", and "Setting a `schedule` does not itself cause or trigger Renovate to run" (`configuration-options.md`, lines 4988 and 4980), so the schedule limits when the hosted app opens branches.
- A held-back Node.js or pnpm major is a third package rule with `matchPackageNames` for that one dependency and `allowedVersions` below the rejected major, which Renovate documents "to limit how far to upgrade a dependency" (`configuration-options.md`, line 3302), plus a `description` that gives the reason. The rule is removed when the hold ends.
- Renovate runs as the Mend Renovate App, installed on the organization or repository ("you can install the app into a user or organization account and select either "All repositories", or "Select repositories"", `docs/usage/getting-started/installing-onboarding.md`, line 22). `templates/base/SETUP.md` gains that step for consumers, next to its Dependabot settings (line 57).

Renovate does not replace Dependabot for the other dependencies (see **Open questions**).

### pnpm release age (proposed)

The root `pnpm-workspace.yaml`, `templates/base/pnpm-workspace.yaml`, and `templates/turborepo/pnpm-workspace.yaml` set:

```yaml
minimumReleaseAge: 10080
minimumReleaseAgeExclude:
  - "@next-friday/*"
minimumReleaseAgeExcludePrune: true
```

- 10080 minutes is seven days; the setting counts minutes ("The built-in 1440-minute default", pnpm 12.18.0 `CHANGELOG.md`, line 2925).
- An explicit value turns strict mode on: "`minimumReleaseAgeStrict` now defaults to `true` when `minimumReleaseAge` is explicitly configured … The built-in 1440-minute default stays non-strict" (same line). A version younger than seven days then stops the install instead of being added to the exclude list.
- The reason to enforce it: a template ships no `pnpm-lock.yaml` (`AGENTS.md`, the **Store `.gitignore` as `_gitignore`** convention), so a generated project resolves every transitive dependency fresh on its first `pnpm install`. Dependabot's `cooldown` delays only the pull requests it opens; pnpm's release age is the only wait that applies to those transitive versions.
- The name pattern replaces every `@next-friday/...@<version>` entry, including the stale `@next-friday/eslint-config-friday@5.0.0` (`templates/base/pnpm-workspace.yaml`, line 16; `templates/turborepo/pnpm-workspace.yaml`, line 19; root `pnpm-workspace.yaml`, line 10). `@next-friday/eslint-plugin-friday@1.1.3` is covered by the pattern too.
- `minimumReleaseAgeExcludePrune` drops entries "the freshly written lockfile no longer resolves", and "Name patterns (`@scope/*`) are always kept" (pnpm 12.18.0 `CHANGELOG.md`, line 3715). A one-off `name@version` entry, such as a security fix younger than seven days that `dependency-security.md` asks to apply as an override, is then removed once the lockfile moves past it.

### Root CI

- The Compatibility job (`.github/workflows/ci.yml`, lines 299–308) tests Node.js 24.15.0 and 24.21.0. It gains Node.js 26.13.0 on `ubuntu-latest`, because the root's `engines.node` allows 26 and the CLI's users may run it. Renovate does not update these entries; see **Areas of concern**.

### Documentation

- `templates/<stack>/CONTRIBUTING.md`, line 8: "Dependabot updates only the `Dockerfile`" becomes "Renovate updates `.nvmrc`; Dependabot updates the `Dockerfile`'s digest."

### Files that change

| File                                                                                  | Change                                                                                   |
| :------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| `package.json`                                                                        | Company configs 5.2.1, `typescript` 7.0.2, `packageManager` pnpm 12.17.0, other outdated |
| `pnpm-lock.yaml`                                                                      | Regenerated by `pnpm install`                                                            |
| `pnpm-workspace.yaml`                                                                 | The pnpm release age settings                                                            |
| `.nvmrc`, `templates/base/.nvmrc`                                                     | 26.13.0                                                                                  |
| `.github/dependabot.yml`                                                              | `cooldown.exclude`; template `directories` glob                                          |
| `.github/renovate.json`, `templates/base/.github/renovate.json`                       | New, as in **Renovate**                                                                  |
| `.github/workflows/ci.yml`                                                            | Node.js 26.13.0 in Compatibility                                                         |
| `templates/base/.github/dependabot.yml`, `templates/turborepo/.github/dependabot.yml` | `cooldown.exclude`; the all-majors `ignore` removed                                      |
| `templates/base/pnpm-workspace.yaml`, `templates/turborepo/pnpm-workspace.yaml`       | The pnpm release age settings                                                            |
| `templates/<stack>/package.json`, `templates/turborepo/apps/*/package.json`           | Company configs 5.2.1, `packageManager`, `engines.node`, other outdated                  |
| `templates/<stack>/Dockerfile`, `templates/turborepo/apps/*/Dockerfile`               | A Node.js 26 image                                                                       |
| `templates/<stack>/CONTRIBUTING.md`, `templates/base/SETUP.md`, `AGENTS.md`           | As in **Documentation** and **Renovate**                                                 |
| `.changeset/`                                                                         | A minor changeset: generated projects get new dependency versions and Node.js 26         |

The CLI's arguments, prompts, and layout do not change. Node.js 26 in a generated project is not a break of this package's contract, whose `engines.node` stays.

### Order of work

1. The company configs at 5.2.1 in the root, then `pnpm lint` and `pnpm format`, because the ESLint and Prettier configs are new majors.
2. `typescript` 7.0.2 in the root and `pnpm verify`.
3. pnpm 12.17.0, Node.js 26.13.0, and the pnpm release age settings in the root.
4. The same in each template, then a generated project per stack with `pnpm verify`, as `AGENTS.md` describes.
5. Dependabot and Renovate configuration, the Compatibility job, the documentation, and the changeset.

## Proof

- `pnpm verify` passes in the root, and in a project generated from each stack (`AGENTS.md`, "Check a template"), on Node.js 26.13.0 and pnpm 12.17.0.
- `pnpm outdated` in the root and in each generated project lists nothing but versions younger than seven days or held back by a recorded rule. pnpm "Fixed `pnpm outdated` … offering versions blocked by `minimumReleaseAge`" (pnpm 12.18.0 `CHANGELOG.md`, line 3415), so its output already applies the wait.
- `pnpm install` in a generated project, with a dependency pinned to a version under seven days old that is not `@next-friday/*`, fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` or `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`; with an `@next-friday/*` package released the same day, it succeeds.
- The Template and Compatibility jobs pass in CI. They run only in CI (`AGENTS.md`, "CI-only jobs").
- After the merge: Renovate's first run opens no pull request for anything but `.nvmrc` and `packageManager`; the next `@next-friday/*` release gets a Dependabot pull request at the first Monday run after it, without the seven-day wait; and pnpm 12.18.0 gets a Renovate pull request at the first run after 2026-11-12.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review the seven-day wait as the supply-chain control, the exclusion of `@next-friday/*` from it, which trusts that scope's publishers without a wait, and the Mend Renovate App's access to the repositories.
- **Mend Renovate App, unverified:** this session did not confirm the app's price or its permissions for private repositories, because only the Renovate repository's documentation was read. Installing it needs an organization owner, in this repository and in each consumer.
- **Dependabot and strict pnpm release age, unverified:** whether Dependabot's pnpm updater honours `minimumReleaseAge` when it rewrites `pnpm-lock.yaml` is not documented on the pages read. If it writes a transitive version younger than seven days, CI's `pnpm install` fails on that pull request. The first Dependabot run after the merge shows it; if it fails, the fix is the decision in **Open questions**, not a hand edit of each pull request.
- **TypeScript 7 and typescript-eslint:** `typescript-eslint`'s latest release declares `"typescript":">=4.8.4<6.1.0"` (`npm view typescript-eslint peerDependencies`). `@next-friday/eslint-config-friday` 5.2.1 depends on `typescript` 6.0.3 (`npm view @next-friday/eslint-config-friday@5.2.1 dependencies`), so type-aware lint runs on 6.0.3 while `tsc` runs on 7.0.2, as in the templates today. The root's `pnpm verify` proves the combination.
- **Node.js majors need a hand edit:** Renovate's `nvm` pull request for the next major changes `.nvmrc` only. `engines.node` (`"<27"`), with `engineStrict: true` in each `pnpm-workspace.yaml`, and the Dockerfiles must change in the same pull request, or its CI fails. This is intended: a major waits for code owner review (requirement 5).
- **Dockerfile versions are not readable:** each Dockerfile pins `node@sha256:<digest>` with no tag (for example `templates/nextjs/Dockerfile`, line 3), so the Node.js version of the image cannot be read from the file, and how Dependabot proposes updates for a digest without a tag is unverified. `intent/monorepo-apps/spec.md` regenerates the Dockerfiles; that plan should pin a tag and a digest.
- **Compatibility versions are manual:** neither Renovate nor Dependabot updates the Node.js versions in `.github/workflows/ci.yml`, lines 302–308, so they fall behind unless someone changes them. Enabling Renovate's GitHub Actions manager for them would overlap Dependabot's `github-actions` ecosystem, so this spec leaves them manual.
- **Generator versions in `intent/monorepo-apps/spec.md`:** that spec takes "the current ones on npm on 2026-11-09". `create-next-app` 16.4.5 was published on 2026-11-03 (`npm view next time`), so it is under seven days old on that date. Its plan should pin each generator at the newest version that is seven days old, so a regenerated template passes requirement 1 and a strict install. Dependabot updates a template's dependencies after it is generated; `template-source.json` records the generator version and changes only when the template is regenerated.
- **Overlapping changes:** `intent/monorepo-apps/spec.md` removes `templates/turborepo/` and moves the per-stack files into `templates/base/`. Whichever plan lands second applies the other's change to the files it moves. The `directories: ["/templates/*"]` glob needs no edit either way. `intent/playbook-plays/spec.md` reads the npm that the Node.js in `.nvmrc` bundles, and names Node.js 24.22.1 with npm 11.19.1. Node.js 26.13.0 bundles npm 11.20.0 (nodejs.org `dist/index.json`), which is also below the 11.21.0 that its rollback job needs, so that job still installs npm first.

## Open questions

- **Does Renovate replace Dependabot for the other dependencies?** Proposed: no. Dependabot already runs with the seven-day `cooldown` that the intent keeps, `cooldown.exclude` meets requirement 2, and Renovate is limited to the two files Dependabot cannot read. The product owner may choose Renovate for everything instead, which would replace `.github/dependabot.yml` and the template copies with one Renovate configuration.
- **Does pnpm enforce a release age, and for how long?** Proposed: yes, seven days, strict, for the reason in **pnpm release age**. If the Dependabot concern above proves real, the alternative is to drop `minimumReleaseAge` and keep only Dependabot's `cooldown`, which leaves a generated project's first install without a wait.
- **Do the templates move to Node.js 26?** Answered: yes, to 26.13.0, as in **Versions that change now**. No hold is recorded.
