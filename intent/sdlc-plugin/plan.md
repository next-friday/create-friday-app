# Plan: Ship the SDLC playbook as the `friday` plugin (from intent.md 2026-11-12)

Accepted by: @joetakara.

The work lands as three pull requests, in this order. Each one leaves `main` working. The release that carries the change to generated projects comes after the third.

This plan departs from the spec in two places. The first is by the engineer's decision: `claude plugin eval` runs the eval cases, and `run-agent-evals.ts` is deleted. The same commit changes requirements 1, 20, and 21 of `spec.md` to say so. The second: a **Gate** step keeps its words except the path of a playbook and the name of the command, which the move changes, and requirement 15 of `spec.md` says so.

The product owner added one requirement while this plan was written, and the same commit adds it to `spec.md` as requirement 27: a reply gives the full URL of each pull request, issue, branch, workflow run, and file on the host that it names, and its **Status** line gives the URL of the page where the person acts next.

## Files that change

Pull request 1, the plugin and this repository's use of it:

| File                                                                                | Change  | Afterwards                                                                                                                                                                                                                                                                                                                          |
| :---------------------------------------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/friday/source/skills/sdlc/`, `sdlc-help/`, `<area>-policy/`                | new     | The skills moved from `.agents/skills/`. The playbooks carry the five conventions of requirement 12 and read a project's own policy file first.                                                                                                                                                                                     |
| `plugins/friday/source/agents/verifier.md`, `agents.json`                           | new     | The subagent moved from `.agents/agents/`.                                                                                                                                                                                                                                                                                          |
| `plugins/friday/source/evals/<skill>/<case>/`                                       | new     | The cases moved from `.agents/skill-evals/`. Each `checks:` entry becomes the official grader that decides it: `regex`, `file_exists`, or `tool_used`. Each machine fixture becomes a `context.scaffold_script`. A check of which files a commit touches has no official grader and is dropped. One new case covers requirement 27. |
| `plugins/friday/source/scripts/check-plan.ts`, `check-bands.ts`, `measure-loop.ts`  | new     | The scripts moved from `scripts/`.                                                                                                                                                                                                                                                                                                  |
| `plugins/friday/adapters/vendor-names.json`                                         | new     | The list of model and tool names that requirement 3 forbids in the source.                                                                                                                                                                                                                                                          |
| `plugins/friday/adapters/claude-code/`, `plugins/friday/adapters/cursor/`           | new     | Rendered: skills, subagent, eval cases, and the tool's manifest with `"name": "friday"`.                                                                                                                                                                                                                                            |
| `plugins/friday/package.json`, `tsdown.config.ts`, `README.md`, `LICENSE`           | new     | The npm package `@next-friday/sdlc`. Its three commands are `sdlc-plan-check`, `sdlc-bands-check`, and `sdlc-loop-measure`, built from the scripts.                                                                                                                                                                                 |
| `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`                | new     | Each names the marketplace `next-friday` and lists `friday` with the path of that tool's adapter.                                                                                                                                                                                                                                   |
| `scripts/sync-plugin.ts`                                                            | new     | Renders the adapters. With `--check` it fails on a stale adapter, on a reference out of `plugins/friday/`, and on a forbidden name. It has self-tests.                                                                                                                                                                              |
| `.agents/skills/`, `.agents/agents/`, `.agents/agents.json`, `.agents/skill-evals/` | deleted | Moved into the plugin.                                                                                                                                                                                                                                                                                                              |
| `.claude/skills/`, `.claude/agents/`, `.cursor/skills/`, `.cursor/agents/`          | deleted | The rendered copies go with their sources.                                                                                                                                                                                                                                                                                          |
| `scripts/check-plan.ts`, `check-bands.ts`, `measure-loop.ts`, `run-agent-evals.ts`  | deleted | Three moved into the plugin; `claude plugin eval` replaces the fourth.                                                                                                                                                                                                                                                              |
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore`                | changed | The repository is a workspace of two packages. The script entries point at the plugin, `evals:run` is `claude plugin eval`, and `verify` runs `plugin:check`. The lint scripts ignore `plugins/friday/dist/`, and `check:publint` checks both packages. `knip.json` stays as it is.                                                 |
| `.claude/settings.json`                                                             | changed | Names this tree as the marketplace and enables `friday@next-friday`. A person commits it.                                                                                                                                                                                                                                           |
| `.github/workflows/release.yml`                                                     | changed | Publishes whichever of the two packages has a release, each with its own changelog and tag. A person commits it.                                                                                                                                                                                                                    |
| `AGENTS.md`                                                                         | changed | Loses conventions 7, 8, 9, and 11, and the part of 10 that repeats `open-pr.md`. Gains one convention that names `/friday:sdlc`.                                                                                                                                                                                                    |
| `.github/CODEOWNERS`                                                                | changed | The six lines for skill folders become lines for `/plugins/friday/`.                                                                                                                                                                                                                                                                |
| `.agents/review.md`, `REVIEW.md`, `intent/README.md`, `CONTRIBUTING.md`             | changed | Name the plugin's skill and the policies in force.                                                                                                                                                                                                                                                                                  |
| `scripts/check-changesets.ts`, `.changeset/README.md`                               | changed | The check compares each package's changesets with the files that package publishes, and its fixtures name paths that exist.                                                                                                                                                                                                         |
| `intent/sdlc-plugin/spec.md`                                                        | changed | `Status: accepted.`, and requirements 1, 20, 21, and 27 as this plan says.                                                                                                                                                                                                                                                          |
| `.changeset/sdlc-package.md`                                                        | new     | A changeset for `@next-friday/sdlc` only, so this pull request releases no new version of the CLI.                                                                                                                                                                                                                                  |

