# Spec: Record who approved at every gate

From `intent/approval-evidence/intent.md`. Status: done.

Request: "docs(repo): add the approval evidence intent (#186)", the merge of the intent's pull request by the product owner. Skills at `ebe18df`.

The product owner decided that a plan is accepted by merging its pull request. Other choices the product owner has not made are marked **Proposal**. The product owner corrects them in review. Item numbers are those of the intent's **Problem** section. Playbook paths are under `plugins/sdlc/source/skills/sdlc-mode/playbooks/`.

## Requirements

Delivery 1, items 1 to 7:

1. `build.md` and `fix.md`: the agent commits the draft `plan.md` on a new branch, pushes it, and opens a pull request that changes no file outside `intent/`. Each revision of the plan is a commit on that branch.
2. The engineer accepts the plan by merging that pull request, and rejects it by closing it. The agent never merges it: merging is the one action the project's settings and hooks deny the agent (`Bash(gh pr merge*)` in `templates/base/.claude/settings.json`, and the `pr merge` rule of `templates/base/.agents/hooks/agent-shell-gate.sh`), so the host's record of who merged is the engineer's.
3. The plan's `Accepted by:` line holds the handle of the account that merged that pull request. The agent copies it from the host, in the first commit of the branch that builds the plan. In a session that cannot reach the host, it writes the handle the engineer gives, and the CI check of requirement 4 proves it.
4. `plan:check` fails a branch that changes a file outside `intent/` and adds a `plan.md` that is not on the default branch: the plan's pull request is merged first. In CI, with the host's token, it also fails when the `Accepted by:` handle is not the account that merged the pull request that added the plan. Run where it cannot read the host, it says that the handle was not checked.
5. In a session that cannot reach the host, the agent waits for the engineer's word that the plan is merged, and confirms it with `git fetch`: the plan is on the default branch.
6. For a change the spec classes as higher risk, the plan's pull request holds an approving review from a second person before it is merged. The plan names that person on a line `Also accepted by: @<handle>.`, and `plan:check` in CI checks that review when the line is present.
7. `design.md`: the spec's `Request:` line ends with the short hash of the last commit that changed the plugin's files, written `Skills at <hash>.`, as `intent/sdlc-plugin/spec.md:5` has it.
8. `design.md`: each numbered area of concern carries a line `Decision: <the decision>.` before the spec's pull request is merged. The agent writes its proposal on that line, the product owner or the policy owner corrects it, and the merge records who accepted it. `plan:check` fails a branch that adds or changes a `spec.md` with a numbered area of concern that has no such line.
9. `plan.md` (the intent playbook): the intent's `Author:` line holds the originator's handle on the host. The agent asks for it when it cannot read it, and never takes it from `git config user.name`. `plan:check` fails a branch that adds an `intent.md` whose `Author:` line holds no handle.
10. `plan.md` (the intent playbook): when the originator is not the person who merges the intent's pull request, the originator is that pull request's author or gives it an approving review.

Delivery 2, items 8 and 9:

11. Each hook that allows or blocks an action writes one record for each decision: the time in UTC, the hook's name, the decision, the reason when it blocks, and the session's identifier when the hook's input gives one. The five are `agent-test-edit-gate.sh`, `agent-shell-gate.sh`, `agent-production-gate.sh`, and `agent-mcp-gate.sh` under `templates/base/.agents/hooks/`, and `templates/base/.cursor/hooks/agent-constitution-gate.sh`. `agent-format-after-edit.sh` decides nothing and writes none.
12. A record holds no command text, file content, or environment value, so that no secret reaches it.
13. **Proposal:** the records are lines of JSON in `.agents/logs/gate-decisions.jsonl`, which each stack's `_gitignore` lists. A hook that cannot write the file still gives its decision and says so on standard error.
14. `agent-production-gate.sh` lifts the gate only when `RELEASE_APPROVAL` matches the form the organization sets. **Proposal:** the form is one extended regular expression in `.agents/release-approval-form`, shipped as `^[A-Z]+-[0-9]+$`, which matches the example `CHG-123` of `templates/base/SETUP.md:95`. A value that does not match blocks, and the message names the file.
15. When the production gate is lifted, its record also holds the value of `RELEASE_APPROVAL` and `git config user.name`.
16. `scripts/check-agent-gates.ts` in a generated project covers requirements 11 to 15: a record for an allow and for a block, no command text in it, and a lifted and a refused `RELEASE_APPROVAL`.

Delivery 3, items 10 to 15:

17. `templates/base/SETUP.md`: the steps for code owners, the ruleset of `main`, and the OpenTelemetry export each say what the customer needs to do the step, as line 63 does for rulesets in a private repository.
18. The `setup-sdlc` skill reports each of those three steps as `done`, `not done`, or `a person checks this`, with what the customer needs. `pnpm verify` in a new project does not fail on a step that is not done.
19. A hook blocks a reply that reports the task done when the session changed a file outside `intent/` and the reply shows no check that ran. **Proposal:** the plugin's stop hook, beside `check-reply-shape.sh`, blocks when the branch or the working tree holds a change outside `intent/` and the reply's **Status** line reports the work done with no **Checks** section above it.
20. `review.md`: when a pull request exists and the session cannot post on it, the reply's **Status** line says that the findings are not on the pull request and that a person posts them. The agent does not report the review as done.
21. `maintain.md`: the service owner schedules a finding with a comment on its pull request that says when. Leaving the pull request open without that comment is not a decision.

Every delivery:

