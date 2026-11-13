# Plan: Record who approved at every gate

Accepted by: @joetakara.

This plan covers every requirement of `intent/approval-evidence/spec.md`, in three deliveries: requirements 1 to 10 and 11 to 16, which are built, and requirements 17 to 21. A delivery's plan is accepted by merging the pull request that adds it, and its code follows in a second pull request.

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

**Delivery 2.** Edited by the agent:

- `templates/base/.agents/release-approval-form` (new): one extended regular expression, shipped as `^[A-Z]+-[0-9]+$`.
- `templates/base/SETUP.md` (changed): the production gate step names that file and says that a value which does not match it does not lift the gate.
- `.changeset/<name>.md` (new): `minor` for `@next-friday/create-app`.
- `intent/approval-evidence/spec.md` (changed): the decision under area of concern 4.

**Delivery 2.** Committed by a person from a patch in one issue:

- `templates/base/.agents/hooks/record-gate-decision.sh` (new): one function that appends a line of JSON to `.agents/logs/gate-decisions.jsonl` in the project: the time in UTC, the hook's name, the decision, the reason when it blocks, and the session's identifier when the input gives one. It writes no command text, path, file content, or environment value: a hook whose message names a path or a command word passes a second, fixed reason for the record. When it cannot write, it says so on standard error and returns. `AGENT_GATE_LOG` names another file, which `check-agent-gates.ts` uses so that the check leaves no record in the project.
- `templates/base/.agents/hooks/agent-test-edit-gate.sh`, `agent-shell-gate.sh`, `agent-mcp-gate.sh`, `agent-production-gate.sh`, and `templates/base/.cursor/hooks/agent-constitution-gate.sh` (changed): `allow` and `block` call that function before they answer. Each loads the function from its own folder and blocks, with a message that names the file, when it cannot.
- `templates/base/.agents/hooks/agent-production-gate.sh` (changed): lifts the gate only when `RELEASE_APPROVAL` matches the expression in `.agents/release-approval-form`; blocks any other value with a message that names the file; when it lifts, its record also holds the value and `git config user.name`.
- `templates/base/scripts/check-agent-gates.ts` (changed): every case also checks its record: one line, the decision, the hook, a time within ten minutes of now, the session, only the seven known keys, and no word of the input that looks like a path or an assignment. New cases cover a command and a path that hold a secret, a hook that cannot write its record, a project with no form file, and a value that does and does not match the form. The values `1`, `off`, `00`, and a space move from the list that lifts the gate to the list that keeps it.

**Delivery 3.** Edited by the agent; no file of this delivery is in the constitution:

