# Agent guide

Turborepo workspace in TypeScript on pnpm and Node.js `>=24.22.1 <25`. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on PostgreSQL on port 3001, with a REST API at `/api`.

## Commands

| Task                               | Command                                                                                    | Healthy output                                                                                                               |
| :--------------------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Start both apps with reload        | `pnpm dev`                                                                                 | `✓ Ready in 300ms` from each app                                                                                             |
| One test                           | `pnpm --filter ./apps/backoffice exec vitest run src/environment.test.ts -t "<test name>"` | `Tests  1 passed \| 4 skipped (5)`                                                                                           |
| Tests in one app                   | `TURBO_FILTER=--filter=./apps/app pnpm test`                                               | `Tasks:    1 successful, 1 total`                                                                                            |
| Unit tests                         | `pnpm test`, or `pnpm test:coverage`                                                       | `Tasks:    2 successful, 2 total`                                                                                            |
| End-to-end tests                   | `pnpm test:e2e`                                                                            | `Tasks:    4 successful, 4 total`, with `DATABASE_URL` pointing at a running database                                        |
| Regenerate after a collection      | `pnpm generate:types`, `pnpm generate:importmap`                                           | `INFO: Compiling TS types for Collections and Globals...`, then nothing; `No new imports found, skipping writing import map` |
| Create a migration                 | `pnpm migrate:create <name>`                                                               | `INFO: Migration created at` the new file under `migrations/`, then `INFO: Done.`                                            |
| What `pre-push` runs               | `pnpm check`                                                                               | exits 0; the output ends with the summary `Tasks:    2 successful, 2 total`                                                  |
| Every check except `pnpm test:e2e` | `pnpm verify`                                                                              | exits 0; the output ends with the summary `Tasks:    2 successful, 2 total`                                                  |
| Render rules after a change        | `pnpm rules:sync`                                                                          | `Synced 37 agent rule files; 0 updated.`                                                                                     |

## Verifying your work

- Build: `pnpm build` (prints `Tasks:    2 successful, 2 total`)
- Test: `pnpm test:coverage` (all green, and prints `Tasks:    2 successful, 2 total`; never skip or delete a failing test)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

The `verifier` subagent starts the app with `pnpm dev`, which needs a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`. It exercises the changed behavior and the two nearest neighboring flows.

## Architecture

- Root scripts run lint, format, Knip, and the agent checks once for the workspace, and hand `build`, `test`, `typecheck`, and `depcruise` to Turborepo for each app. `TURBO_FILTER` narrows them; the default is every app.
- The site lives in `apps/app/app/`. The backoffice site lives in `apps/backoffice/src/app/(frontend)/`, its collections in `apps/backoffice/src/collections/`, and its config in `apps/backoffice/src/payload.config.ts`. The root `generate:*` and `migrate*` scripts run in the backoffice.
- In development, Payload applies collection changes to the database directly. In production, the backoffice applies the migrations in `apps/backoffice/src/migrations/` when Payload first initialises, which `/health` triggers, so the first health check after a deploy applies them, not when the server starts.

## Conventions

1. **Change the backoffice schema only through collections, then regenerate and commit.** Payload generates `apps/backoffice/src/payload-types.ts`, `apps/backoffice/src/migrations/`, and `apps/backoffice/src/app/(payload)/admin/importMap.ts`; run `pnpm generate:types`, `pnpm generate:importmap`, and `pnpm migrate:create <name>`. Do not edit those files by hand.
2. **Put unit tests next to the code and Playwright end-to-end tests in `apps/app/test/` and `apps/backoffice/test/` as `*.e2e.test.ts`.** Vitest collects `apps/app/app/**/*.test.{ts,tsx}` and `apps/backoffice/src/**/*.test.{ts,tsx}`.
3. **Component tests need a DOM test environment, and Vitest runs in Node.js.** Add that environment with the first component test.
4. **Read backoffice configuration through `requireEnvironment` in `apps/backoffice/src/environment.ts`.** Document each variable in `.env.example`.
5. **Start from the accepted spec, in plan mode** (Cursor: Plan Mode). Give the plan the change's `intent/<change>/intent.md` and `spec.md`. The engineer accepts the plan in the session, and `intent/<change>/plan.md` goes in one pull request with the code, as `playbooks/build.md` of the `sdlc-mode` skill in `plugins/sdlc/claude-code/` describes.
6. **Start a bug fix with a failing test.** A bug fix has no intent and no spec; its plan, `intent/<short-description>/plan.md`, is accepted by an engineer before any code changes. Reproduce the bug as a test, confirm it fails for the reason you expect, and commit it on a `fix/` branch. Then `.agents/hooks/agent-test-edit-gate.sh` blocks test edits by itself: make the test pass without editing it. On a branch with another name, create `.git/bug-fix-in-progress` first, and delete it once the test passes.
7. **Do not start work a person did not ask for.** When a message reports a problem without asking for work, answer in a few lines and end with the message that would start it: `/sdlc:sdlc-mode` followed by their own words.
8. **Branch from the latest `origin/main`, and open the pull request ready for review.** Name the branch `<type>/<short-description>` and fill the body from `.github/pull_request_template.md`. `.github/workflows/ci.yml` runs full verification only on a pull request that is not a draft. Never merge a pull request: a person merges it with `--squash` after code owner approval, bottom-up for a stack of pull requests.
9. **Write replies a person can check.** Write paths from the project root, such as `README.md:12`, never from the machine's root. State as a fact only what you opened or ran in this turn, and say what you ran; mark anything else as inferred or not checked. Answer what was asked and stop: leave out tools, services, and steps the request does not need, and never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.
10. **Run parallel sessions in separate worktrees, on tasks that touch different files.** Start each with `claude --worktree <name>`: a worktree is its own checkout on its own branch. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Next.js docs live per app**: this Next.js version differs from your training data. Read the guide in `apps/app/node_modules/next/dist/docs/` or `apps/backoffice/node_modules/next/dist/docs/` before writing Next.js code; the workspace root has no `next` package.
- **Database for `pnpm dev` and end-to-end tests**: the backoffice needs a PostgreSQL database in `DATABASE_URL` and `PAYLOAD_SECRET` in `.env`; the README lists every variable. Run `pnpm --filter ./apps/app exec playwright install chromium` once before the first `pnpm test:e2e`.
- **Production gate**: `.agents/hooks/agent-production-gate.sh` blocks a shell command that deploys to
  <!-- deploy:railway -->
  `prod`, runs a Railway CLI command that names `prod`,
  <!-- deploy:end -->
  <!-- deploy:none -->
  `prod`
  <!-- deploy:end -->
  or pushes a release tag, unless a release manager started the session with `RELEASE_APPROVAL` set to a value that matches the extended regular expression on the first line of `.agents/release-approval-form`. Report what is ready to promote instead. When a gated command appears only inside a message, write the text to a file with your file-editing tool, not a shell heredoc, and pass it with `git commit -F <file>` or `gh pr create --body-file <file>`. The gate reads only shell commands, so an MCP tool
  <!-- deploy:railway -->
  or a Railway command without `-e` or `--environment`
  <!-- deploy:end -->
  passes it.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.