Pull request 2, generated projects:

| File                                                                                               | Change  | Afterwards                                                                                                                           |
| :------------------------------------------------------------------------------------------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| `templates/base/.agents/skills/`, `.agents/agents/`, `.agents/agents.json`, `.agents/skill-evals/` | deleted | A generated project holds no copy.                                                                                                   |
| `templates/base/.claude/skills/`, `.claude/agents/`, `.cursor/skills/`, `.cursor/agents/`          | deleted | The rendered copies go with their sources.                                                                                           |
| `templates/<stack>/.agents/agents/`, and its rendered copies                                       | deleted | The stacks that replace the verifier keep their text as a project file the plugin's verifier reads, `.agents/verifier.md`.           |
| `templates/base/scripts/check-plan.ts`, `check-bands.ts`, `measure-loop.ts`, `run-agent-evals.ts`  | deleted | The commands come from `@next-friday/sdlc`.                                                                                          |
| `templates/<stack>/package.json`, `knip.json`                                                      | changed | `@next-friday/sdlc` is a development dependency. `plan:check`, `bands:check`, and `loop:measure` run its commands. `evals:run` goes. |
| `templates/base/.claude/settings.json`                                                             | changed | Names the marketplace with `"autoUpdate": true` and enables `friday@next-friday`. A person commits it.                               |
| `templates/<stack>/AGENTS.md`                                                                      | changed | Loses the four conventions that repeat a playbook. Gains the one that names `/friday:sdlc`.                                          |
| `templates/base/.github/workflows/control-band.yml`, `spec-on-intent-merge.yml`, `agent-evals.yml` | changed | The first two load the plugin and send `/friday:sdlc`. The third is deleted with `evals:run`.                                        |
| `templates/base/.agents/review.md`, `templates/payload/`, `templates/turborepo/`, each `REVIEW.md` | changed | Name the policies in force.                                                                                                          |
| `templates/base/intent/README.md`, `templates/base/SETUP.md`, `templates/<stack>/CONTRIBUTING.md`  | changed | Name the plugin's skill. `SETUP.md` gains the install step, the missing-plugin message, and the update rule.                         |
| `.changeset/sdlc-plugin.md`                                                                        | new     | Minor, for the CLI: what a generated project no longer holds and what it gains.                                                      |

Pull request 3, setup and the move of older projects:

