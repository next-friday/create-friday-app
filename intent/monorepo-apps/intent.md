# Intent: One monorepo per product, with apps the team names and adds

Author: Joe Takara. Status: draft.

## Problem

- The company is being set up and will build many web products: customer web apps, LINE LIFF apps, backoffices, CMSs, a corporate site, landing pages, event sites, other marketing sites, APIs, and background services.
- The CLI generates one stack per repository (`--stack nodejs|nestjs|nextjs|payload|turborepo`). The only monorepo stack, `turborepo`, has two fixed apps, `apps/app` and `apps/backoffice`. A team cannot choose which apps a product has, add an app later, or name an app by what it is for.
- Documentation is Markdown spread across many files. People find it hard to read, and there is no single place that both people and AI agents read.

## Proposed outcome

- Every product is one monorepo. Each app lives exactly two levels deep, at `apps/<group>/<app>`.
- The team names the group and the app freely. The CLI checks only that each name is kebab-case, that `<group>-<app>` is a valid package name, and that the path is not taken. Example names in the documentation are guidance, not rules.
- Each app is created from a template that says how it is built: `nextjs`, `payload`, `nestjs`, `nodejs`, or `docs`. The folder name says what the app is for; the template name does not appear in it.
- The CLI adds an app to an existing monorepo at any time, so a product does not have to choose every app on day one.
- Every monorepo has a docs app. It renders `docs/` for people and serves `llms.txt` for agents; `docs/` stays the single source.
- An app carries its own configuration: Dockerfile, tests, lint, and Turborepo package configuration. Adding or removing an app does not change root files or CI, except where a tool allows no other place.

For example:

```text
apps/
  customer/web/            nextjs
  customer/liff/           nextjs
  internal/backoffice/     nextjs
  internal/cms/            payload
  internal/docs/           docs
  marketing/corporate/     nextjs
  marketing/landing/       nextjs
  platform/api/            nestjs
  platform/notification/   nodejs
packages/
docs/
intent/
```

## Affected users and systems

- Engineers who create products and add apps, and agents that run the CLI without prompts.
- Product owners, marketing, and other readers of the docs app.
- The CLI (`src/`), every template under `templates/`, this repository's CI (the Template job), and `README.md`.
- Projects already generated from the CLI are not migrated.

## Constraints

- Removing `--stack` and the single-app layouts is a breaking change and ships as a major release.
- Turborepo does not support recursive workspace globs; the workspace glob is `apps/*/*`. This needs testing against the pnpm and Turborepo versions the templates use.
- Every choice has a command-line flag, so CI and agents run the CLI without prompts.
- A generated monorepo passes its own `pnpm verify` for any combination of apps.
- Templates use framework features before custom code: Turborepo package configurations, and Fumadocs for the docs app.
- The excess found by the playbook audit that grows with each app, such as per-stack rule copies and the Cursor render step, is removed first.

## Open questions

1. Does one monorepo hold one product, one client, or the whole company?
2. Landing pages and events: is one app with many campaign pages the default, with a separate app only for an event that needs its own domain, team, or release? This would be guidance in `docs/`, not a CLI check.
3. LINE LIFF: a separate `nextjs-liff` template, or the `nextjs` template plus the LIFF SDK?
4. Names are free, so where does the docs app go by default? `internal/docs` is a suggestion.
5. Do single-app repositories remain for small client work, or does every project become a monorepo?
6. Which shared packages under `packages/` ship from day one, such as UI components or configuration, if any?
