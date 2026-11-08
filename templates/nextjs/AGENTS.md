# Agent guide

Next.js App Router web app with React and Tailwind CSS, in TypeScript on pnpm and Node.js `>=24.15.0 <25`.

## Commands

| Task                        | Command                                                     |
| :-------------------------- | :---------------------------------------------------------- |
| Start with reload           | `pnpm dev`                                                  |
| One test                    | `pnpm vitest run app/health/route.test.ts -t "<test name>"` |
| Unit tests                  | `pnpm test`, or `pnpm test:coverage`                        |
| End-to-end tests            | `pnpm test:e2e`                                             |
| What `pre-push` runs        | `pnpm check`                                                |
| Every check                 | `pnpm verify`                                               |
| Render rules after a change | `pnpm rules:sync`                                           |

## Verifying your work

- Build: `pnpm build` (prints the `Route (app)` table)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Lint: `pnpm verify:static` (ESLint allows zero warnings; prints `✔ no dependency violations found`)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.
If a test fails, fix the code, not the test.

## Architecture

- Routes live in `app/`. `app/health/route.ts` serves `/health`.
- `next.config.ts` builds `output: "standalone"`, enables Cache Components, and sets the security headers. `pnpm start` copies the static assets into `.next/standalone` and serves it.

## Conventions

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, or a skill or subagent in `.agents/skills/` or `.agents/agents/`, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Put unit tests next to the code as `app/**/*.test.{ts,tsx}` and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.** Vitest collects only the first pattern.
3. **Ask the user before adding component tests.** They need a DOM test environment, and Vitest runs in Node.js.
4. **Read configuration from environment variables and fail when one is missing.** Document each variable in `.env.example`.
5. **Start in plan mode and commit the approved plan.** Claude Code starts every session in plan mode (`.claude/settings.json`); in Cursor, switch to Plan Mode before the first edit. Give the plan the change's `intent/<change>/intent.md` and `spec.md` when they exist; `intent/README.md` says which changes need them. Have it name the files that change, the order of the work, and the tests that prove it. Commit the approved plan as `intent/<change>/plan.md`. When implementation departs from the plan, update `plan.md` in the same commit. Before merging, move what stays true into `docs/`.
6. **Start a bug fix with a failing test.** Reproduce the bug as a test, run it, and confirm it fails for the reason you expect. Commit that test. Then create `.git/bug-fix-in-progress`, so `.agents/hooks/agent-test-edit-gate.sh` blocks test edits, and make the test pass without editing it. Delete `.git/bug-fix-in-progress` when the fix is done.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **First end-to-end run**: run `pnpm exec playwright install chromium` once. `pnpm test:e2e` starts the development server unless one is already running.
- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that writes to a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`. It is a convenience, not a security boundary: CI and code-owner review are the boundary.

## Related documentation

- [docs/](docs/README.md): how the project works, how to run it, and the decisions in `docs/adr/`
- [README.md](README.md): scripts, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