| File                                               | Change  | Afterwards                                                                     |
| :------------------------------------------------- | :------ | :----------------------------------------------------------------------------- |
| `plugins/friday/source/skills/setup-sdlc/SKILL.md` | new     | The four steps of requirement 17.                                              |
| `plugins/friday/source/skills/sdlc/SKILL.md`       | changed | Reads `.agents/sdlc-models.md` and starts the verifier on the model it names.  |
| `plugins/friday/source/evals/setup-sdlc/`, `sdlc/` | new     | Cases for requirement 17, step 4, and for requirement 18.                      |
| `plugins/friday/adapters/`                         | changed | Rendered again.                                                                |
| `templates/base/SETUP.md`                          | changed | Names `/friday:setup-sdlc`.                                                    |
| `.changeset/sdlc-plugin.md`                        | changed | Gains the steps an agent follows to move a project that was generated earlier. |
| `intent/sdlc-plugin/intent.md`, `spec.md`          | changed | `Status: done.`, in the commit that meets the last requirement.                |

## Order of work

Pull request 1:

1. Commit this plan with the engineer's handle, the spec's new status, and requirements 1, 20, and 21. Check: `pnpm plan:check` exits 0.
2. Move the skills, the subagent, the eval cases, and the three scripts into `plugins/friday/source/` with `git mv`, and point `package.json` at the scripts. Check: `pnpm plan:check` and `pnpm bands:check` exit 0.
3. Write `scripts/sync-plugin.ts` with its self-tests, `vendor-names.json`, and the two manifests. Remove from the source every name the list holds. Run `pnpm plugin:sync`. Check: `pnpm plugin:check` exits 0, and it exits 1 after a hand edit to an adapter, after a `../../` link in the source, and after a listed name in the source.
4. Move the five conventions into the playbooks and replace each "as `AGENTS.md` says" with the text. Add the URL rule of requirement 27 to the reply shape in the `sdlc` skill, with one eval case. Change `design.md`, `build.md`, and `review.md` to read a project's policy file first. Check: `git grep -n "AGENTS.md" plugins/friday/source/skills` names no convention by its heading.
5. Add the two marketplace files. Check: `claude plugin validate plugins/friday/adapters/claude-code` and `claude plugin validate .` pass.
6. Convert the eval cases to graders the official runner reads, and delete `run-agent-evals.ts`. Check: every case loads, and `claude plugin eval plugins/friday/adapters/claude-code --scaffold --runs 1 --case <name>` with the small model runs one question case and one build case; report the scores with and without the plugin.
7. Prove requirement 7 before any copy is deleted: in a scratch project, `claude --plugin-dir plugins/friday/adapters/claude-code -p "/friday:sdlc <question>"` answers in the reply shape and changes no file.
8. Delete the root's copies. Change `AGENTS.md`, `CODEOWNERS`, `.agents/review.md`, `intent/README.md`, `CONTRIBUTING.md`, and the `check-changesets.ts` fixtures. Check: `pnpm rules:check` exits 0, and `git grep -n "\.agents/skills/sdlc"` finds nothing outside `intent/` and `CHANGELOG.md`.
9. Make `plugins/friday` a package: `package.json`, the build, the workspace entry, `knip.json`, and `tsconfig.json`. Check: `pnpm --filter @next-friday/sdlc build`, then `node plugins/friday/dist/check-plan.mjs` exits 0, and `pnpm --filter @next-friday/sdlc exec publint` passes.
10. A person commits `.claude/settings.json` and `.github/workflows/release.yml` on the branch, from an issue that carries the exact text. Check: in a new session on the branch, `/friday:sdlc` is listed.
11. Add the changeset for `@next-friday/sdlc`. Check: `pnpm exec changeset status` lists that package and not the CLI. Then `pnpm verify` exits 0.

After pull request 1 merges, the release publishes `@next-friday/sdlc`. The CLI's version does not change.

Pull request 2:

12. Delete the template copies, change each stack's `package.json` and `knip.json`, and move each stack's verifier text to `.agents/verifier.md`. Check: generate each of the five stacks and run its `pnpm verify`.
13. Change the template `AGENTS.md` files, the two workflows, `review.md`, `intent/README.md`, `SETUP.md`, and `CONTRIBUTING.md`, and delete `agent-evals.yml`. Check: actionlint and `zizmor --persona pedantic --offline` on a generated `nodejs` and `turborepo` project, and `git grep -n "/sdlc\b" templates` finds only `/friday:sdlc`.
14. A person commits `templates/base/.claude/settings.json`. Check: in a generated project with the plugin installed from the marketplace, `claude -p "/friday:sdlc <question>"` answers.
15. A person installs the Cursor adapter in Cursor and runs the `sdlc` skill once. Check: the reply follows the reply shape. The result goes in the pull request.
16. Add the changeset for the CLI. Check: `pnpm verify` exits 0.

