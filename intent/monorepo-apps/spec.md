# Spec: One monorepo per project, with apps the team names and adds

From `intent/monorepo-apps/intent.md` (accepted 2026-11-09 by the merge of pull request #57). Status: accepted.

Written at `main` `d856a39` with the `write-spec` skill as committed there. The product owner's prompt, "กลับมาทำงาน เดิม intent ให้จบ" ("back to the intent work, finish it"), added no constraint to the skill's prompt.

## Requirements

1. Every generated project is one pnpm and Turborepo monorepo with the docs site at `apps/docs` and at least one app at `apps/<group>/<app>`. No project is a single-app repository.
2. The workspace globs are `apps/docs`, `apps/*/*`, and `packages/*/*`.
3. The CLI accepts any group and app name that is kebab-case, whose package name `<group>-<app>` is a valid package name that no other workspace package has, whose path is not taken, and whose group is not `docs`.
4. The CLI creates a monorepo with the apps it is given, and adds an app to an existing monorepo at any time.
5. Every choice has a command-line flag, so CI and agents run the CLI without prompts.
6. The first release ships the templates `nextjs`, `nextjs-liff`, `payload`, `nestjs`, and `nodejs` for apps, and `starlight` for the docs site.
7. Each template is generated from the framework's official generator at its current version and keeps that starter's files, folders, and names. The company tooling is added on top, and the starter's code changes only where the company's ESLint, Prettier, or agent rules require it, or where the starter is out of date against the framework's current documentation. The template records which generator and version it came from.
8. A new monorepo has no packages. Shared code goes in `packages/<domain>/<package>` when a second app needs it.
9. An app carries its own configuration: Dockerfile, tests, lint, and Turborepo package configuration. Adding an app changes no CI file and changes only these root files: `pnpm-lock.yaml`, `.github/CODEOWNERS` for a new group, and `pnpm-workspace.yaml` when the app's template needs workspace-wide pnpm settings.
10. `.github/CODEOWNERS` assigns an owner to each group and domain folder.
11. Documentation for people lives in `apps/docs`, a Starlight site that the project builds and deploys like any other app. Markdown that an agent or a tool reads stays where it reads it.
12. The remote cache defaults to a self-hosted cache on Railway that stores artifacts in a Railway Bucket. Repository variables alone choose another provider or none, and every artifact is signed.
13. Each changed app is built once into a container image in GitHub Container Registry, and every environment, `dev`, then `uat`, then `prod`, deploys that image by digest. CI deploys only the changed apps, and only after its checks pass.
14. A value that differs between environments is read at runtime, never inlined at build time.
15. This repository runs no cache and deploys no app. Each consumer sets up its own Railway services, tokens, and variables from the steps in its `SETUP.md`.
16. A generated monorepo passes its own `pnpm verify` for any combination of apps.
17. The change ships as a major release, and projects already generated are not migrated.

## Design

### Command line

```text
pnpm create @next-friday/app <name> --app <group>/<app>=<template> [--app ...] [--owner <group>=<owner>] [--skip-git] [--skip-install]
pnpm create @next-friday/app --add --app <group>/<app>=<template> [--app ...] [--owner <group>=<owner>] [--skip-install]
```

| Option                           | Description                                                                                                                                       |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                           | Project directory and root package name, or `.` for the current directory. The rules in `src/project-name.ts` stay.                               |
| `--app <group>/<app>=<template>` | One app. Repeat it for more apps. `<template>` is `nextjs`, `nextjs-liff`, `payload`, `nestjs`, or `nodejs`.                                      |
| `--add`                          | Add the apps to the monorepo in the current directory instead of creating one.                                                                    |
| `--owner <group>=<owner>`        | Owner of a group that is new in this run, written to `.github/CODEOWNERS`, for example `customer=@acme/customer-team`. Repeat it for more groups. |
| `--skip-git`, `--skip-install`   | As today. `--add` never runs `git init`.                                                                                                          |
| `-v, --version`, `-h, --help`    | As today.                                                                                                                                         |

- `--stack` is removed. `parseArgs` rejects it as an unknown option.
- In a terminal, the CLI asks for whatever the flags leave out: the name, then each app's template, group, and name, then the owner of each new group, then whether to add another app. The group prompt offers the five recommended groups and a free name. Outside a terminal, a missing `--app`, a missing name when creating, or a missing `--owner` for a new group stops the run with the usage before anything is written, as `resolveProject` in `src/create.ts` does today. `--add` takes no name.
- Every group new to the run needs an owner, so `.github/CODEOWNERS` assigns one to each group (requirement 10). A group that already has a `CODEOWNERS` line needs none.
- `--add` runs only at the root of a monorepo the CLI generated: its `pnpm-workspace.yaml` lists exactly the three globs and `apps/docs/package.json` exists. Anywhere else it stops with that reason.

### Name checks

The CLI rejects an app before it writes anything, with the reason, when:

| Check                                                                                       | Why                                                                                                                                                                                                                                                                                                                                         |
| :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The group or the app is not kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`).                        | The intent.                                                                                                                                                                                                                                                                                                                                 |
| `<group>-<app>` is not a valid npm package name.                                            | The intent. The check reuses `src/project-name.ts`, which already validates package names.                                                                                                                                                                                                                                                  |
| `<group>-<app>` equals the name of another app in the run or of a package in the workspace. | Turborepo stops on two packages with one name. Run on 2026-11-09 with `turbo` 2.11.10 and pnpm 12.6.0: "Failed to add workspace "customer-web" from "apps/customer-online/web/package.json", it already exists at "apps/customer/web/package.json". Rename one package or module so every Turborepo package identity is unique."            |
| `apps/<group>/<app>` exists.                                                                | The intent.                                                                                                                                                                                                                                                                                                                                 |
| The group is `docs`.                                                                        | `apps/docs/<app>` would nest a package inside the docs site. Turborepo's documentation says "Turborepo does not support nested packages" (`crafting-your-repository/structuring-a-repository.mdx`, bundled with `turbo` 2.11.10). See **Areas of concern**: the same run did not stop on a nested package, so this check is the only guard. |

The docs site's package is named `docs`. An app's package name always contains a hyphen, so it can never be `docs`.

### What the CLI writes

Creating a monorepo:

1. Copy `templates/base` to the project directory and replace `next-friday-template-monorepo` with the project name in it.
2. Copy `templates/starlight` to `apps/docs`.
3. For each app, copy `templates/<template>` to `apps/<group>/<app>` and replace `next-friday-template-<template>` with `<group>-<app>` inside that folder only.
4. For each app whose template has `pnpm-workspace.yaml`, merge that file into the root `pnpm-workspace.yaml` and do not copy it into the app, because pnpm treats a folder with its own `pnpm-workspace.yaml` as a separate workspace root.
5. Append `/apps/<group>/ <owner>` to `.github/CODEOWNERS` for each new group that has an owner.
6. Rename every `_gitignore` to `.gitignore`, and write `.env` from `.env.example` in each app that has one, as `writeEnvironmentFile` in `src/setup.ts` does today, including the random `PAYLOAD_SECRET`. The root gets no `.env`: "Using a `.env` file at the root of the repository is not recommended. Instead, we recommend placing your `.env` files into the Application Packages where they're used" (`crafting-your-repository/using-environment-variables.mdx`).
7. Run `git init` and `pnpm install` at the root, as today.

Adding apps runs steps 3 to 6 for the new apps and then `pnpm install --no-frozen-lockfile`, which updates the root `pnpm-lock.yaml`. The flag is needed because pnpm's frozen lockfile "is on by default in CI" and fails "if an update is needed" (`pnpm install --help`, pnpm 12.6.0), and an agent may add an app from CI. If a step fails or Ctrl+C arrives, the CLI removes the new app folders and restores `CODEOWNERS`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` to their content before the run, removes `pnpm-lock.yaml` when the run created it (a monorepo created with `--skip-install` has none yet), as `removeProject` does for a new project today.

The merge in step 4 adds keys the root lacks and stops with the key's name when a key already holds a different value, so two templates never overwrite each other's settings silently. It uses the `yaml` package, which keeps comments and is already in this repository's lockfile (`yaml@2.9.1`, `pnpm-lock.yaml`); Node.js has no YAML parser, so `platform-and-library-first.md` step 2 applies, and the package is added as `dependency-security.md` describes.

### Templates in this repository

| Folder                  | Holds                                                                                                                                                                                                                                                                       |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/base/`       | The monorepo root: today's `base` files plus the root files of `templates/turborepo/`. Its `package.json` is named `next-friday-template-monorepo`.                                                                                                                         |
| `templates/starlight/`  | The docs site, copied to `apps/docs`. Its `package.json` is named `docs`.                                                                                                                                                                                                   |
| `templates/<template>/` | One app for each of `nextjs`, `nextjs-liff`, `payload`, `nestjs`, and `nodejs`: the starter's files plus the company tooling, a `Dockerfile`, a `turbo.json` that starts with `"extends": ["//"]`, `.env.example` when the app reads variables, and `template-source.json`. |

- `templates/turborepo/` is removed, and so are the root-level files each stack has today (`AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `.github/`, `.agents/`, `.claude/`, `.cursor/`, `.mcp.json`, `.lintstagedrc.json`, `.prettierignore`), which move once into `templates/base/`.
- The agent rules render once, at the root, with the globs the `turborepo` stack uses today (`**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.jsx`, and `**/*.test.ts`, `**/*.test.tsx`), which cover every template. The per-stack rule copies that `AGENTS.md` ("Template rule copies") describes go away.
- Root scripts name no app. Scripts that name an app today move into that app's `package.json`: `generate:importmap`, `generate:types`, `migrate`, and `migrate:create` into the Payload template, and the `next typegen` calls in `prepare` into each Next.js app's own `typecheck`, which already runs `next typegen` in `templates/nextjs/package.json`. Root lists of app paths, such as `clean` and `sort-package-json`, become globs over the workspace.
- The root `turbo.json` keeps the shared tasks. Each app's own `turbo.json` sets what differs, such as `outputs` and `passThroughEnv`, as Turborepo's package configurations describe: "add a `turbo.json` file in any package of your monorepo with a top-level `extends` key" and "The `extends` array must start with `["//"]`" (`reference/package-configurations.mdx`).

#### Recording the generator

Each app template and `templates/starlight/` has `template-source.json`, copied into every generated app, as Copier copies its answers file into each project, where `_commit` and `_src_path` indicate "how the last template update was done" (Copier 9.19.1 `docs/creating.md`):

```json
{
  "generator": "create-next-app",
  "version": "16.4.5",
  "command": "pnpm dlx create-next-app@16.4.5 --yes --use-pnpm --skip-install --disable-git"
}
```

Regenerating a template runs the recorded command at the generator's new version, then reapplies the company tooling, and updates the file in the same commit. The CLI does not read this file.

#### Each template

Versions are the current ones on npm on 2026-11-09; the plan pins them when it generates each template.

| Template      | Generator and version                                                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :------------ | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nextjs`      | `create-next-app` 16.4.5 with its recommended defaults                          | The defaults are "TypeScript, ESLint, No React Compiler, Tailwind CSS, No src/ directory, App Router, Cache Components, AGENTS.md, Agent feedback" (`next` 16.4.5 `dist/docs/01-app/03-api-reference/06-cli/create-next-app.md`). The starter writes `eslint.config.mjs` and `postcss.config.mjs`; the company ESLint config replaces the content of `eslint.config.mjs`, and both keep their names (see **Areas of concern**).         |
| `nextjs-liff` | `@line/create-liff-app` 1.1.7, Next.js TypeScript template                      | It runs `create-next-app` with `--ts` and `--app`, then adds `providers/liff-providers.tsx` and replaces `app/layout.tsx`, `app/page.tsx`, `app/page.module.css`, `app/globals.css`, and `app/favicon.ico` (`dist/create-liff-app.js`, lines 317–339, and `templates/nextjs-ts/`). How it gets the LIFF ID is below.                                                                                                                    |
| `payload`     | `create-payload-app` 3.93.0, `-t blank --db postgres`                           | The blank template's layout: `src/app/(payload)/`, `src/app/(frontend)/`, `src/payload.config.ts`, `src/collections/Users.ts` and `Media.ts`, and `src/payload-types.ts` (`dist/template/`). Its workspace settings, today's `packageExtensions`, `overrides`, and `peerDependencyRules` for Payload in `templates/turborepo/pnpm-workspace.yaml`, move to `templates/payload/pnpm-workspace.yaml`, which the CLI merges into the root. |
| `nestjs`      | `@nestjs/cli` 12.0.12 (`nest new`), ESM                                         | ESM is the schematic's default (`"enum": ["cjs","esm"], "default": "esm"`, `@nestjs/schematics` 12.0.13 `dist/lib/application/schema.json`), and the ESM starter tests with Vitest (`vitest.config.ts`, `vitest.config.e2e.ts`), as the other templates do. It lints with oxlint (`"lint": "oxlint --type-aware src/ test/"`); the company ESLint config replaces oxlint, because every template lints with it.                         |
| `nodejs`      | None                                                                            | Node.js has no official project generator. The template follows Node.js's TypeScript documentation, which runs TypeScript files directly: "By default Node.js will execute TypeScript files that contains only erasable TypeScript syntax", stable since v24.12.0 ([Node.js: TypeScript](https://nodejs.org/api/typescript.html)). Its `template-source.json` records no generator and names that page.                                 |
| `starlight`   | `create-astro` 5.3.1 with `--template starlight` (`@astrojs/starlight` 0.42.10) | `create-astro` resolves the template to `github:withastro/starlight/examples/<starter>` (`dist/index.js`). Pages live in `src/content/docs/`: "Loads content files from the `src/content/docs/` directory" (`@astrojs/starlight` `dist/loaders.js`). Pagefind search is on by default while pages are prerendered, which is the default (`dist/utils/user-config.js`, lines 66 and 85).                                                 |

Starters that write their own `AGENTS.md` (`create-next-app` and `nest new`) keep it in the app, because the layout stays as the starter has it.

### The LIFF ID in `nextjs-liff`

The starter's provider reads the ID inside a client `useEffect`: `liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })` (`templates/nextjs-ts/providers/liff-providers.tsx`, lines 24–31). Next.js inlines `NEXT_PUBLIC_` values "into the JavaScript bundle during `next build`", so with one image "all `NEXT_PUBLIC_` variables will be frozen with the value evaluated at build time" (`next` 16.4.5 `dist/docs/01-app/02-guides/self-hosting.md` and `environment-variables.md`).

Decision:

- The variable is `LIFF_ID`, without the prefix, so Next.js keeps it on the server.
- `app/layout.tsx`, a server component, calls `await connection()` from `next/server` and passes `process.env.LIFF_ID` to `<LIFFProvider liffId={...}>`. Next.js documents this pattern: "You can safely read environment variables on the server during dynamic rendering", with `await connection()` before reading `process.env` (`environment-variables.md`).
- `LIFFProvider` takes `liffId` as a prop and passes it to `liff.init({ liffId })`, which takes the ID as an argument (`@liff/types` 2.32.0: `export interface Config { liffId: string; ... }`).
- Each environment's service sets its own `LIFF_ID`, and `.env.example` lists `LIFF_ID=`.

The files and folders stay as the starter has them; only the provider's and the layout's code change, which requirement 14 needs.

### Documentation

- `apps/docs` holds the documentation for people. The template's pages are: getting started (today's "After creating a project from this template" in each stack's `README.md`), contributing (today's `CONTRIBUTING.md` content for people), the apps and groups guide with the intent's group table, and how to add an app. `intent/playbook-plays/intent.md` adds the loop guide page.
- These stay where their reader reads them: `intent/`, `CLAUDE.md`, `AGENTS.md`, `.claude/skills/`, `REVIEW.md`, the lessons file, `SETUP.md`, `SECURITY.md`, and the other files GitHub reads. The root `README.md`, which GitHub shows on the repository page, keeps a short description and points to the docs site. An app keeps the `README.md` its starter writes.
- `apps/docs` is built, imaged, and deployed like every other app. Its `Dockerfile` serves the built static site, following Astro's Docker recipe ([Astro: Docker](https://docs.astro.build/en/recipes/docker/)); see **Areas of concern**.

### What an app's files tell CI

`intent/ci/intent.md` owns how CI runs Turborepo. CI reads only these files, so it never names an app:

| File in `apps/<group>/<app>` or `apps/docs` | What CI does                                                                                                                                                                                                |
| :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` `scripts.test:e2e`           | Runs the app's end-to-end tests. Turborepo runs a task only in packages that define the script: on 2026-11-09, `turbo run test:e2e` across four packages, one with the script, ran "1 successful, 1 total". |
| `Dockerfile`                                | Builds the app's image, pushes it, and deploys it.                                                                                                                                                          |
| `turbo.json`                                | Sets the app's task outputs, inputs, and pass-through variables.                                                                                                                                            |
| `package.json` `name`                       | Names the image and the Railway service: `<group>-<app>`, or `docs`.                                                                                                                                        |

