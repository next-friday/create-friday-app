# Plan: Record who approved at every gate, delivery 1

Accepted by: @joetakara.

This plan covers requirements 1 to 10 and 22 to 24 of `intent/approval-evidence/spec.md`. Requirements 11 to 21 get their own plan in this file when their delivery starts. The plan is accepted by merging the pull request that holds it, and the code follows in a second pull request.

## Files that change

Edited by the agent:

- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` (changed): step 5 commits and pushes the draft plan and opens a pull request that holds only files under `intent/`; step 6, the gate, is the engineer's merge of it; step 7 starts the build on a new branch whose first commit copies `Accepted by:`, and `Also accepted by:` when the plan's pull request has a second approving review, from the host.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): steps 5 to 7, the same, and a merged fix plan starts at step 7.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): the `Skills at <hash>.` ending of the `Request:` line; a `Decision:` line with the agent's proposal under each area of concern; the gate says that the product owner or the policy owner corrects each decision before merging.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/plan.md` (changed): the author is the originator's handle, asked for when it cannot be read; the template's line is `Author: @<handle> (<team>). Status: draft.`; when another person merges, the originator is the pull request's author or approves it.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the row for a build names the merged plan.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed): fails a branch that changes a file outside `intent/` and adds a `plan.md`; fails a `spec.md` the branch adds or changes when a numbered area of concern has no `Decision:` line; fails an `intent.md` the branch adds when its `Author:` line holds no handle; with `GH_TOKEN`, reads who merged the pull request that last changed the plan, and its reviews, with the host's `gh` tool, fails a different `Accepted by:` or `Also accepted by:` handle, and stops with the tool's error when the host cannot be read; without it, prints that the handle was not checked; self-test cases for each rule.
- `plugins/sdlc/adapters/claude-code/`, `plugins/sdlc/adapters/cursor/`, `templates/base/plugins/sdlc/`, and `templates/base/scripts/check-plan.ts` (changed): rendered by `pnpm plugin:sync`.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/` (changed): `build-plans-and-waits-for-the-engineer`, `build-continues-from-an-accepted-plan`, `fix-reproduces-finds-the-cause-and-waits-for-the-engineer`, `drafts-intent-and-waits-for-yes`, and `writes-spec-from-merged-intent` follow the new steps.
- `templates/<stack>/AGENTS.md`, five files, and `intent/README.md` (changed): the sentence on how a plan is accepted.
- `.changeset/<name>.md` (new): `minor` for `@next-friday/create-app`.
- `intent/approval-evidence/plan.md` (changed): the `Accepted by:` handle, copied from the host. `intent/approval-evidence/spec.md` (changed): `Status: accepted.` and a `Decision:` line under each of its seven areas of concern.

Committed by a person from a patch in one issue:

- `templates/<stack>/.github/workflows/ci.yml`, five files (changed): the step that runs `pnpm plan:check` gains `GH_TOKEN`, and its job gains `pull-requests: read`.
- `.github/workflows/ci.yml` (changed): the Agent Gates job gains a `pnpm plan:check` step with the same two.

## Order of work

1. On a new branch, set `Accepted by:` to the account that merged this plan's pull request, set the spec to `Status: accepted.`, and add its seven `Decision:` lines as proposals. Check: `pnpm plan:check`.
2. `check-plan.ts`: the three rules that need only git and the files, then the host reader, each with self-test cases that fail before the rule exists. Check: `pnpm plan:check` prints the new count of self-tests.
3. The four playbooks and `SKILL.md`. Check: `pnpm plugin:sync`, then `pnpm plugin:check`.
4. The eval cases. Check: `pnpm evals:run` and `pnpm evals:run:write`, on the small model, once.
5. Open the issue with the patch for the six workflow files, tested in a generated project with `actionlint`. Check: the person's commit is on the branch and matches the patch.
6. The changeset. Check: `pnpm changesets:check`.
7. Generate a project of each of the five stacks, one at a time, and run `pnpm verify` in each. Check: five passes.
8. `pnpm verify` in the root, the `verifier` subagent, the pull request, and the review.

## Risks

- The riskiest step is 2: a wrong rule fails pull requests that are right. The rules run only on a plan, a spec, or an intent that the branch adds or changes, as the plan rules do today, so a pull request that touches none of them is not checked.
- Every plan now takes a merge before its code, and a bug fix takes two pull requests where it took one.
- A branch that departs from its plan still changes `plan.md` in the same commit as the code. The rule fails only a `plan.md` the branch adds, so that change passes, and the code owner reviews it.
- A `spec.md` merged before this delivery has no `Decision:` lines. Its build sets it to `Status: accepted.`, which changes it, so that commit adds them.
- Requirement 6 is checked only when the plan carries an `Also accepted by:` line, because no file says how a spec classes a change as higher risk (the spec's area of concern 2).
- Without a token, the check prints that the handle was not checked and passes. With a token and no `gh`, or a token that cannot read pull requests, the check fails.
- A pull request merged by a merge queue is recorded as merged by a bot, which no `Accepted by:` handle matches.
- Options not taken: a comment or a review as the acceptance, because an agent that acts with the engineer's account can write one; trusting the `Accepted by:` text, because the agent writes it; a signed commit, because it needs a key on each engineer's machine; one pull request for the plan and its code, because nothing on it but a merge is out of the agent's reach.

## Proof

- 1, 2, 5: the eval cases `build-plans-and-waits-for-the-engineer` and `build-continues-from-an-accepted-plan`, and `fix-reproduces-finds-the-cause-and-waits-for-the-engineer` for `fix.md`.
- 3, 4, 6: the self-test cases of `check-plan.ts` for a branch that adds a plan with code, a branch whose plan is on the default branch, a handle that is and is not the account that merged, and a second review that is and is not there. The host reader has no self-test: it is run by hand on this branch with the right handle, a wrong handle, no token, and a `gh` that fails, and the CI run of the pull request that builds this plan is the live case.
- 7: the eval case `writes-spec-from-merged-intent`.
- 8: self-test cases for a concern with and without its `Decision:` line, and this spec's seven lines.
- 9, 10: self-test cases for an `Author:` line with and without a handle, and the eval case `drafts-intent-and-waits-for-yes`.
- 11–21: not built by this delivery. Each gets its proof here when the plan of its delivery is added.
- 22: `pnpm plugin:check`.
- 23: step 7.
- 24: `pnpm changesets:check`.
