# Agent guide

Turborepo workspace in TypeScript on pnpm and Node.js `>=24.22.1 <25`. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on PostgreSQL on port 3001, with a REST API at `/api`.

## Commands

| Task                          | Command                                                                                    |
| :---------------------------- | :----------------------------------------------------------------------------------------- |
| Start both apps with reload   | `pnpm dev`                                                                                 |
| One test                      | `pnpm --filter ./apps/backoffice exec vitest run src/environment.test.ts -t "<test name>"` |
| Tests in one app              | `TURBO_FILTER=--filter=./apps/app pnpm test`                                               |
| Unit tests                    | `pnpm test`, or `pnpm test:coverage`                                                       |
| End-to-end tests              | `pnpm test:e2e`                                                                            |
| Regenerate after a collection | `pnpm generate:types`, `pnpm generate:importmap`                                           |
| Create a migration            | `pnpm migrate:create <name>`                                                               |
| What `pre-push` runs          | `pnpm check`                                                                               |
| Every check                   | `pnpm verify`                                                                              |
| Render rules after a change   | `pnpm rules:sync`                                                                          |

## How it fits together

- Root scripts run lint, format, Knip, and the agent checks once for the workspace, and hand `build`, `test`, `typecheck`, and `depcruise` to Turborepo for each app. `TURBO_FILTER` narrows them; the default is every app.
- The site lives in `apps/app/app/`. The backoffice site lives in `apps/backoffice/src/app/(frontend)/`, its collections in `apps/backoffice/src/collections/`, and its config in `apps/backoffice/src/payload.config.ts`. The root `generate:*` and `migrate*` scripts run in the backoffice.
- In development, Payload applies collection changes to the database directly. In production, the backoffice applies the migrations in `apps/backoffice/src/migrations/` when it starts.

## Mandatory rules

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Change the backoffice schema only through collections, then regenerate and commit.** Payload generates `apps/backoffice/src/app/(payload)/`, `apps/backoffice/src/payload-types.ts`, and `apps/backoffice/src/migrations/`; run `pnpm generate:types`, `pnpm generate:importmap`, and `pnpm migrate:create <name>`. Do not edit those files by hand.
3. **Put unit tests next to the code and Playwright end-to-end tests in `apps/app/test/` and `apps/backoffice/test/` as `*.e2e.test.ts`.** Vitest collects `apps/app/app/**/*.test.{ts,tsx}` and `apps/backoffice/src/**/*.test.{ts,tsx}`.
4. **Ask the user before adding component tests.** They need a DOM test environment, and Vitest runs in Node.js.
5. **Read backoffice configuration through `requireEnvironment` in `apps/backoffice/src/environment.ts`.** Document each variable in `.env.example`.

## Known pitfalls

- **Next.js docs live per app**: this Next.js version differs from your training data. Read the guide in `apps/app/node_modules/next/dist/docs/` or `apps/backoffice/node_modules/next/dist/docs/` before writing Next.js code; the workspace root has no `next` package.
- **Database for `pnpm dev` and end-to-end tests**: the backoffice needs a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`; the README lists every variable. Run `pnpm exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that names a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`, even when it only reads.

## Related documentation

- [README.md](README.md): environment variables, scripts, CI caching, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests
