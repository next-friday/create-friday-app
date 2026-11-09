# Agent guide

`@next-friday/create-app` is an ESM TypeScript CLI (`pnpm create @next-friday/app`) that generates a Next Friday project from one of the stacks in `src/stacks.ts`. It runs on Node.js `>=24.15.0`; this repository uses `.nvmrc` (24.22.1) and pnpm.

## Commands

| Task                           | Command                                                     |
| :----------------------------- | :---------------------------------------------------------- |
| Every check (pre-push runs it) | `pnpm verify`                                               |
| Tests                          | `pnpm test`, or `pnpm test:coverage`                        |
| One test                       | `pnpm vitest run test/stacks.test.ts -t "<test name>"`      |
| Lint, types, unused code       | `pnpm lint`, `pnpm typecheck`, `pnpm knip`                  |
| Build `dist/main.mjs`          | `pnpm build`                                                |
| Render agent rules             | `pnpm rules:sync`; `pnpm rules:check` fails on stale copies |
| Release note                   | `pnpm changeset` (see `.changeset/README.md`)               |

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
If a test fails, fix the code, not the test.

## Architecture

- `src/main.ts` calls `create()` in `src/create.ts`, which parses arguments (`arguments.ts`), validates the name (`project-name.ts`), copies `templates/base` and then `templates/<stack>`, replaces `next-friday-template-<stack>` with the project name in every text file (`rename.ts`), renames `_gitignore`, writes `.env` from `.env.example`, runs `git init`, and runs `pnpm install` (`setup.ts`).
- A stack is an entry in `src/stacks.ts` plus `templates/<stack>/`, whose `package.json` is named `next-friday-template-<stack>`.
- Agent rules: `.agents/rules/*.md` and `.agents/rules.json` are the source. `scripts/sync-agent-rules.ts` renders them to `.claude/rules/` and `.cursor/rules/`. The repository root has its own copy of the rules, hooks, and scripts; `templates/` is the consumer kit with a separate copy.

## Conventions

1. **Follow `.agents/rules/`.** `.agents/rules.json` gives each rule's scope; Claude Code and Cursor load them. Rules, hooks, and agent settings change as `constitution-changes.md` describes.
2. **Edit `src/`, `test/`, and `templates/`; treat `dist/` as generated.** The build overwrites `dist/`.
3. **Preserve CLI arguments, prompts, and the generated project layout** unless a major changeset declares the break. CI and agents run the CLI without prompts.
4. **A stack replaces a `base` file only when that stack needs different content.** The CLI copies the stack after `base`, so the stack's file wins. Today these replace `base`: `knip.json` in `nextjs` and `turborepo`, and `pnpm-workspace.yaml`, `.github/dependabot.yml`, and `.github/workflows/deploy.yml` in `turborepo`. When you change one of those `base` files, make the same change in each replacement.
5. **Do not link the root and `templates/` trees.** The root copies govern this repository; `templates/` ships to every generated project.
6. **Store `.gitignore` as `_gitignore` and commit no `pnpm-lock.yaml` under `templates/`.** npm drops `.gitignore` from the package and `pnpm pack` drops nested lockfiles.
7. **After changing a template, generate a project and run its `pnpm verify`.** The root lint, format, Knip, and test configs skip `templates/`.
8. **Start from the accepted spec, in plan mode.** Claude Code starts every session in plan mode (`.claude/settings.json`); in Cursor, switch to Plan Mode before the first edit. Give the plan the change's `intent/<change>/intent.md` and `spec.md`, and have it name the files that change, the order of the work, and the tests that prove it. Commit the approved plan as `intent/<change>/plan.md`. When implementation departs from the plan, update `plan.md` in the same commit.
9. **Start a bug fix with a failing test.** Reproduce the bug as a test, run it, and confirm it fails for the reason you expect. Commit that test. Then create `.git/bug-fix-in-progress`, so `.agents/hooks/agent-test-edit-gate.sh` blocks test edits, and make the test pass without editing it. Delete `.git/bug-fix-in-progress` when the fix is done.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Template rule copies**: root `pnpm rules:sync` renders only the root. A template's rendered copy lives in `templates/base` when every stack renders it the same, and in each stack otherwise (for example `deterministic-testing`, whose globs differ by stack). Run `pnpm rules:sync` in a generated project and copy the output back.
- **Node.js for payload and turborepo**: those stacks require Node.js `>=24.22.1`; `pnpm install` fails with `ERR_PNPM_UNSUPPORTED_ENGINE` on older versions.
- **Commit messages**: commitlint rejects a subject longer than 50 characters and accepts only `Co-Authored-By` trailers in the footer. Put `Closes #<issue>` in the pull request body.
- **Agent shell gate**: `.agents/hooks/agent-shell-gate.sh` blocks a shell command that writes to a protected path such as `.agents`, `.cursor`, `.claude/rules`, or `.husky`. It is a convenience, not a security boundary: CI and code-owner review are the boundary.
- **CI-only jobs**: Template, Consumer Smoke, and Compatibility run only in CI. Do not report them as local results.
- **Playbook claims**: add a requirement to an intent, spec, or plan only when the user decided it or a source says it: the playbook page, an official document, or a named community repository. This includes a requirement a review bot suggests. Quote the passage and take the page number from the PDF's page breaks. When the user did not decide it and no source says it, leave it out and answer the thread with that. On 2026-11-09 an agent cited pages one off and added a spec rule from a CodeRabbit suggestion that the playbook does not state.

## Related documentation

- [CONTRIBUTING.md](CONTRIBUTING.md): prerequisites, Git hooks, releasing, pull requests
- [README.md](README.md): CLI usage and what a generated project includes
- [.changeset/README.md](.changeset/README.md): release types and what counts as breaking
- [.cursor/BUGBOT.md](.cursor/BUGBOT.md): review rules
