---
"@next-friday/create-app": patch
---

The CLI writes errors to standard error and exits with a named message when the working directory or a template directory is missing. `--help` and `--version` answer without checking the other arguments. `--skip-git` in a directory that already holds a repository does not tell you to run `git init`, and an existing `.git` directory is left untouched. The project name is checked again after the prompts, and `SIGTERM` and `SIGHUP` clean up a half-written project as Ctrl+C does.

In the `nodejs` stack a request target that is not a valid URL gets `404`, and `pnpm start` builds first. In the `nodejs` and `nestjs` stacks `pnpm build` writes `dist/` every time, the container runs as the non-root user with UID 1000, and its `HEALTHCHECK` reads `PORT`; the `nestjs` stack's `pnpm verify` also runs `pnpm test:e2e`. Every stack's `Dockerfile` names the Node.js image by tag and digest.

In the `payload` stack and the `turborepo` backoffice, `/health` initialises Payload, so it answers `500` when Payload cannot initialise because the database is unreachable, and the first health check after a deploy applies the migrations. Uploads accept AVIF, GIF, JPEG, PNG, and WebP only.

The `nextjs`, `payload`, and `turborepo` pages do not name Next Friday, their `tsconfig.json` defines no `@/*` path alias, and the `turborepo` apps each carry an `AGENTS.md`.

In the `turborepo` stack a failure while listing the affected apps fails the job, a change to the root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `railway.json`, or `.dockerignore` selects every app, a change to a `README.md` selects none, and `pnpm test:changed` sees changes to root files.

The CI of every generated project runs `pnpm plan:check` and `pnpm bands:check`, and the SAST workflow runs on every push to `main`. `pnpm intent:check` and `pnpm bands:check` read the project's own `intent/` files and `bands.yaml` as well as running their self-tests. Dependabot proposes major npm updates and uses the default time zone. The secret scan reads its configuration from the base commit of a pull request, and the deploy check accepts an app URL with a trailing slash. CodeQL, dependency review, and OpenSSF Scorecard run on public repositories and, on private ones, when the `CODE_SCANNING` variable is `true`. The gitleaks configuration needs gitleaks 8.21 or later.

`/sdlc` writes the `Accepted by:` line when it continues from a plan an engineer already accepted. `SETUP.md` names the `CODE_SCANNING` and `DEPLOY_ENABLED` variables and what `pnpm setup:check` reports; `pnpm setup:check` flags only the owner placeholders `SETUP.md` lists.
