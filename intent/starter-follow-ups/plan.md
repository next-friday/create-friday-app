# Plan: Make the CLI easy to start, gate on evals, route work by model, and close what earlier work left open

Accepted by: @joetakara.

This plan covers every requirement of `intent/starter-follow-ups/spec.md` in four deliveries: requirements 1 to 7, 8 to 14, 15 to 21, and 22 to 27. It is accepted by merging the pull request that adds it. Each delivery's code follows in its own pull request, and each delivery is merged and versioned before the next opens its pull request, so that no two changesets ship as one version.

## Files that change

Delivery 1. Edited by the agent:

- Each stack's `AGENTS.md` and `templates/base/SETUP.md` (changed): one production gate paragraph, with only the Railway clause in a `deploy:railway` section, and the sentence on `RELEASE_APPROVAL` that names `.agents/release-approval-form`.
- Each stack's `CONTRIBUTING.md` (changed): the sentence on promotion in a `deploy:railway` section.
- `test/create.test.ts` (changed): the case that compares the two `turbo.json` files.
- `intent/chat-reply-ux/spec.md` (changed): the WCAG criteria quoted from the standard, or the numbers removed.
- `.changeset/<name>.md` (new): `patch`.

Delivery 1. Committed by a person from a patch in an issue, because the file is in the constitution:

- `.github/workflows/ci.yml` (changed): the Template job's host check reads file names, and its message says "deploy target"; Consumer Smoke generates a project with each deploy target.

Delivery 2. Edited by the agent:

- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md` (changed): the three roles, the rule in each tool's home directory, and how to choose the session's model.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): starting a subagent on a role's model in each tool, and the fallback with no rule.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md`, `fix.md`, `review.md` (changed): the `explore` subagent, the `verifier` on the `explore` model, and the `advise` subagent at the three moments.
- `templates/base/SETUP.md` (changed): the advisor tool sentence.
- `plugins/sdlc/adapters/claude-code/evals/` (changed): the `setup-sdlc` cases' graders read the new rule's path and three roles.
- `plugins/sdlc/adapters/` and `templates/base/plugins/sdlc/` (rendered).
- `.changeset/<name>.md` (new): `minor`.

Delivery 3. Edited by the agent:

- `src/arguments.ts` (changed): `--yes` and `-y`, and the usage text.
- `src/create.ts` (changed): the defaults of the two prompts, the full questions, and `--yes`.
- `src/stacks.ts` (changed): each stack's hint.
- `test/arguments.test.ts`, `test/create.test.ts` (changed): the cases of requirements 15 to 21.
- `README.md` (changed): the quick start.
- `.changeset/<name>.md` (new): `minor`.

Delivery 4. Edited by the agent:

- `scripts/sync-plugin.ts` (changed): renders the eval cases into `templates/base/plugins/sdlc/claude-code/evals/`.
- `templates/base/plugins/sdlc/claude-code/evals/` (rendered).
- `templates/base/SETUP.md` (changed): step 8 names the workflow, the two variables, the cost, and running the suite once by hand first.
- `.changeset/<name>.md` (new): `minor`.

Delivery 4. Committed by a person from a patch in an issue:

- `templates/base/.github/workflows/plugin-evals.yml` (new): the job of requirements 23 to 26.

Each delivery ends with `Status: done.` in the intent and the spec when its last requirement is the spec's last.

## Order of work

Delivery 1:

1. On a new branch, set `Accepted by:` to the account that merged this plan's pull request. Check: `pnpm plan:check`.
2. The `turbo.json` test, which passes on today's files; then a second copy with one changed key, which fails it. Check: `pnpm vitest run test/create.test.ts`.
3. The `AGENTS.md`, `SETUP.md`, and `CONTRIBUTING.md` text. Check: generate a project of each stack with each deploy target; `grep -ri railway` finds nothing with `none`, and `grep -c "Production gate"` is 1 in each `AGENTS.md`.
4. The WCAG criteria: ask once to allow `www.w3.org` in the session's network, then quote the two criteria, or remove the numbers. Check: the spec's lines match the page, quoted.
5. The patch for the root `ci.yml`, run by hand in a generated project of each target, in an issue. Check: the commit matches the patch line for line.
6. The changeset, `pnpm verify` in the root and in ten generated projects, a review by a subagent with a fresh context, and a draft pull request that stays a draft until the person's commit is on it and the findings are fixed.

