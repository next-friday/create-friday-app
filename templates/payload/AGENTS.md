# Agent guide

Payload CMS on Next.js App Router and PostgreSQL, in TypeScript on pnpm and Node.js `>=24.22.1 <25`. The API is REST at `/api`.

## Commands

| Task                          | Command                                                    |
| :---------------------------- | :--------------------------------------------------------- |
| Start with reload             | `pnpm dev`                                                 |
| One test                      | `pnpm vitest run src/environment.test.ts -t "<test name>"` |
| Unit tests                    | `pnpm test`, or `pnpm test:coverage`                       |
| End-to-end tests              | `pnpm test:e2e`                                            |
| Regenerate after a collection | `pnpm generate:types`, `pnpm generate:importmap`           |
| Create a migration            | `pnpm migrate:create <name>`                               |
| What `pre-push` runs          | `pnpm check`                                               |
| Every check                   | `pnpm verify`                                              |
| Render rules after a change   | `pnpm rules:sync`                                          |

## How it fits together

- `src/payload.config.ts` wires the collections in `src/collections/` to PostgreSQL. The site lives in `src/app/(frontend)/`, and `src/app/health/route.ts` serves `/health`.
- In development, Payload applies collection changes to the database directly. In production, the server applies the migrations in `src/migrations/` when it starts.

## Mandatory rules

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Change the schema only through collections, then regenerate and commit.** Payload generates `src/app/(payload)/`, `src/payload-types.ts`, and `src/migrations/`; run `pnpm generate:types`, `pnpm generate:importmap`, and `pnpm migrate:create <name>`. Do not edit those files by hand.
3. **Put unit tests next to the code as `src/**/*.test.{ts,tsx}` and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.** Vitest collects only the first pattern.
4. **Ask the user before adding component tests.** They need a DOM test environment, and Vitest runs in Node.js.
5. **Read configuration through `requireEnvironment` in `src/environment.ts`.** Document each variable in `.env.example`.

## Known pitfalls

- **Database for `pnpm dev` and end-to-end tests**: both need a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`; the README lists every variable. Run `pnpm exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that writes to a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`. It is a convenience, not a security boundary: CI and code-owner review are the boundary.

## Related documentation

- [README.md](README.md): environment variables, scripts, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
