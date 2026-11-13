# Plan: Record who approved at every gate, delivery 1

Accepted by: @<engineer>.

This plan covers requirements 1 to 10 and 22 to 24 of `intent/approval-evidence/spec.md`. Requirements 11 to 21 get their own plan in the same file when their delivery starts. This pull request is run the new way: the plan is pushed first, and the engineer accepts it here with a comment whose whole text is `Plan accepted.`

## Files that change

Edited by the agent:

- `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md` (changed): steps 4 to 6 write, commit, and push the draft plan and open its pull request before the gate; the gate reads the acceptance from the host; `Accepted by:` and `Also accepted by:` are copied from it.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/fix.md` (changed): steps 4 to 6, the same.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/design.md` (changed): the `Skills at <hash>.` ending of the `Request:` line; the `Decision:` line under each area of concern; the gate says who writes the decision and that the agent copies it with its URL.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/plan.md` (changed): the author is the originator's handle, asked for when it cannot be read; the template's line is `Author: @<handle> (<team>). Status: draft.`; the originator's acceptance on the pull request when another person merges.
- `plugins/sdlc/source/scripts/check-plan.ts` (changed): reads the pull request's author, reviews, comments, and commits with the host's `gh` tool when `GH_TOKEN` and a pull request are present; fails as requirements 4, 6, 8, and 9 say; without them, checks the form and prints that the acceptance was not checked; self-test cases for each rule.
- `plugins/sdlc/adapters/claude-code/`, `plugins/sdlc/adapters/cursor/`, `templates/base/plugins/sdlc/`, and `templates/base/scripts/check-plan.ts` (changed): rendered by `pnpm plugin:sync`.
- `plugins/sdlc/adapters/claude-code/evals/sdlc-mode/` (changed and new): `build-plans-and-waits-for-the-engineer` and `drafts-intent-and-waits-for-yes` follow the new steps; a new case shows that the agent writes no `Accepted by:` handle from the chat; `writes-spec-from-merged-intent` checks the `Skills at` hash.
- `.changeset/<name>.md` (new): `minor` for `@next-friday/create-app`.
- `intent/approval-evidence/plan.md` (new), and `spec.md` (changed): `Status: accepted.` and a `Decision:` line under each of its seven areas of concern, copied from the product owner's comments on this pull request.

Committed by a person from a patch in one issue:

- `templates/<stack>/.github/workflows/ci.yml`, five files (changed): the job that runs `pnpm plan:check` gains `pull-requests: read`, and the step gains `GH_TOKEN` and the pull request's number.
- `.github/workflows/ci.yml` (changed): the Agent Gates job gains a `pnpm plan:check` step with the same two values.

## Order of work

1. Commit this plan, push it, and open the pull request. The engineer accepts with the comment `Plan accepted.`, and the product owner comments a decision for each of the spec's seven areas of concern. Check: both are on the pull request.
2. Set `Accepted by:` from that comment, set the spec to `Status: accepted.`, and add the seven `Decision:` lines. Check: `pnpm plan:check`.
3. `check-plan.ts`: the host reader and the four rules, each with self-test cases that fail before the rule exists. Check: `pnpm plan:check` prints the new count of self-tests.
4. The four playbooks. Check: `pnpm plugin:sync`, then `pnpm plugin:check`.
5. The eval cases. Check: `pnpm evals:run` and `pnpm evals:run:write`, on the small model, once.
6. Open the issue with the patch for the six workflow files, tested in a generated project with `actionlint`. Check: the person's commit is on this branch and matches the patch.
7. The changeset. Check: `pnpm changesets:check`.
8. Generate a project of each of the five stacks, one at a time, and run `pnpm verify` in each. Check: five passes.
9. `pnpm verify` in the root, the `verifier` subagent, the pull request's body, and the review.

## Risks

- The riskiest step is 3: a wrong rule fails pull requests that are right. The rules run only on a plan, a spec, or an intent that the branch adds or changes, as the plan rules do today, so a pull request that touches none of them is not checked.
- The host cannot tell the engineer from an agent that acts with the engineer's own account. In a session that posts as the engineer, the agent could write the comment itself. The playbook forbids it, and the eval case checks it, but the check in CI cannot see it.
- A `spec.md` that the branch changes must carry a `Decision:` line under each area of concern. Setting a spec to `Status: accepted.` changes it, so a spec merged before this delivery needs its decisions when its build starts.
- Requirement 6 is checked only when the plan carries an `Also accepted by:` line, because no file says how a spec classes a change as higher risk (the spec's area of concern 2).
- `gh` is not on every machine. Without it, or without a token, the check prints that the acceptance was not checked and passes.
- Options not taken: a required review as a merge gate for the plan, because the intent adds no merge gate; trusting the `Accepted by:` text, because the agent writes it; a signed commit as the acceptance, because it needs a key on each engineer's machine; a separate pull request for the plan, because the plan and its code are reviewed together.

## Proof

- 1, 5: the eval case `build-plans-and-waits-for-the-engineer`, and `fix-reproduces-finds-the-cause-and-waits-for-the-engineer` for `fix.md`.
- 2, 3, 4, 6: the self-test cases of `check-plan.ts` for an approving review, the fixed comment from the author, a comment older than the plan's last change, a wrong handle, a missing second review, and a run with no host; this pull request's own CI run is the live case.
- 7: the eval case `writes-spec-from-merged-intent`.
- 8: self-test cases for a concern with and without its `Decision:` line, and this spec's seven lines.
- 9, 10: self-test cases for an `Author:` line with and without a handle, and the eval case `drafts-intent-and-waits-for-yes`.
- 11–21: not built by this delivery. Each gets its proof here when the plan of its delivery is added.
- 22: `pnpm plugin:check`.
- 23: step 8.
- 24: `pnpm changesets:check`.
- Brand rule 4: the review reads that `Plan accepted.` and `Draft accepted.` are the only phrases, spelled one way in the playbooks and the check.
