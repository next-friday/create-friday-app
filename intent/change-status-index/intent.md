# Intent: Everyone sees where every change stands without opening its folder

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

Executives, sales, business analysts, and engineers cannot tell which changes were just opened, which have a spec, which have a plan, which were built, and which are done. To find out, each person opens `intent/<change>/` folder by folder. Asking an agent to look reads every folder again and costs many tokens each time.

The only status record is a `Status:` line in each file's first paragraph, and no single file can be read on its own:

- **The line lags the merge by design.** `intent/playbook-plays/spec.md` (accepted) has the next stage's pull request write `accepted`. The spec pull request writes it for an intent, and the plan pull request writes it for a spec. It also says "A merged intent that still says `draft` stays eligible, because the spec pull request is what sets it to `accepted`". So on `main` at `8c89a2a` (2026-11-10), three merged files still read `draft`: `intent/pre-push-review/intent.md` (merged in #78 and #79), and `intent/lean-agent-setup/spec.md` and `intent/multi-agent-support/spec.md` (merged in #71). They are correct, but a reader has to know the rule and check the pull requests to see it.
- **The rule is written two ways.** `intent/README.md` line 6 says "Merging its pull request records the decision: `Status: accepted.`", which contradicts the accepted spec.
- **Later stages have no record.** No change says `done`, although `intent/repository-rename/` was built (#70) and shipped in 5.0.1, because the status values of `intent/playbook-plays/spec.md` are not built yet. `plan.md` carries no `Status:` line, and it is committed in the same pull request as the build (#70, #75). So a plan file shows that a build merged, not that a plan was accepted or that a build is under way.

`intent/playbook-plays/spec.md` also defines a `loop-status` skill. An agent reads every folder and its pull requests, then prints each change's stage, the gate it waits on, who acts next, and the next step. A `SessionStart` reminder prints that summary. Both serve people who use an agent, and both read every folder on each run.

Other proposal processes keep status where a machine can read it, and generate the overview:

- **Python:** "Note that the PEP Index (PEP 0) is automatically generated based on the metadata headers in other PEPs" ([python/peps README](https://github.com/python/peps)).
- **Kubernetes:** each enhancement has a `kep.yaml` whose `status` is one of `provisional`, `implementable`, `implemented`, `deferred`, `rejected`, `withdrawn`, or `replaced` ([KEP template](https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/kep.yaml)). In August 2019 a contributor counted 79 KEPs `implementable` against 13 `implemented` while questioning how features graduate ([kubernetes/community#4000](https://github.com/kubernetes/community/issues/4000)). A machine-readable field still needs something to move it forward.
- **GitHub spec-kit:** "spec-kit generates structured task files but has zero monitoring — no watch, no status dashboard, no progress view" ([spec-view 0.3.0](https://pypi.org/project/spec-view/0.3.0/)).

## Proposed outcome

- Each change's stage lives in one machine-readable record in its own folder, so a script reads it without a model. The stages are intent drafted, intent accepted, spec drafted, spec accepted, built, and done, plus `withdrawn` and `replaced`. This amends the per-file **Status values** of `intent/playbook-plays/spec.md`.
- A script generates one status table from the repository's records alone, with no model and no network. For each change, the table shows the stage, the next step, and who takes it, with links to the change's files. It sits at one path that anyone can open on GitHub without tools. Proposal for the product owner to accept or correct in review: a generated section of `intent/README.md`, which also replaces line 6's conflicting rule.
- A check fails when the table does not match the records. It runs in CI and in the `git push` hook group of `intent/pre-push-review/intent.md`. This follows the playbook: "A policy that must always hold needs something deterministic behind the skill" (page 26). The check depends on that hook group.
- Live state that only GitHub holds stays with the `loop-status` skill, which still reads pull requests and runs with `gh`: an open pull request, or runs waiting for **Approve workflows to run**. The skill reads the table for everything else, so it no longer opens every folder. The `SessionStart` reminder prints the table. This amends **Status skill** and **Reminder** of `intent/playbook-plays/spec.md`.
- The same holds in this repository and in every generated project. Every generated project has `apps/docs` (`intent/monorepo-apps/spec.md`, requirement 1), where "Documentation for people lives" (requirement 11). Proposal: the docs app renders the table as a page from the same records.

## Affected users and systems

- Executives, sales, business analysts, product owners, engineers, and agents, in this repository and in every generated project.
- `intent/` and its README, the `write-intent` and `write-spec` skills, and `intent/playbook-plays/spec.md` (Status values, Status skill, Reminder).
- `.husky/`, the agent hook configuration, and CI, in the root and in `templates/base/`, and the docs app in generated projects.

## Constraints

- The product owner decided on 2026-11-10: the change applies in this repository and in every generated project.
- The repository stays the one source of truth: "name one system as the source of truth, with everything else holding a copy or a link to the original" (page 22). The table is generated from the records and never edited by hand.
- Generating the table and checking it use no model and no network, so they cost no tokens and can run in every hook and CI job.
- The check needs the `git push` hook group that `intent/pre-push-review/intent.md` adds, so it lands with or after that change.
- A changed hook or CI rule goes through `constitution-changes.md`.

## Open questions

- Where does the record live: front matter at the top of each file, or one small file per change, like Kubernetes' `kep.yaml`?
- Which pull request writes each stage, so that "built" and "done" are recorded by the change that causes them and not by memory?
- Should a stage update in the same pull request as the work, so the record does not lag the merge the way `Status:` does today?
