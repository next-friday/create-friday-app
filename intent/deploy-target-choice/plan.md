# Plan: Choose where the project deploys

Accepted by: @<engineer>.

This plan covers every requirement of `intent/deploy-target-choice/spec.md` in one delivery. It is accepted by merging the pull request that adds it, and its code follows in a second pull request.

## Files that change

Edited by the agent:

- `src/deploy-targets.ts` (new): the targets `none` and `railway`, and `isDeployTarget`, shaped as `src/stacks.ts` is.
- `src/arguments.ts` (changed): parses `--deploy`, defaults to `none`, rejects any other value before a file is written, and lists the argument in `usage`.
- `src/deploy-sections.ts` (new): keeps the lines between a marker for the chosen target and its end marker, removes the lines between a marker for another target and its end marker, removes every marker line, and stops with an error when a section has no end marker.
- `src/create.ts` (changed): `copyTemplate` copies `base`, then the stack, then `deploy-<target>/base` and `deploy-<target>/<stack>` for a target other than `none`, and then resolves the marked sections. The path comes from the validated target.
- `test/arguments.test.ts` and `test/create.test.ts` (changed), `test/deploy-sections.test.ts` (new).
- `templates/deploy-railway/base/` (new): `railway.json` and `runbooks/rollback-deploy.md`, moved from `templates/base/`.
- `templates/deploy-railway/turborepo/turbo.json` (new): the stack's `turbo.json` with `railway.json` in `globalDependencies`. `templates/turborepo/turbo.json` loses that entry.
- `README.md` and `AGENTS.md` of each of the five stacks, and `templates/base/SETUP.md` (changed): a section for `railway` and a section for `none`.
- The six `Dockerfile` files (changed): the comment that lists platforms names no host.
- The root `AGENTS.md` (changed): the Architecture line for the deploy layer, and the sentence that a file with marked sections is edited under `templates/` and is not copied back.
- The root `README.md` (changed): `--deploy` and its targets.
- `.changeset/<name>.md` (new): `minor`.
- `intent/deploy-target-choice/spec.md` and `intent.md` (changed): `Status: done.` when the last requirement is met.

Committed by a person from a patch in an issue, because the files are in the constitution:

- `templates/base/.github/workflows/deploy.yml` and `templates/turborepo/.github/workflows/deploy.yml` (moved) to `templates/deploy-railway/base/` and `templates/deploy-railway/turborepo/`.
- `.github/workflows/ci.yml` of each of the five stacks (changed): a `railway` section around the `deploy-dev` job, and `vars.CONTAINER_IMAGE != 'false'` joined to the `image` job's condition.
- `templates/base/.agents/hooks/agent-production-gate.sh` (changed): a `railway` section around the Railway pattern and its check.
- `templates/base/scripts/check-agent-gates.ts` (changed): a `railway` section around the Railway cases.
- The root `.github/workflows/ci.yml` (changed): the Template job generates and verifies each stack with each target.

## Order of work

1. On a new branch, set `Accepted by:` to the account that merged this plan's pull request. Check: `pnpm plan:check`.
2. `deploy-targets.ts`, `arguments.ts`, and their tests, tests first. Check: `pnpm vitest run test/arguments.test.ts`.
3. `deploy-sections.ts` and its tests, tests first. Check: `pnpm vitest run test/deploy-sections.test.ts`.
4. `create.ts` and the template layer: move `railway.json` and the runbook, and split `turbo.json`. Check: `pnpm vitest run test/create.test.ts`.
5. The sections in each `README.md` and `AGENTS.md` and in `SETUP.md`, and the `Dockerfile` comments. Check: generate `nestjs` with each target; `grep -ri railway` in the `none` project finds only the files that wait for step 6.
6. The patch for the constitution files, linted, formatted, and tested in a generated project of each target, in an issue. Check: the commit on the branch matches the patch line for line.
7. The root `AGENTS.md` and `README.md`, and the changeset. Check: `pnpm changesets:check`.
8. Generate the ten projects, one at a time, and run `pnpm verify` in each. Check: ten passes, and `grep -ri railway` finds nothing in the five `none` projects.
9. `Status: done.`, `pnpm verify` in the root, the verifier, and a pull request that stays a draft until every file of step 6 is on the branch and the review's findings are fixed.

## Risks

- The riskiest step is 6: a wrong section in the hook or in `ci.yml` breaks the shell script or the YAML of every generated project. `pnpm gates:check` and actionlint run in a project of each target before the patch goes into the issue.
- A marker that reaches a generated project. A test checks that no generated file holds `deploy:`.
- A team that uses Railway and runs `--stack <stack>` alone no longer gets the Railway files. The changeset and the root `README.md` say so.
- Between step 5 and the commit of step 6 the branch generates a project that is not whole. The pull request stays a draft until then.
- Options not taken: a whole copy of each shared file in the Railway layer, because the copies would drift; one pull request for `src/` and one for `templates/`, because markers would reach a generated project in between; a prompt for the deploy target, because the intent rules it out; a second host, because the intent names one.

## Proof

- 1–5, 14: with the security policy's `v5.0.0-2.2.1` and `v5.0.0-5.3.2`, `test/arguments.test.ts` for the default, the accepted values, the rejection message, the usage text, and the unchanged arguments; `test/create.test.ts` for a value outside the list, which writes no file.
- 6, 7, 9: `test/create.test.ts` for the files of each target, and step 8.
- 8, 12, 15: the review reads the `README.md`, `AGENTS.md`, and `SETUP.md` of a project of each target, and searches for "deploy target".
- 10: actionlint in a generated project, and the review reads the conditions of the `image` job and the `ci` job.
- 11: `pnpm gates:check` in a project of each target.
- 13: step 8, and the Template job in CI.
- 16: `pnpm changesets:check`.