`templates/turborepo/.github/scripts/affected-apps.sh`, which lists `app` and `backoffice` by name, is removed; `intent/ci/intent.md` replaces it with `turbo query affected`.

### Remote cache

- The root `turbo.json` sets `"remoteCache": { "signature": true }` and `"futureFlags": { "longerSignatureKey": true }`. Turborepo says signing "verifies the integrity of a cached artifact", and its documentation tells the reader to "Enable `futureFlags.longerSignatureKey` to enforce a minimum key length of 32 bytes" (`reference/configuration.mdx`).
- CI passes `TURBO_API` and `TURBO_TEAM` from repository variables and `TURBO_TOKEN` and `TURBO_REMOTE_CACHE_SIGNATURE_KEY` from secrets. Turborepo reads all four: `TURBO_API` sets "the base URL for Remote Cache" (`reference/system-environment-variables.mdx`). The `vercel/setup-turborepo-remote-cache-action` step in today's `ci.yml` is removed.
- Without `TURBO_TOKEN`, CI runs without a remote cache. With Vercel's values and no `TURBO_API`, it uses Vercel Remote Cache, whose API URL is Turborepo's default (`remoteCache.apiUrl`, "Default: "https://vercel.com"").
- `SETUP.md` sets up the default: a Railway service from the `ducktors/turborepo-remote-cache` image, which Turborepo lists under "Community implementations" of a self-hosted Remote Cache (`core-concepts/remote-caching.mdx`), with `STORAGE_PROVIDER=s3`, `STORAGE_PATH` set to the bucket name, `S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` taken from a Railway Bucket by variable references, `TURBO_TOKEN`, and the same `TURBO_REMOTE_CACHE_SIGNATURE_KEY`, which "Must be the same for the Turborepo client and the cache server" (`ducktors/turborepo-remote-cache` `docs/environment-variables.md`). Railway Buckets give "S3-compatible authentication credentials" and "Storage Buckets can provide the S3 authentication credentials to your other services by using Variable References" (Railway docs: Storage Buckets).
- The cache serves CI only, so it runs in one Railway environment.

### Images and deploys

- On each push to `main`, after its checks pass, CI builds an image for each changed app that has a `Dockerfile`, as `intent/ci/intent.md` sets out, and pushes it to `ghcr.io/<owner>/<repository>/<package name>`, tagged with the commit SHA. The owner and repository are lowercased, because a GitHub name may hold capitals and Docker then fails with "invalid reference format: repository name must be lowercase" (`docker/build-push-action` `TROUBLESHOOTING.md`); the digest references below use the same lowercased path. The job needs `packages: write`, as GitHub's workflow for the registry sets it (GitHub Docs: Publishing and installing a package with GitHub Actions). It records no build provenance attestation, as the intent says.
- The job outputs each image's digest. The deploy to `dev` and every later promotion deploy `ghcr.io/<owner>/<repository>/<package name>@sha256:<digest>`; GitHub documents pulling "the exact container image version you want to pull by the `digest` SHA value" (GitHub Docs: Working with the Container registry). Who may promote, the gate before `prod`, the deployment records, and rollback belong to `intent/playbook-plays/intent.md`.
- Each app is one Railway service, named after its package, in each of the project's `dev`, `uat`, and `prod` environments. A deploy points that environment's service at the digest and deploys it, through Railway's public API: `serviceInstanceUpdate(serviceId, environmentId, input: { source: { image } })`, which updates "build/deploy settings for a service in a specific environment", then `serviceInstanceDeployV2` (Railway docs: Manage Services; the input type is in `src/gql/schema.json` of `railwayapp/cli`). The CLI's `railway service source connect --image` calls `serviceConnect`, which takes no environment, so it is not used.
- CI authenticates with a Railway project token for each environment, stored as the `RAILWAY_TOKEN` secret of the matching GitHub environment: "Project tokens are scoped to a specific environment within a project and can only be used to authenticate requests to that environment", sent as the `Project-Access-Token` header (Railway docs: Public API).
- Railway pulls the private image with a GitHub personal access token (classic) that has `read:packages`, set as the service's registry credentials ("Create a GitHub Personal Access Token with the read:packages scope", Railway docs: Private Registries). "Private Docker registry deployments require the Pro plan" (Railway docs: Services).
- Each Railway service sets its own variables per environment, which the app reads at runtime (requirement 14). Next.js apps read them on the server during dynamic rendering, as the LIFF ID does.

### This repository

| Path                                          | Change                                                                                                                                                                                                                                                           |
| :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/stacks.ts`                               | Becomes the list of app templates (id, label, hint, whether it needs a database, development script). `starlight` is not in it, because the CLI always adds the docs site.                                                                                       |
| `src/arguments.ts`                            | The options in **Command line**; parses `--app` and `--owner` with `parseArgs`' `multiple: true`.                                                                                                                                                                |
| `src/project-name.ts`                         | Adds the group and app checks in **Name checks**.                                                                                                                                                                                                                |
| `src/create.ts`, `src/rename.ts`              | The steps in **What the CLI writes**; `renameProject` runs on one folder at a time.                                                                                                                                                                              |
| `src/setup.ts`                                | Writes `.env` per app; `git init` only when creating.                                                                                                                                                                                                            |
| `test/`                                       | Cases for each name check, `--add`, the `pnpm-workspace.yaml` merge and its conflict, `CODEOWNERS`, and the rollback.                                                                                                                                            |
| `templates/`                                  | As in **Templates in this repository**.                                                                                                                                                                                                                          |
| `.github/workflows/ci.yml`                    | The Template job generates one monorepo per app template (the docs site plus one app) and one with every app template, then runs `pnpm verify` in each. The consumer smoke test checks an unknown template instead of an unknown stack (lines 238–242).          |
| `README.md`, `AGENTS.md`, `.cursor/BUGBOT.md` | The new options, layout, and template check. The template check in `AGENTS.md` generates `next-friday-template-monorepo` with `--app next-friday-template/<template>=<template>`, so every package keeps its template name and edited files copy back unchanged. |
| `.changeset/`                                 | A major changeset that names the removal of `--stack` and the single-app layouts.                                                                                                                                                                                |

### Order of work

1. The CLI's arguments and name checks, test first.
2. `templates/base/` as the monorepo root, and `templates/starlight/`.
3. Each app template from its generator, with `template-source.json`.
4. Copying, renaming, merging, `CODEOWNERS`, and rollback in `src/create.ts`.
5. The remote cache, image, and deploy changes in the template workflows and `SETUP.md`, together with `intent/ci/intent.md`'s changes to the same files.
6. The Template job, `README.md`, `AGENTS.md`, and the changeset.

## Proof

- Unit tests fail before the change and pass after it, one for each name check, including `customer/online-web` with `customer-online/web` and the group `docs`.
- The Template job passes for each app template alone and for every template together; no generated file still holds a template package name other than the template check's own.
- In a generated monorepo, `pnpm exec turbo ls` lists `docs apps/docs` and each app as `<group>-<app> apps/<group>/<app>`.
- Adding an app with `--add` changes nothing outside the new app folder except `pnpm-lock.yaml`, and `CODEOWNERS` or `pnpm-workspace.yaml` when the run needs them; `git diff --stat` shows it.
- In a consumer project on Railway: a push to `main` deploys only the changed apps to `dev` by digest, a promotion to `uat` deploys the same digest, and a second CI run on an unchanged commit reads its tasks from the remote cache. These run only in a consumer project, not in this repository's CI.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review the Railway project tokens, the GitHub token with `read:packages` that Railway stores, the remote cache's `TURBO_TOKEN`, which in `AUTH_MODE=static` lets "Each token … read and write the cache of all teams" (`ducktors/turborepo-remote-cache`), and the signature key.
- **Nested packages are not rejected by Turborepo here:** with `turbo` 2.11.10 and pnpm 12.6.0 on 2026-11-09, a package at `apps/docs/web` inside the package at `apps/docs` passed `turbo ls` and `turbo run build` with no error, although Turborepo's documentation says such a structure "will result in an error". The CLI's `docs` check is therefore the only guard, and no template may put a `package.json` inside `apps/docs`.
- **Starter file names and the TypeScript rule:** `typescript-first.md` asks for `.ts` files, while `create-next-app` writes `eslint.config.mjs` and `postcss.config.mjs`. The intent keeps the starter's names, and the rule itself allows "an extension required by the runtime, tool, or public contract", so the names stay `.mjs`.
- **Railway, unverified:** these could not be confirmed from Railway's documentation, because docs.railway.com is blocked in this session and only search snippets were read. The plan proves each in a Railway project before building on it: that `serviceInstanceUpdate` accepts an image reference with `@sha256:`; that a project token may call it; that a service deployed from an image reads no `railway.json` from the repository ("If the source is a Docker Image, the build step is skipped"), so each service's health check path is set in Railway; and that Railway Buckets accept path-style requests, which `ducktors/turborepo-remote-cache` always sends (`forcePathStyle: true`, `src/plugins/remote-cache/storage/index.ts`) while Railway documents that "Railway Buckets use virtual-hosted–style URLs".
- **Other sources not read in full:** the LINE LIFF reference, Payload's documentation, Starlight's getting-started page, and Astro's Docker recipe were blocked in this session; the design rests on the packages' own source at the versions named. The plan reads those pages before it generates the templates.
- **Running without signature variables:** with `remoteCache.signature` on and no `TURBO_REMOTE_CACHE_SIGNATURE_KEY`, whether `turbo` runs without error when no remote cache is set is unverified. The Template job proves it, because it runs with none of the cache variables.
- **Any combination of apps:** the Template job checks each template alone and all of them together, not every combination; two templates that conflict only with each other are caught by the `pnpm-workspace.yaml` merge, which stops on a conflicting key.
- **Cost on Railway:** private images need the Pro plan; each app and the docs site run as a service in every environment they are deployed to; Buckets "are billed at $0.015 per GB-month … including Environments" (Railway docs: Storage Buckets billing).
- **Overlapping intents:** `intent/ci/intent.md` changes the same workflows (matrix, `turbo prune`, per-app lint), `intent/playbook-plays/intent.md` owns promotion, rollback, the loop guide in `apps/docs`, and the setup skill, and `intent/lean-agent-setup/intent.md` moves Payload's pnpm settings out of the base, which **Templates** above also does. The plans for these intents edit the same files, so they need one agreed order.
- **Payload 4:** `create-payload-app` has a `beta` tag at 4.0.0-beta.7. The first release uses 3.93.0, the current release.

## Open questions

The intent has no open questions. It asked the spec to decide how `nextjs-liff` gets each environment's LIFF ID, answered in **The LIFF ID in `nextjs-liff`**, and to test the workspace globs and nesting against the templates' pnpm and Turborepo versions, answered in **Name checks** and **Areas of concern**.
