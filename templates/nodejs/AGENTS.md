# Agent guide

TypeScript HTTP service on `node:http`, without a framework, on pnpm and Node.js `>=24.15.0 <25`.

## Commands

| Task                        | Command                                             | Healthy output                                                                                       |
| :-------------------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| Start with reload           | `pnpm start:dev`                                    | The only output is `$ node --env-file-if-exists=.env --watch src/main.ts`; `GET /health` answers 200 |
| Run the build               | `pnpm start`, which builds first                    | `$ tsc -p tsconfig.build.json`, then nothing                                                         |
| One test                    | `pnpm vitest run src/port.test.ts -t "<test name>"` | `Tests  1 passed \| 9 skipped (10)`                                                                  |
| Unit tests                  | `pnpm test`, or `pnpm test:coverage`                | `Tests  15 passed (15)`                                                                              |
| What `pre-push` runs        | `pnpm check`                                        | exits 0; the last line is `$ tsc -p tsconfig.build.json`                                             |
| Every check                 | `pnpm verify`                                       | exits 0; the last line is `$ tsc -p tsconfig.build.json`                                             |
| Render rules after a change | `pnpm rules:sync`                                   | `Synced 35 agent rule files; 0 updated.`                                                             |

## Verifying your work

- Build: `pnpm build` (prints nothing after `$ tsc -p tsconfig.build.json`)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Static checks: `pnpm verify:static` (ESLint allows zero warnings; every check must pass)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

The `verifier` subagent starts the app with `pnpm start:dev`. It exercises the changed behavior and the two nearest neighboring flows.

## Architecture

- `src/main.ts` starts `createAppServer()` from `src/server.ts` on `parsePort(process.env.PORT)`, and on `SIGTERM` or `SIGINT` stops accepting connections and closes any left after 10 seconds.
- `src/server.ts` answers `GET` and `HEAD` `/health` and returns 404 for every other request. Routes go there.

## Conventions

1. **Put tests next to the code as `src/**/*.test.ts`.** Vitest collects only that pattern.
2. **Read configuration from environment variables and fail when one is missing**, as `parsePort` does. Document each variable in `.env.example`; `pnpm start` and `pnpm start:dev` load `.env`.
3. **Start from the accepted spec, in plan mode** (Cursor: Plan Mode). Give the plan the change's `intent/<change>/intent.md` and `spec.md`. The plan, `intent/<change>/plan.md`, gets a pull request of its own, and the engineer accepts it by merging that pull request, as `playbooks/build.md` of the `sdlc-mode` skill in `plugins/sdlc/claude-code/` describes.
4. **Start a bug fix with a failing test.** A bug fix has no intent and no spec; its plan, `intent/<short-description>/plan.md`, is accepted by an engineer before any code changes. Reproduce the bug as a test, confirm it fails for the reason you expect, and commit it on a `fix/` branch. Then `.agents/hooks/agent-test-edit-gate.sh` blocks test edits by itself: make the test pass without editing it. On a branch with another name, create `.git/bug-fix-in-progress` first, and delete it once the test passes.
5. **Do not start work a person did not ask for.** When a message reports a problem without asking for work, answer in a few lines and end with the message that would start it: `/sdlc:sdlc-mode` followed by their own words.
6. **Branch from the latest `origin/main`, and open the pull request ready for review.** Name the branch `<type>/<short-description>` and fill the body from `.github/pull_request_template.md`. `.github/workflows/ci.yml` runs full verification only on a pull request that is not a draft. Never merge a pull request: a person merges it with `--squash` after code owner approval, bottom-up for a stack of pull requests.
7. **Write replies a person can check.** Write paths from the project root, such as `README.md:12`, never from the machine's root. State as a fact only what you opened or ran in this turn, and say what you ran; mark anything else as inferred or not checked. Answer what was asked and stop: leave out tools, services, and steps the request does not need, and never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.
8. **Run parallel sessions in separate worktrees, on tasks that touch different files.** Start each with `claude --worktree <name>`: a worktree is its own checkout on its own branch. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Production gate**: `.agents/hooks/agent-production-gate.sh` blocks a shell command that deploys to `prod`, runs a Railway CLI command that names `prod`, or pushes a release tag, unless a release manager started the session with `RELEASE_APPROVAL` set. Any value lifts the gate except an empty value, `0`, `false`, and `no`, in any letter case. Report what is ready to promote instead. When a gated command appears only inside a message, write the text to a file with your file-editing tool, not a shell heredoc, and pass it with `git commit -F <file>` or `gh pr create --body-file <file>`. The gate reads only shell commands, so an MCP tool or a Railway command without `-e` or `--environment` passes it.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **Sourced requirements**: add a requirement to an intent, spec, or plan only when a person decided it or a named source says it. This includes a requirement a review bot suggests. When no person decided it and no source says it, leave it out and answer the thread with that.
