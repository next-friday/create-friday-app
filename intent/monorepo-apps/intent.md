# Intent: One monorepo per project, with apps the team names and adds

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- The company is an enterprise software house being set up. Its projects include customer web apps, LINE LIFF apps, backoffices, CMSs, corporate sites, landing pages, event sites, other marketing sites, APIs, and background services. Later projects may need other frameworks, such as Medusa, React Native, or native Android and iOS apps.
- The CLI generates one stack per repository (`--stack nodejs|nestjs|nextjs|payload|turborepo`). The only monorepo stack, `turborepo`, has two fixed apps, `apps/app` and `apps/backoffice`. A team cannot choose which apps a product has, add an app later, or name an app by what it is for.
- Documentation is Markdown spread across many files. People find it hard to read, and there is no single place that both people and AI agents read.

## Proposed outcome

- Every client project is one monorepo, so access and handover stay per client. A small project is a monorepo with one app and the docs site; no project is a single-app repository. Each app lives exactly two levels deep, at `apps/<group>/<app>`, except the docs site, which is always `apps/docs`.
- The team names the group and the app freely. The CLI checks only that each name is kebab-case, that `<group>-<app>` is a valid package name, and that the path is not taken.
- Apps are grouped by who uses them. The documentation recommends these group names, as guidance, not rules. The names are this company's own standard, chosen so every client project looks the same; they are not an industry standard. Turborepo allows grouping folders without prescribing names, and Nx, the closest published convention, groups libraries by business domain and keeps its example apps in one flat folder ([Nx folder structure](https://nx.dev/docs/kb/folder-structure)):

| Group       | Who uses it                                 | Example apps                       |
| :---------- | :------------------------------------------ | :--------------------------------- |
| `customer`  | End customers                               | web, liff, mobile-web              |
| `partner`   | Partners, merchants, and agents             | partner portal, merchant dashboard |
| `internal`  | Employees                                   | backoffice, cms                    |
| `marketing` | The public, before they become customers    | corporate, landing, event          |
| `platform`  | Other systems; these apps have no interface | api, worker, notification          |

- Shared code is grouped by business domain, at `packages/<domain>/<package>`, also exactly two levels deep, for example `packages/booking/api-client` and `packages/shared/ui`. Apps stay thin and use these packages. This follows Nx's guidance to group libraries by the application or business domain they serve, which uses the same `booking` and `shared` examples ([Nx folder structure](https://nx.dev/docs/kb/folder-structure)).
- `.github/CODEOWNERS` assigns an owner to each group and domain folder.
- Each app is created from a template that says how it is built. The folder name says what the app is for; the template name does not appear in it.
- Templates follow one generic contract, so the CLI needs no change to support a new framework:
  - A template is a folder with a manifest that names it and states what it needs, such as a database or an entry in a root file. The CLI reads the manifest and knows no framework.
  - Every app has the same scripts, `dev`, `build`, `test`, `lint`, and `typecheck`, whatever its language. Turborepo runs a workspace's script when a task of the same name is registered in `turbo.json` ("Each key in the `tasks` object is a task that can be executed by `turbo run`"), so registering these five tasks once makes root tasks and CI work for every app.
