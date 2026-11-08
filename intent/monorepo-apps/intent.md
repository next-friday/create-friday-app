# Intent: One monorepo per project, with apps the team names and adds

Author: Joe Takara. Status: draft.

## Problem

- The company is an enterprise software house being set up. Its projects include customer web apps, LINE LIFF apps, backoffices, CMSs, corporate sites, landing pages, event sites, other marketing sites, APIs, and background services. Later projects may need other frameworks, such as Medusa, React Native, or native Android and iOS apps.
- The CLI generates one stack per repository (`--stack nodejs|nestjs|nextjs|payload|turborepo`). The only monorepo stack, `turborepo`, has two fixed apps, `apps/app` and `apps/backoffice`. A team cannot choose which apps a product has, add an app later, or name an app by what it is for.
- Documentation is Markdown spread across many files. People find it hard to read, and there is no single place that both people and AI agents read.

## Proposed outcome

- Every client project is one monorepo, so access and handover stay per client. A small project is a monorepo with one app and the docs app; no project is a single-app repository. Each app lives exactly two levels deep, at `apps/<group>/<app>`, except the docs app, which is always `apps/docs`.
- The team names the group and the app freely. The CLI checks only that each name is kebab-case, that `<group>-<app>` is a valid package name, and that the path is not taken.
- Apps are grouped by who uses them. The documentation recommends these group names, as guidance, not rules:

  | Group       | Who uses it                                 | Example apps                       |
  | :---------- | :------------------------------------------ | :--------------------------------- |
  | `customer`  | End customers                               | web, liff, mobile-web              |
  | `partner`   | Partners, merchants, and agents             | partner portal, merchant dashboard |
  | `internal`  | Employees                                   | backoffice, cms                    |
  | `marketing` | The public, before they become customers    | corporate, landing, event          |
  | `platform`  | Other systems; these apps have no interface | api, worker, notification          |

- Shared code is grouped by business domain, at `packages/<domain>/<package>`, also exactly two levels deep, for example `packages/booking/api-client` and `packages/shared/ui`. Apps stay thin and use these packages. This follows Backstage's system model, where one monorepo is a system, an app is a component, and a package folder is a domain.
- `.github/CODEOWNERS` assigns an owner to each group and domain folder.
- Each app is created from a template that says how it is built. The folder name says what the app is for; the template name does not appear in it.
- Templates follow one generic contract, so the CLI needs no change to support a new framework:
  - A template is a folder with a manifest that names it and states what it needs, such as a database or an entry in a root file. The CLI reads the manifest and knows no framework.
  - Every app has the same scripts, `dev`, `build`, `test`, `lint`, and `typecheck`, whatever its language. Turborepo runs any script a workspace's `package.json` defines, so root tasks and CI work for every app.
- The first release ships templates only for what projects use today: `nextjs`, `nextjs-liff` for LINE LIFF apps, `payload`, `nestjs`, `nodejs`, and `docs`. A new framework's template is added when a project needs it.
- Campaign and event pages live in one marketing landing app by default. An event gets its own app only when it needs its own domain and also its own team, release, or technology; that app is deleted when the event ends. This is guidance in `docs/`, not a CLI check.
- Shared packages are created when a second app needs the code, not in advance; a new monorepo has none. Lint, format, and commit configuration stay shared through their npm packages.
- The CLI adds an app to an existing monorepo at any time, so a project does not have to choose every app on day one.
- Every monorepo has a docs app at `apps/docs`, outside every group, because `docs/` is the project's highest source of truth: it renders `docs/` for people and serves `llms.txt` for agents, and `AGENTS.md` and the agent rules link to it rather than repeat it. No group may be named `docs`.
- An app carries its own configuration: Dockerfile, tests, lint, and Turborepo package configuration. Adding or removing an app does not change root files or CI, except where a tool allows no other place.

For example:

```text
apps/
  docs/                    docs
  customer/web/            nextjs
  customer/liff/           nextjs-liff
  internal/backoffice/     nextjs
  internal/cms/            payload
  marketing/corporate/     nextjs
  marketing/landing/       nextjs
  partner/merchant/        nextjs
  platform/api/            nestjs
  platform/notification/   nodejs
packages/
  booking/api-client/
  shared/ui/
docs/
intent/
```

## Affected users and systems

- Engineers who create products and add apps, and agents that run the CLI without prompts.
- Product owners, marketing, and other readers of the docs app.
- The CLI (`src/`), every template under `templates/`, this repository's CI (the Template job), and `README.md`.
- Templates for later frameworks, which the contract must allow without being built now.
- Projects already generated from the CLI are not migrated.

## Constraints

- Removing `--stack` and the single-app layouts is a breaking change and ships as a major release.
- Turborepo does not support recursive workspace globs; the workspace globs are `apps/docs`, `apps/*/*`, and `packages/*/*`. Turborepo rejects a package nested inside another, so no folder inside `apps/docs` may hold a `package.json`. This needs testing against the pnpm and Turborepo versions the templates use.
- Every choice has a command-line flag, so CI and agents run the CLI without prompts.
- A generated monorepo passes its own `pnpm verify` for any combination of apps.
- Templates use framework features before custom code: Turborepo package configurations, and Fumadocs for the docs app.
- The excess found by the playbook audit that grows with each app, such as per-stack rule copies and the Cursor render step, is removed first.
- Known limits for later templates, recorded so the contract does not block them: a monorepo holds one React Native version, and native Android and iOS builds under Turborepo are not yet proven.
