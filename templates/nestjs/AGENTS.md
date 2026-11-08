# Agent guide

NestJS HTTP API in TypeScript on pnpm and Node.js `>=24.15.0 <25`.

## Commands

| Task                        | Command                                             |
| :-------------------------- | :-------------------------------------------------- |
| Start with reload           | `pnpm start:dev`                                    |
| One test                    | `pnpm vitest run src/port.test.ts -t "<test name>"` |
| Unit tests                  | `pnpm test`, or `pnpm test:coverage`                |
| End-to-end tests            | `pnpm test:e2e`                                     |
| What `pre-push` runs        | `pnpm check`                                        |
| Every check                 | `pnpm verify`                                       |
| Render rules after a change | `pnpm rules:sync`                                   |

## Verifying your work

- Build: `pnpm build` (prints nothing after `$ tsc -p tsconfig.build.json`)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Lint: `pnpm verify:static` (ESLint allows zero warnings; prints `✔ no dependency violations found`)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.
If a test fails, fix the code, not the test.

## Architecture

- `src/main.ts` creates the app from `AppModule` on `parsePort(process.env.PORT)` with Nest's `ConsoleLogger`, which writes JSON lines when `NODE_ENV` is `production`.
- `AppModule` imports `HealthModule`, whose Terminus controller serves `/health`. Add a feature as its own module and import it in `AppModule`.

## Conventions

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, or a skill or subagent in `.agents/skills/` or `.agents/agents/`, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Put unit tests next to the code as `src/**/*.test.ts` and end-to-end tests in `test/` as `*.e2e.test.ts`.** `vitest.config.ts` and `vitest.e2e.config.ts` collect only those patterns.
3. **Read configuration from environment variables and fail when one is missing**, as `parsePort` does. Document each variable in `.env.example`.
4. **Log through Nest's `Logger`.** It goes to the `ConsoleLogger` set in `src/main.ts`.
5. **Plan in plan mode, with documents sized to the change.** Claude Code starts every session in plan mode (`.claude/settings.json`); in Cursor, switch to Plan Mode before the first edit. `intent/README.md` says which changes need `intent.md`, `spec.md`, and `plan.md`. Give the plan the ones the change has, and have it name the files that change, the order of the work, and the tests that prove it. When the change needs a `plan.md`, commit the approved plan as `intent/<change>/plan.md`, and update it in the same commit when implementation departs from it. Before merging, move what stays true into `docs/`.
6. **Start a bug fix with a failing test.** Reproduce the bug as a test, run it, and confirm it fails for the reason you expect. Commit that test. Then create `.git/bug-fix-in-progress`, so `.agents/hooks/agent-test-edit-gate.sh` blocks test edits, and make the test pass without editing it. Delete `.git/bug-fix-in-progress` when the fix is done.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that writes to a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`. It is a convenience, not a security boundary: CI and code-owner review are the boundary.

## Related documentation

- [docs/](docs/README.md): how the project works, how to run it, and the decisions in `docs/adr/`
- [README.md](README.md): scripts, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests
