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

## How it fits together

- `src/main.ts` creates the app from `AppModule` on `parsePort(process.env.PORT)` with Nest's `ConsoleLogger`, which writes JSON lines when `NODE_ENV` is `production`.
- `AppModule` imports `HealthModule`, whose Terminus controller serves `/health`. Add a feature as its own module and import it in `AppModule`.

## Mandatory rules

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Put unit tests next to the code as `src/**/*.test.ts` and end-to-end tests in `test/` as `*.e2e.test.ts`.** `vitest.config.ts` and `vitest.e2e.config.ts` collect only those patterns.
3. **Read configuration from environment variables and fail when one is missing**, as `parsePort` does. Document each variable in `.env.example`.
4. **Log through Nest's `Logger`.** It goes to the `ConsoleLogger` set in `src/main.ts`.

## Known pitfalls

- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that names a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`, even when it only reads.

## Related documentation

- [README.md](README.md): scripts, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests
