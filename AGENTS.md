# Agent guide

`@next-friday/create-app` is an ESM TypeScript CLI (`pnpm create @next-friday/app`) that generates a Next Friday project from one of the stacks in `src/stacks.ts`. It runs on Node.js `>=24.15.0`; this repository uses `.nvmrc` and pnpm.

## Commands

| Task                           | Command                                                     |
| :----------------------------- | :---------------------------------------------------------- |
| Every check (pre-push runs it) | `pnpm verify`                                               |
| Tests                          | `pnpm test`, or `pnpm test:coverage`                        |
| One test                       | `pnpm vitest run test/stacks.test.ts -t "<test name>"`      |
| Lint, types, unused code       | `pnpm lint`, `pnpm typecheck`, `pnpm knip`                  |
| Build `dist/main.mjs`          | `pnpm build`                                                |
| Render agent rules             | `pnpm rules:sync`; `pnpm rules:check` fails on stale copies |
| Release note, when one is due  | `pnpm changeset` (see `.changeset/README.md`)               |

Check a template by generating a project under the template's own package name, so the rename changes nothing and edited files copy back as they are:

```sh
pnpm build
dir="$(mktemp -d)"
(cd "$dir" && node "$OLDPWD/dist/main.mjs" next-friday-template-nestjs --stack nestjs < /dev/null)
cd "$dir/next-friday-template-nestjs" && git add --all && pnpm verify
```

## Verifying your work

- Build: `pnpm build` (its last line starts with `✔ Build complete`)
- Test: `pnpm test:coverage` (all green, then the coverage summary; never skip or delete a failing test)
- Lint: `pnpm lint:check` (prints nothing after `$ eslint . --cache --max-warnings=0 --no-inline-config`)

Run all three before reporting any task complete, and paste the output. `pnpm verify` runs all three.

## Architecture

- `src/main.ts` calls `create()` in `src/create.ts`, which copies `templates/base`, then `templates/<stack>`, renames the project, and installs.
- A stack is an entry in `src/stacks.ts` plus `templates/<stack>/`, whose `package.json` is named `next-friday-template-<stack>`.
- Agent rules: `.agents/rules/*.md` and `.agents/rules.json` are the source; `pnpm rules:sync` renders them.

## Conventions

1. **Edit `src/`, `test/`, and `templates/`; never edit generated `dist/`.**
2. **Preserve CLI arguments, prompts, and stack names** unless a major changeset declares the break. `.changeset/README.md` says when a change needs a changeset.
3. **A stack replaces a `base` file only when that stack needs different content.** Today these replace `base`: `knip.json` in `nextjs` and `turborepo`, and `pnpm-workspace.yaml`, `.github/dependabot.yml`, and `.github/workflows/deploy.yml` in `turborepo`. When you change one of those `base` files, make the same change in each replacement.
4. **Do not link the root and `templates/` trees.** The root copies govern this repository; `templates/` ships to every generated project.
5. **Store `.gitignore` as `_gitignore` and commit no `pnpm-lock.yaml` under `templates/`.**
6. **After changing a template, generate a project and run its `pnpm verify`.**
7. **Start from the accepted spec, in plan mode** (Cursor: Plan Mode). Give the plan the change's `intent/<change>/intent.md` and `spec.md`. Commit the approved plan as `intent/<change>/plan.md` with an `Accepted by:` line naming the engineer, as `.agents/skills/sdlc/playbooks/build.md` describes.
8. **Start a bug fix with a failing test.** Reproduce the bug as a test, confirm it fails for the reason you expect, and commit it. Then create `.git/bug-fix-in-progress`, so `.agents/hooks/agent-test-edit-gate.sh` blocks test edits, make the test pass without editing it, and delete `.git/bug-fix-in-progress`.
9. **Do not start work a person did not ask for.** When a message reports a problem without asking for work, answer in a few lines and end with the message that would start it: `/sdlc` followed by their own words.
10. **Branch from the latest `origin/main`, and open the pull request ready for review.** Name the branch `<type>/<short-description>` and fill the body from `.github/pull_request_template.md`. Never merge a pull request: a person merges it with `--squash` after code owner approval, bottom-up for a stack of pull requests. In a session on this repository, its skills and playbooks decide how branches, commits, and pull requests are made, over a skill from another checkout.
11. **Write replies a person can check.** Reply in the language the person wrote in. Write paths from the project root, such as `README.md:12`, never from the machine's root. State as a fact only what you opened or ran in this turn, and say what you ran; mark anything else as inferred or not checked. Answer what was asked and stop: leave out tools, services, and steps the request does not need, and never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Template rule copies**: root `pnpm rules:sync` renders only the root. A template's rendered copy lives in `templates/base` when every stack renders it the same, and in each stack otherwise (for example `deterministic-testing`, whose globs differ by stack). Run `pnpm rules:sync` in a generated project and copy the output back.
- **Commit messages**: commitlint accepts only `Co-Authored-By` trailers.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **Testing a skill**: test a skill with Claude Code itself, in a generated project: `claude -p "/sdlc <request>" --model <small model> --strict-mcp-config`.
- **Accepted is not built**: a spec with `Status: accepted.` is not built. Check each requirement against the tree before you call a change done.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, session note, or list of what was left undone into a file, a commit message, or a pull request.
- **CI-only jobs**: Template, Consumer Smoke, and Compatibility run only in CI. Do not report them as local results.
- **Playbook claims**: add a requirement to an intent, spec, or plan only when the user decided it or a source says it: the playbook page, an official document, or a named community repository. This includes a requirement a review bot suggests. Quote the passage with its page number from the PDF's page breaks. When the user did not decide it and no source says it, leave it out and answer the thread with that.