Pull request 3:

17. Write `setup-sdlc` with `skill-creator`, its eval cases, and the change to the `sdlc` skill. Check: `claude plugin eval` on the new cases, and a second run of `setup-sdlc` with the same answers leaves `git status` clean.
18. Add the move steps to the changeset, and follow them once on a project generated from 9.2.0. Check: that project's `pnpm verify` exits 0 and `/friday:sdlc` answers in it.
19. Check each of the 26 requirements against the tree, then set `Status: done.` in `intent.md` and `spec.md`. Check: `pnpm verify` exits 0.

## Risks

- **What could break.** A session in this repository or in a generated project has no `sdlc` skill until the plugin is installed. Step 10 and step 14 are where that shows.
- **The riskiest step is 10.** Two files a person commits must land on the branch before it merges. Without `.claude/settings.json` the repository loses its own loop, and without the change to `release.yml` the release fails on two packages.
- **Step 12 needs `@next-friday/sdlc` on npm.** A generated project cannot install before the release that follows pull request 1.
- **A plugin change reaches every project at once**, as the spec's area of concern 4 says. Step 6 puts the eval cases in front of every such change.
- **The official eval runner costs model calls**: each case runs with the plugin and again without it. The plan runs it by hand, with `--runs 1` and the small model, and in no workflow. `pnpm evals:run` grants no tool beyond the read-only set, so a case that must write or commit needs `--allow-tools` and a sandbox to pass in full.
- **The Cursor adapter is proved by a person, once** (step 15). The render script checks only its shape against `pstack`.
- Options not taken:
  - Keeping `run-agent-evals.ts`. The official runner reads the same case layout and adds the comparison without the plugin.
  - Shipping the scripts inside `@next-friday/create-app`. The scripts would sit outside the plugin directory and would not move with it.
  - One pull request. A change of this size is hard to review and waits as a whole on its slowest part.
  - Leaving the Cursor adapter for later. The spec asks for both tools from one source.
  - Changing `scripts/sync-agent-rules.ts`. It already renders nothing when `.agents/skills/` holds no file, and it still renders a project's own policy skill.

## Proof

- Requirements 1, 2, 3, 4, 5: `pnpm plugin:check` and its self-tests, with the three failing cases of step 3.
- Requirement 6: `claude plugin validate .` and the two marketplace files.
- Requirement 7: the runs of step 7 and step 14, with the reply and `git status`.
- Requirement 8: both manifests hold no `version` key, checked by `pnpm plugin:check`, and the template settings hold `"autoUpdate": true`.
- Requirements 9, 16: in each generated stack, `git ls-files` lists no moved file, and `git grep` finds no path under `.agents/skills/sdlc/`.
- Requirement 10: `templates/base/.claude/settings.json` holds both keys, and the run of step 14.
- Requirement 11: an eval case with a project policy file and one without.
- Requirements 12, 13, 14, 15: the `git grep` of step 4, the `AGENTS.md` files, and a diff of each **Gate** step before and after the move, which shows only a playbook path and the command name.
- Requirements 17, 18: the eval cases and the second run of step 17.
- Requirement 19: `templates/base/SETUP.md` holds the install command, the message, and the update rule, which meets `v5.0.0-15.1.1` and `v5.0.0-15.2.1`.
- Requirement 20: each generated stack's `pnpm verify` runs `plan:check` and `bands:check` from `@next-friday/sdlc` with no agent tool installed.
- Requirement 21: `git ls-files` lists no `run-agent-evals.ts`, and the scores of step 6.
- Requirement 22: the two workflows send `/friday:sdlc`, with actionlint and zizmor clean.
- Requirement 23: `git ls-files` lists the skills, the subagent, the eval cases, and the scripts only under `plugins/friday/`.
- Requirement 24: `.github/CODEOWNERS`.
- Requirements 25, 26: the changeset, and the run of step 18.
- Requirement 27: an eval case whose reply names a pull request, graded by a `regex` grader for its full URL in the reply and in the **Status** line.
- Brand policy, rules 2 and 3: the name `friday` is in the two manifests, and the spec's area of concern 3 records the product owner's decision.