22. `pnpm plugin:sync` renders each changed playbook and script into `plugins/sdlc/adapters/` and `templates/base/`, and `pnpm plugin:check` passes (`AGENTS.md`, Architecture).
23. `pnpm verify` passes in a generated project of each of the five stacks (`AGENTS.md`, "Every stack").
24. Each delivery is one pull request with its own changeset for `@next-friday/create-app`, because each changes a file under `templates/` (`.changeset/README.md`).

## Design

- `build.md`, steps 4 to 6: the plan is written to the file, committed, pushed, and its pull request opened; the gate is the engineer's merge of that pull request; the build then starts on a new branch, whose first commit copies `Accepted by:` from the host. `fix.md`, steps 4 to 6, the same.
- `design.md`: step 3 gains the `Skills at` hash and the `Decision:` line with the agent's proposal; the gate says that the product owner, or the policy owner, corrects each decision before merging.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`: the row for a build names the merged plan.
- `plan.md` (the intent playbook): step 2 loses `git config user.name`; the template's `Author:` line becomes `Author: @<handle> (<team>). Status: draft.`; step 7 gains the originator's acceptance.
- `review.md`, step 1, and `maintain.md`, step 6: the sentences of requirements 20 and 21.
- `plugins/sdlc/source/scripts/check-plan.ts`: checks requirements 4, 8, and 9 from git and the files alone; reads who merged the plan's pull request, and its reviews, through the host's command-line tool when a token is present, for requirements 4 and 6; gains self-test cases for each.
- Each stack's `templates/<stack>/.github/workflows/ci.yml`: the step that runs `plan:check` passes the workflow's token. The root's `.github/workflows/ci.yml` runs `plan:check` in no job today; its Agent Gates job gains that step.
- The five hooks of requirement 11: one shared function writes the record. Each of the five `templates/<stack>/_gitignore` files lists `.agents/logs/`.
- `templates/base/.agents/release-approval-form` (new), and `agent-production-gate.sh` reads it.
- `templates/base/scripts/check-agent-gates.ts`: the cases of requirement 16.
- `plugins/sdlc/source/hooks/`: the stop hook of requirement 19 and its cases, registered where `check-reply-shape.sh` is.
- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md`, step 6, and `templates/base/SETUP.md`: requirements 17 and 18.
- `plugins/sdlc/adapters/claude-code/evals/`: a case for the plan gate, the spec gate, and the intent gate, each showing that the agent writes no acceptance itself.
- The hooks, the workflows, and `check-agent-gates.ts` are in the constitution: a person commits them from a patch.

## Policies

- **Brand:** Does not apply. The change shows no brand value: an acceptance is a merge or a review, not a phrase.
- **Security:** rule 6, as requirement 12. `v5.0.0-2.2.1`, as requirement 14: the approval value is checked against the organization's form. Chapter V16, Security Logging and Error Handling, holds no Level 1 requirement.
- **Compliance:** applies. The records of requirements 3, 6, 9, and 15 hold a person's handle or name. See area of concern 4.
- **UX:** Does not apply. The change adds no screen; its messages are plain text in a terminal and on the host.

## Areas of concern

1. No policy. Item 16 of the intent, eval cases that run as a merge check in a generated project, is not in this spec. The intent proposes its own spec, and a change folder holds one `spec.md`. It needs its own intent folder, or a second spec file that the playbooks do not know.
   Decision: item 16 gets its own intent folder.
2. No policy. No file says how a spec classes a change as higher risk: the spec template has no field for it. Requirement 6 can be checked only once it has one. A repository with one person also has no second person to give that review.
   Decision: deferred. Requirement 6 is checked only when a plan carries an `Also accepted by:` line.
3. No policy. The intent's open question 5 has no answer: where a tech lead's rating of a finding is kept. This spec adds no requirement for it.
   Decision: no place for ratings is built now.
4. Compliance, rule 3. The records name a person: a handle in `plan.md`, `spec.md`, and `intent.md`, and `git config user.name` in the gate's record. The files do not say on what basis the organization keeps them or for how long. The compliance policy owner decides.
   Decision: the handles in `plan.md`, `spec.md`, and `intent.md` are kept as the host already shows them. The gate's record holds `git config user.name` only when the production gate is lifted; the file stays on the machine, git does not track it, and the organization decides how long to keep it.
5. No policy. Requirement 8 keeps the spec's pull request red until each concern has a `Decision:` line, so a product owner can no longer merge a spec and decide its concerns later. Requirements 1 to 6 add one merge for each plan, and a bug fix now takes two pull requests.
   Decision: accepted.
6. No policy. The stop hook of requirement 19 can block a reply that is right, such as one that reports a documentation change as done. Its proposal needs the product owner's yes before it ships to every project.
   Decision: the hook is built, limited to a turn in which the session edited a file outside `intent/` and to a reply in the `sdlc-mode` shape. A reply that names, under **Checks**, the check it could not run and why, passes.
7. No policy. `AGENTS.md` says to run `pnpm evals:run` and `pnpm evals:run:write` after a skill or a hook changes. Each delivery changes one, so each runs them.
   Decision: each delivery runs the eval cases once, on the small model.

## Open questions

1. What the engineer's acceptance on the pull request is: the merge of the plan's pull request, requirements 2 to 5. The product owner decided this.
2. Where a hook writes its record: answered as requirement 13, a proposal. The session trace is not written by the hook; the OpenTelemetry export of requirement 17 carries it when the customer turns it on.
3. The form of a production approval record: answered as requirement 14, a proposal.
4. Whether a missing setting fails a check or is only reported: reported, requirement 18.
5. Where a rating of a finding is kept: carried forward as area of concern 3.
6. Item 16: carried forward as area of concern 1.
7. The order of delivery: requirements 1 to 10, then 11 to 16, then 17 to 21, each as requirement 24 says.