- Each template looks like the framework's current official starter, so engineers find the layout they already know. A template is generated from the official generator at its current version, such as `create-next-app`, `@nestjs/cli`, `create-payload-app`. Only the contract scripts and the company tooling are added on top. The starter's code may change where the company's ESLint, Prettier, or agent rules require it, but its layout does not: files, folders, and their names stay as the official starter has them. The template records which generator and version it came from, so it can be regenerated when that starter changes. Where the official starter is out of date, the template follows the framework's current official documentation instead. LINE's starter is current: `@line/create-liff-app` 1.1.7 runs `create-next-app --app`, then adds the `@line/liff` SDK and a LIFF provider in `app/` and `providers/`, so `nextjs-liff` is generated from it.
- The first release ships templates only for what projects use today: `nextjs`, `nextjs-liff` for LINE LIFF apps, `payload`, `nestjs`, `nodejs`, and `docs` for the Starlight docs site. A new framework's template is added when a project needs it.
- A package exists only for code that two or more apps use, such as UI components shared by the customer web app and the LIFF app, or API types shared by a web app and the API. It is created when the second app needs the code, not in advance, so a new monorepo has no packages. Lint, format, and commit configuration stay shared through their npm packages.
- The CLI adds an app to an existing monorepo at any time, so a project does not have to choose every app on day one.
- Every monorepo keeps all of its documentation in `apps/docs`, outside every group, because Markdown files in a repository are hard for people to read, and the docs are the project's highest source of truth. `AGENTS.md` and the agent rules link to them rather than repeat them.
- `apps/docs` is a [Starlight](https://starlight.astro.build/) site, the documentation theme built on the Astro framework, generated from Starlight's official starter. The pages are Markdown and MDX files in `apps/docs/src/content/docs/`. Starlight gives the site navigation and full-text search with Pagefind out of the box, and the community plugin `starlight-llms-txt` serves `llms.txt` and `llms-full.txt` for agents.
- `apps/docs` is a workspace like any other app: the project's CI builds it, and the project deploys it with its other apps, so the docs stay in the project's own infrastructure at no extra cost.
- An app carries its own configuration: Dockerfile, tests, lint, and Turborepo package configuration. Adding or removing an app does not change CI, and changes root files only where a tool allows no other place: the root `pnpm-lock.yaml`, which pnpm keeps for the whole monorepo, and `.github/CODEOWNERS` when a new group or domain needs an owner, because GitHub reads code owners only from `.github/`, the root, or `docs/`.
- CI follows Turborepo's official guidance and knows no app by name:
  - `turbo query affected` lists the changed apps, and every per-app job (end-to-end tests, container image, deploy) runs as a matrix over that list.
  - Checks run as `turbo run` tasks with `--affected`.
  - Container images build with `turbo prune <app> --docker`, so a dependency change in one app does not rebuild another.
  - An app's own files say what CI does for it: a `test:e2e` script, a `Dockerfile`, and its Turborepo package configuration.
- A generated monorepo's remote cache defaults to Railway: a self-hosted remote cache that follows Turborepo's Remote Cache API, such as `ducktors/turborepo-remote-cache`, one of the implementations Turborepo's documentation lists. It stores its artifacts in a Railway Bucket. The consumer may choose another provider, such as Vercel Remote Cache, through repository variables alone, without changing the workflow:
  - CI reaches the cache with the `TURBO_API` and `TURBO_TEAM` variables and the `TURBO_TOKEN` secret.
  - CI signs every artifact with the `TURBO_REMOTE_CACHE_SIGNATURE_KEY` secret and `"remoteCache": { "signature": true }` in the root `turbo.json`, so a tampered artifact counts as a cache miss.
  - Without these variables, CI runs without a remote cache.
- Each app is built once and the same build is promoted through every environment:
  - CI builds the app's container image, pushes it to GitHub Container Registry, and records a build provenance attestation for it, as GitHub's Docker publishing guide shows.
  - Every environment, dev, then uat, then prod, deploys that image by its digest, so prod runs exactly what uat tested, and a rollback points back to an earlier digest.
  - Railway is the default host and pulls the image from GitHub Container Registry; a private image needs Railway's Pro plan ("Private Docker registry deployments require the Pro plan"). The image also runs on any other host that runs containers.
- Because one image serves every environment, a value that differs between environments is read at runtime. A Next.js app does not put such a value in a `NEXT_PUBLIC_` variable, which Next.js inlines at build time; it reads `process.env` on the server during dynamic rendering, as Next.js's self-hosting guide describes.
- CI deploys only the changed apps, and only after its checks pass. Railway's own change detection (watch paths) and "Wait for CI" apply to services deployed from a GitHub repository, not to an image, so CI chooses and triggers each deploy.
- This repository is the npm package that ships the templates; it runs no cache service and deploys nothing. Each consumer sets up its own Railway cache service, Railway projects, tokens, and repository variables, and the generated `SETUP.md` gives the steps.

For example:

```text
apps/
  docs/                    starlight
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
intent/
```

## Affected users and systems

- Engineers who create products and add apps, and agents that run the CLI without prompts.
- Product owners, marketing, and other readers of the docs site.
- The CLI (`src/`), every template under `templates/`, this repository's CI (the Template job), and `README.md`.
- Templates for later frameworks, which the contract must allow without being built now.
- Projects already generated from the CLI are not migrated.

## Constraints

- Removing `--stack` and the single-app layouts is a breaking change and ships as a major release.
- Turborepo does not support recursive workspace globs; the workspace globs are `apps/docs`, `apps/*/*`, and `packages/*/*`. Turborepo rejects a package nested inside another, so no folder inside `apps/docs` may hold a `package.json`. This needs testing against the pnpm and Turborepo versions the templates use.
- Every choice has a command-line flag, so CI and agents run the CLI without prompts.
- A generated monorepo passes its own `pnpm verify` for any combination of apps.
- Templates use framework and platform features before custom code: Turborepo package configurations, and Starlight for the docs site.
- Setup that grows with each app, such as per-stack rule copies, is reduced first.
- Known limits for later templates, recorded so the contract does not block them: a monorepo holds one React Native version, and native Android and iOS builds under Turborepo are not yet proven.
