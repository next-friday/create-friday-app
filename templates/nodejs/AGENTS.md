# Agent guide

TypeScript HTTP service on `node:http`, without a framework, on pnpm and Node.js `>=24.15.0 <25`.

## Commands

| Task                        | Command                                             |
| :-------------------------- | :-------------------------------------------------- |
| Start with reload           | `pnpm start:dev`                                    |
| One test                    | `pnpm vitest run src/port.test.ts -t "<test name>"` |
| Unit tests                  | `pnpm test`, or `pnpm test:coverage`                |
| What `pre-push` runs        | `pnpm check`                                        |
| Every check                 | `pnpm verify`                                       |
| Render rules after a change | `pnpm rules:sync`                                   |

## How it fits together

- `src/main.ts` starts `createAppServer()` from `src/server.ts` on `parsePort(process.env.PORT)`, and on `SIGTERM` or `SIGINT` stops accepting connections and closes any left after 10 seconds.
- `src/server.ts` answers `GET` and `HEAD` `/health` and returns 404 for every other request. Routes go there.

## Mandatory rules

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. After changing either, run `pnpm rules:sync`; `pnpm check` fails on stale copies.
2. **Put tests next to the code as `src/**/*.test.ts`.** Vitest collects only that pattern.
3. **Read configuration from environment variables and fail when one is missing**, as `parsePort` does. Document each variable in `.env.example`; `pnpm start` and `pnpm start:dev` load `.env`.

## Known pitfalls

- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that writes to a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`. It is a convenience, not a security boundary: CI and code-owner review are the boundary.

## Related documentation

- [README.md](README.md): scripts, container, deploy
- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, pull requests
