# Agent guide

`@next-friday/create-app` is an ESM TypeScript CLI (`pnpm create @next-friday/app`) that generates a Next Friday project from one of the stacks in `src/stacks.ts`. It runs on Node.js `>=24.15.0`; this repository uses `.nvmrc` and pnpm.

## Commands

| Task                           | Command                                                     |
| :----------------------------- | :---------------------------------------------------------- |
| Every check (pre-push runs it) | `pnpm verify`                                               |
| Tests                          | `pnpm test`, or `pnpm test:coverage`                        |
| One test                       | `pnpm vitest run test/stacks.test.ts -t "<test name>"`      |
| Lint, types, unused code       | `pnpm lint:check`, `pnpm typecheck`, `pnpm knip`            |
| Build `dist/main.mjs`          | `pnpm build`                                                |
| Render agent rules             | `pnpm rules:sync`; `pnpm rules:check` fails on stale copies |
| Render the plugin adapters     | `pnpm plugin:sync`; `pnpm plugin:check` fails on stale ones |
| Release note, when one is due  | `pnpm changeset` (see `.changeset/README.md`)               |

Check a template by generating a project under the template's own package name, so the rename changes nothing and edited files copy back as they are. A file with a `deploy:<target>` section is the exception: the CLI removes the markers, so edit it under `templates/` and do not copy it back. Add `--deploy railway` to check the files of that deploy target:

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

- `src/main.ts` calls `create()` in `src/create.ts`, which copies `templates/base`, then `templates/<stack>`, then, for `--deploy <target>` other than `none`, `templates/deploy-<target>/base` and `templates/deploy-<target>/<stack>`. It then keeps the `deploy:<target>` sections of the chosen deploy target (`src/deploy-sections.ts`), renames the project, and installs.
- A stack is an entry in `src/stacks.ts` plus `templates/<stack>/`, whose `package.json` is named `next-friday-template-<stack>`.
- Agent rules, `review.md`, and `mcp.json`: the files under `.agents/` are the source; `pnpm rules:sync` renders them into `.claude/`, `.cursor/`, `REVIEW.md`, and the MCP configs. Never edit a rendered copy.
- The `sdlc` plugin: `plugins/sdlc/source/` holds the skills, the subagent's text, and the scripts behind `plan:check`, `bands:check`, and `loop:measure`; `pnpm plugin:sync` renders them into `plugins/sdlc/adapters/`, where `agents.json` holds each tool's subagent fields and `claude-code/evals/` holds the eval cases. For generated projects it also renders the adapters without `claude-code/evals/` into `templates/base/plugins/sdlc/`, with `templates/base/.claude-plugin/marketplace.json` and the three scripts in `templates/base/scripts/`. Never edit a rendered adapter file; the eval cases and `agents.json` are authored there. A session in this repository loads the plugin from this tree once its folder is trusted: `.claude/settings.json` registers the tree as a local `directory` marketplace, which needs no `claude plugin install` ([Claude Code: Plugins for an organization](https://code.claude.com/docs/en/plugins/org.md)).

## Conventions

1. **Edit `src/`, `test/`, and `templates/`; never edit generated `dist/`.**
2. **Preserve CLI arguments, prompts, and stack names** unless a major changeset declares the break. `.changeset/README.md` says when a change needs a changeset.
3. **A stack replaces a `base` file only when that stack needs different content.** Today these replace `base`: `knip.json`, `pnpm-workspace.yaml`, and `.github/dependabot.yml` in `turborepo`, `.github/workflows/deploy.yml` in `templates/deploy-railway/turborepo`, which replaces the one in `templates/deploy-railway/base`, and `.agents/review.md` with its rendered `REVIEW.md` in `payload` and `turborepo`. A deploy layer replaces a stack's file the same way: `templates/deploy-railway/turborepo/turbo.json` replaces `templates/turborepo/turbo.json`, because JSON holds no marker comment. When you change one of those `base` files, make the same change in each replacement.
4. **Do not link the root and `templates/` trees.** The root copies govern this repository; `templates/` ships to every generated project. One exception: `pnpm plugin:sync` renders the plugin copy under `templates/base/plugins/sdlc/` and `templates/base/.claude-plugin/`, and the three scripts `check-plan.ts`, `check-bands.ts`, and `measure-loop.ts` in `templates/base/scripts/`, from `plugins/sdlc/source/`; `pnpm plugin:check` fails when one differs.
5. **Store `.gitignore` as `_gitignore` and commit no `pnpm-lock.yaml` under `templates/`.**
6. **After changing a template, generate a project and run its `pnpm verify`.**
7. **Work runs through `/sdlc:sdlc-mode`.** The `sdlc` plugin in `plugins/sdlc/` holds the skills, playbooks, and checks that say when work starts, where it stops for a person, and how a reply is written.
8. **This repository's skills and playbooks decide how branches, commits, and pull requests are made,** over a skill from another checkout.
9. **Run parallel sessions in separate worktrees, on tasks that touch different files.** Start each with `claude --worktree <name>`: a worktree is its own checkout on its own branch. Tasks that share files run in one session, one after another. Start with two or three sessions, and add one only while you can review every stream properly.

## Things Claude gets wrong

When Claude makes a mistake twice, add the correction here.

- **Template rule copies**: root `pnpm rules:sync` renders only the root. A template's rendered copy lives in `templates/base` when every stack renders it the same, and in each stack otherwise (for example `deterministic-testing`, whose globs differ by stack). Run `pnpm rules:sync` in a generated project and copy the output back with your file-editing tool, because the shell gate blocks `cp` and `rsync` into `.agents`, `.claude/rules`, and `.cursor` paths.
- **Commit messages**: commitlint accepts only `Co-Authored-By` trailers.
- **Issues**: open an issue only to hand work to another person, never to give a pull request a number to close. A pull request closes an issue that already exists with `Closes #<issue>`.
- **Testing a skill**: test a skill with Claude Code itself, in a scratch project: `claude --plugin-dir plugins/sdlc/adapters/claude-code -p "/sdlc:sdlc-mode <request>" --model <small model> --strict-mcp-config`. After you change `AGENTS.md`, a skill, or a hook, run `pnpm evals:run` and `pnpm evals:run:write` (they use your own Claude login; `plugins/sdlc/README.md` says which cases each runs) and report their scores.
- **Accepted is not built**: a spec with `Status: accepted.` is not built. Check each requirement against the tree before you call a change done.
- **What belongs in the repository**: files, commit messages, and pull requests hold the change, its reason, and the checks. Write no date, log, history, mistake count, token figure, or session note into a file.
- **CI-only jobs**: Template, Consumer Smoke, Compatibility, Dependency Audit, and Release Integrity run only in CI, as do the scorecard, secret-scan, zizmor, and dependency-review workflows. Do not report them as local results.
- **npm is production**: a changeset, a new package, and a change to `release.yml` each put something on npm, and a published version stays there. Before you open such a pull request, tell the user what it publishes: the package's name and its version. Add no package the user did not order.
- **Every stack**: after a change under `templates/`, run `pnpm verify` in a generated project of each stack in `src/stacks.ts`, because CI runs all of them.
- **Playbook claims**: add a requirement to an intent, spec, or plan only when the user decided it or a source says it: an official document or a named community repository. This includes a requirement a review bot suggests. Quote the passage and say where it is. When the user did not decide it and no source says it, leave it out and answer the thread with that.