Delivery 2:

7. The `setup-sdlc` eval cases' graders, then the skill. Check: `pnpm plugin:check`; both cases run once on the small model.
8. `sdlc-mode/SKILL.md` and the three playbooks. Check: `pnpm plugin:sync`, `pnpm plugin:check`; the cases `build-plans-and-waits-for-the-engineer`, `fix-reproduces-finds-the-cause-and-waits-for-the-engineer`, and `review-reports-findings-and-never-merges` run once on the small model and on `main`'s plugin, and the scores are compared.
9. `SETUP.md`, the changeset, `pnpm verify` in the root and in ten generated projects, a review, and a draft pull request.

Delivery 3:

10. The tests of requirements 15 to 21, tests first. Check: they fail before the change and `pnpm vitest run` passes after.
11. `src/` and `README.md`. Check: `node dist/main.mjs --yes` in an empty directory creates `my-app` from Next.js; a run without a terminal and without `--yes` or a name still stops with today's message.
12. The changeset, `pnpm verify` in the root and in ten generated projects, a review, and a draft pull request.

Delivery 4:

13. The render of the eval cases. Check: `pnpm plugin:check`; a generated project holds `plugins/sdlc/claude-code/evals/`.
14. The workflow, linted with actionlint and zizmor in a generated project, and run once by hand with the same command, in an issue. Check: the commit matches the patch line for line.
15. `SETUP.md`, the changeset, `Status: done.`, `pnpm verify` in the root and in ten generated projects, a review, and a draft pull request.

## Risks

- The riskiest step is 8: a playbook that starts a subagent with a model the tool rejects stops the build. Requirement 13's fallback runs the subagent on the session's model, and the eval cases of step 8 run on both branches.
- Step 4 needs a host the session does not reach. The spec's decision removes the numbers when the host is declined.
- Step 14: a workflow that calls a model costs money on each pull request it runs on. It runs only with `CLAUDE_CI_ENABLED` set, only on a pull request that changes `plugins/sdlc/` or `.agents/`, and under `EVAL_MAX_COST_USD`.
- Steps 5 and 14 wait for a person's commit. Each pull request stays a draft until that commit is on its branch.
- Delivery 2. Departure from the first plan: the plugin's source may not name an agent tool or its folders (`plugins/sdlc/adapters/vendor-names.json`), and requirement 9 needs each tool's home-directory path. `scripts/sync-plugin.ts` therefore replaces tool words such as `{{rules-file}}` in each skill with the text in `plugins/sdlc/adapters/tool-words.json` for that tool. The eval cases cannot read a file in the run's home directory, so the `setup-sdlc` cases grade the `Write` call's path and lines instead of the file.
- Options not taken: one pull request for all four deliveries, because three `minor` changesets and a `patch` would ship as one version and a person's two commits would hold the whole; Claude Code's advisor tool as the only way to advise, because it works on two providers only and not in Cursor; a project file for the model choice, because the spec's decision keeps it per person.

## Proof

- 1, 2, 4: the review reads each generated `AGENTS.md`, `SETUP.md`, and `CONTRIBUTING.md` of both targets against the hook and the README.
- 3: the case in `test/create.test.ts`.
- 5, 6: the Template and Consumer Smoke jobs in CI, after the person's commit.
- 7: the spec's lines and the quoted page, or the removal, read in review.
- 8–10, 13, 14: the graders of the two `setup-sdlc` eval cases, and the review of `SKILL.md` and `SETUP.md`.
- 11, 12: the three eval cases of step 8, compared with `main`'s plugin.
- 15–21: the cases in `test/arguments.test.ts` and `test/create.test.ts`.
- 22: `pnpm plugin:check`, and a generated project that holds the cases.
- 23–26: actionlint and zizmor in a generated project, and one run by hand of the workflow's command.
- 27: the review reads `SETUP.md` step 8.
- 28: `pnpm plugin:check`.
- 29: steps 6, 9, 12, and 15, and the Template job in CI.
- 30: `pnpm changesets:check`.