- `plugins/sdlc/source/hooks/check-reply-shape.sh` and `check-reply-shape.cases.json` (changed): the hook that runs when the agent stops also blocks a reply in the `sdlc-mode` shape that has no **Checks** section when, since the person's last message, the content of a file outside `intent/` changed. A new `snapshot` argument, run when the person sends a message, stores a checksum of that content, read through a copy of the Git index; the stop compares it. The rule does not apply outside a Git repository or with no stored checksum.
- `plugins/sdlc/adapters/hooks.json` (changed): registers the `snapshot` argument for each tool at the event that fires when the person sends a message.
- `scripts/sync-plugin.ts` (changed): a hook case can name changed files; it then runs in a new Git repository, between a snapshot and the stop.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): the reply shape says that a turn which edited a file outside `intent/` has a **Checks** section, which names each check that ran and each check that could not run and why.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/review.md` (changed): when a pull request exists and the session cannot post on it, the **Status** line says that the findings are not on the pull request and that a person posts them, and the step stays open.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/maintain.md` (changed): the service owner schedules a finding with a comment on its pull request that says when; an open pull request with no such comment is undecided.
- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md` (changed): step 6 reports the code owners, the ruleset of `main`, and the OpenTelemetry export each with its state and what the customer needs for it.
- `templates/base/SETUP.md` (changed): those three steps each say what the customer needs, as line 63 does for rulesets in a private repository, with the host's or the tool's documentation as the source.
- `plugins/sdlc/adapters/claude-code/`, `plugins/sdlc/adapters/cursor/`, and `templates/base/plugins/sdlc/` (changed): rendered by `pnpm plugin:sync`.
- `plugins/sdlc/README.md` (changed): the hook table gains the new hook.
- `.changeset/<name>.md` (new): `minor` for `@next-friday/create-app`.
- `intent/approval-evidence/spec.md` (changed): the decision under area of concern 6. `intent.md` and `spec.md`: `Status: done.` in the pull request that meets requirement 21.

## Order of work

Delivery 1 is built: steps 1 to 8 below.

1. On a new branch, set `Accepted by:` to the account that merged this plan's pull request, set the spec to `Status: accepted.`, and add its seven `Decision:` lines as proposals. Check: `pnpm plan:check`.
2. `check-plan.ts`: the three rules that need only git and the files, then the host reader, each with self-test cases that fail before the rule exists. Check: `pnpm plan:check` prints the new count of self-tests.
3. The four playbooks and `SKILL.md`. Check: `pnpm plugin:sync`, then `pnpm plugin:check`.
4. The eval cases. Check: `pnpm evals:run` and `pnpm evals:run:write`, on the small model, once.
5. Open the issue with the patch for the six workflow files, tested in a generated project with `actionlint`. Check: the person's commit is on the branch and matches the patch.
6. The changeset. Check: `pnpm changesets:check`.
7. Generate a project of each of the five stacks, one at a time, and run `pnpm verify` in each. Check: five passes.
8. `pnpm verify` in the root, the `verifier` subagent, the pull request, and the review.

Delivery 2:

9. Write the patch for the six hook files and `check-agent-gates.ts` in a copy of a generated project, with the new cases first. Check: `pnpm gates:check` fails on the unpatched hooks and passes on the patched ones.
10. Add `.agents/release-approval-form`, the `SETUP.md` text, and the changeset on a new branch. Check: `pnpm changesets:check`.
11. Open the issue with the patch. Check: the person's commit is on the branch and matches the patch.
12. Generate a project of each of the five stacks and run `pnpm verify` in each. Check: five passes, and `git status` in a project shows no `.agents/logs/` file after `pnpm gates:check`.
13. `pnpm verify` in the root, the review as a draft pull request until its findings are fixed, and the pull request.

Delivery 3:

14. The rule in `check-reply-shape.sh` and its cases, cases first: a turn with a change outside `intent/` and no **Checks**, the same with **Checks**, a turn that changed only `intent/`, a turn with no change, a reply not in the `sdlc-mode` shape, a project that is not a Git repository, and the second stop of a blocked turn. Check: the cases fail before the hook exists and pass after; `pnpm plugin:check` runs them.
15. `hooks.json`, `SKILL.md`, the two playbooks, the `setup-sdlc` skill, `SETUP.md`, and the README. Check: `pnpm plugin:sync`, then `pnpm plugin:check`.
16. Lint and format each changed file, then generate a project of each of the five stacks and run `pnpm verify` in each. Check: five passes.
17. The eval cases of `review` and `maintain`, once, on the small model. Check: the scores, reported.
18. The changeset, `Status: done.`, `pnpm verify` in the root, and a draft pull request that stays a draft until its review's findings are fixed.

## Risks

- The riskiest step is 2: a wrong rule fails pull requests that are right. The rules run only on a plan, a spec, or an intent that the branch adds or changes, as the plan rules do today, so a pull request that touches none of them is not checked.
- Every plan now takes a merge before its code, and a bug fix takes two pull requests where it took one.
- A branch that departs from its plan still changes `plan.md` in the same commit as the code. The rule fails only a `plan.md` the branch adds, so that change passes, and the code owner reviews it.
- A `spec.md` merged before this delivery has no `Decision:` lines. Its build sets it to `Status: accepted.`, which changes it, so that commit adds them.
- Requirement 6 is checked only when the plan carries an `Also accepted by:` line, because no file says how a spec classes a change as higher risk (the spec's area of concern 2).
- Without a token, the check prints that the handle was not checked and passes. With a token and no `gh`, or a token that cannot read pull requests, the check fails.
- A pull request merged by a merge queue is recorded as merged by a bot, which no `Accepted by:` handle matches.
- Options not taken: a comment or a review as the acceptance, because an agent that acts with the engineer's account can write one; trusting the `Accepted by:` text, because the agent writes it; a signed commit, because it needs a key on each engineer's machine; one pull request for the plan and its code, because nothing on it but a merge is out of the agent's reach.

- Delivery 2. The riskiest step is 9: a hook that fails while it writes its record must still answer, or it blocks every command of every session. The record is written by a function that cannot fail the hook, and a case removes the write permission to show it.
- Delivery 2. A team that lifts the gate today with `RELEASE_APPROVAL=1` is blocked after it updates, until it sets a value in the organization's form. The changeset and `SETUP.md` say so.
- Delivery 2. `logs` is already a line of each stack's `_gitignore`, which ignores `.agents/logs/`, so no `_gitignore` changes; the spec's design names that change, and step 12 checks the result.
- Delivery 2. The hooks of this repository's root are not changed: the spec names the template's hooks.
- Delivery 2. Options not taken: a record in the repository, because the repository holds no log file; the command text in the record, because a command can hold a secret; one record function copied into each hook, because the five would drift.

- Delivery 3. The riskiest step is 14: a hook that blocks a right reply stops every session that uses the plugin. It fires only on a reply in the `sdlc-mode` shape, only after an edit outside `intent/` in that turn, and never twice for one turn; a reply that names, under **Checks**, the check it could not run and why, passes.
- Delivery 3. Departure from the first plan: the hook does not read the session's transcript. A transcript shows an edit made by the edit tool and misses one made by a shell command, and its format and its tool names belong to the agent tool. The content of the working tree shows both, and the rule joins `check-reply-shape.sh`, which already reads the reply and already blocks a turn only once.
- Delivery 3. A file that a person or another process changes while the agent's turn runs counts as changed in that turn. A file Git ignores and does not track never counts.
- Delivery 3. Options not taken: reading the words of the **Status** line for "done", because every **Status** line says what is done; `git status` alone as the sign of an edit, because a question asked in a dirty tree would be blocked; failing `pnpm verify` on a setting that is not made, because the spec keeps a new project green.

## Proof

- 1, 2, 5: the eval cases `build-plans-and-waits-for-the-engineer` and `build-continues-from-an-accepted-plan`, and `fix-reproduces-finds-the-cause-and-waits-for-the-engineer` for `fix.md`.
- 3, 4, 6: the self-test cases of `check-plan.ts` for a branch that adds a plan with code, a branch whose plan is on the default branch, a handle that is and is not the account that merged, and a second review that is and is not there. The host reader has no self-test: it is run by hand on this branch with the right handle, a wrong handle, no token, and a `gh` that fails, and the CI run of the pull request that builds this plan is the live case.
- 7: the eval case `writes-spec-from-merged-intent`.
- 8: self-test cases for a concern with and without its `Decision:` line, and this spec's seven lines.
- 9, 10: self-test cases for an `Author:` line with and without a handle, and the eval case `drafts-intent-and-waits-for-yes`.
- 11, 13: cases of `check-agent-gates.ts` that run each of the five hooks on an allow and on a block and read the line it appends, and a case with an unwritable `.agents/logs/`.
- 12: a case that blocks a command holding a marker string and checks that the record does not hold it.
- 14, 15: cases for `RELEASE_APPROVAL=CHG-123`, which lifts the gate and records the value and the name, and for `1`, which blocks with a message that names `.agents/release-approval-form`.
- 16: `pnpm gates:check` in a generated project of each stack.
- 17: the review reads each of the three steps of `SETUP.md` against the documentation it cites.
- 18: the eval case `setup-sdlc` reports the three steps, and `pnpm verify` in a new project of each stack.
- 19: the `checks:` cases of `check-reply-shape.cases.json`, run by `pnpm plugin:check`.
- 20: the review reads `review.md` step 1, and the eval case `review-reports-findings-and-never-merges` still passes. Its scaffold has no host, so no case holds a pull request that the session cannot post on.
- 21: the review reads `maintain.md` step 6, and the eval case `maintain-writes-intent-from-a-finding` still passes.
- 22: `pnpm plugin:check`.
- 23: step 7.
- 24: `pnpm changesets:check`.
