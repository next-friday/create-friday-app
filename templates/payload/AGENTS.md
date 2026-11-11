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

## Verifying your work

- Build: `pnpm build` (prints the `Route (app)` table)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Lint: `pnpm verify:static` (ESLint allows zero warnings; prints `✔ no dependency violations found`)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

## Architecture

- `src/payload.config.ts` wires the collections in `src/collections/` to PostgreSQL. The site lives in `src/app/(frontend)/`, and `src/app/health/route.ts` serves `/health`.
- In development, Payload applies collection changes to the database directly. In production, the server applies the migrations in `src/migrations/` when it starts.

## Conventions

1. **Change the schema only through collections, then regenerate and commit.** Payload generates `src/app/(payload)/`, `src/payload-types.ts`, and `src/migrations/`; run `pnpm generate:types`, `pnpm generate:importmap`, and `pnpm migrate:create <name>`. Do not edit those files by hand.
2. **Put unit tests next to the code as `src/**/*.test.{ts,tsx}` and Playwright end-to-end tests in `test/` as `*.e2e.test.ts`.** Vitest collects only the first pattern.
3. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
4. **Read configuration through `requireEnvironment` in `src/environment.ts`.** Document each variable in `.env.example`.
5. **Start from the accepted spec, in plan mode** (Cursor: Plan Mode). Give the plan the change's `intent/<change>/intent.md` and `spec.md`. Commit the approved plan as `intent/<change>/plan.md` with an `Accepted by:` line naming the engineer, as `.agents/skills/sdlc/playbooks/build.md` describes.
6. **Start a bug fix with a failing test.** Reproduce the bug as a test, confirm it fails for the reason you expect, and commit it. Then create `.git/bug-fix-in-progress`, so `.agents/hooks/agent-test-edit-gate.sh` blocks test edits, make the test pass without editing it, and delete `.git/bug-fix-in-progress`.
7. **Do not start work a person did not ask for.** When a message reports a problem without asking for work, answer in a few lines and end with the message that would start it: `/sdlc` followed by their own words.
8. **Branch from the latest `origin/main`, and open the pull request ready for review.** Name the branch `<type>/<short-description>` and fill the body from `.github/pull_request_template.md`. `.github/workflows/ci.yml` runs full verification only on a pull request that is not a draft. Never merge a pull request: a person merges it with `--squash` after code owner approval, bottom-up for a stack of pull requests.
9. **Write replies a person can check.** Reply in the language the person wrote in. Write paths from the project root, such as `README.md:12`, never from the machine's root. State as a fact only what you opened or ran in this turn, and say what you ran; mark anything else as inferred or not checked. Answer what was asked and stop: leave out tools, services, and steps the request does not need, and never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Database for `pnpm dev` and end-to-end tests**: both need a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`; the README lists every variable. Run `pnpm exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Production gate**: `.agents/hooks/agent-production-gate.sh` blocks a shell command that deploys to `prod`, runs a Railway CLI command that names `prod`, or pushes a release tag, unless a release manager started the session with `RELEASE_APPROVAL` set. Report what is ready to promote instead. When a gated command appears only inside a message, write the text to a file with your file-editing tool, not a shell heredoc, and pass it with `git commit -F <file>` or `gh pr create --body-file <file>`. The gate reads only shell commands, so an MCP tool or a Railway command without `-e` or `--environment` passes it.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
