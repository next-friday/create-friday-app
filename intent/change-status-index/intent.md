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

- Anyone, without an agent and without opening each folder, sees in one place every change, the stage it is in, what it waits on, and who acts next.
- Seeing it costs no model call, so it costs no tokens.
- What it shows matches the repository.
- The same holds in this repository and in every generated project.

The product owner has not chosen how. The spec compares these options, each with a source, and the product owner accepts or corrects the choice in review:

- **An index generated from a record in each change.** Each change keeps its stage in a field a script can read, and a tool builds one overview page from those fields, as Python builds PEP 0 from each PEP's headers (source above). Maintained tools do this for decision records, and `platform-and-library-first.md` puts them before custom code: log4brains offers "Static site generation to publish to GitHub/GitLab Pages or S3", with statuses "Proposed, accepted, deprecated, superseded" ([thomvaill/log4brains](https://github.com/thomvaill/log4brains)), and adr-tools has `adr generate toc`, which "Generates a table of contents in Markdown format" ([npryce/adr-tools](https://github.com/npryce/adr-tools)).
- **A tracking issue per change, shown on a board.** Kubernetes keeps a `status` in each `kep.yaml` (source above), and its overview is a board: "Enhancement Tracking Issues provide a checklist", and "enhancements from this repo are visualized in the Enhancements Tracking Boards" ([kubernetes/enhancements](https://github.com/kubernetes/enhancements)). On GitHub the board is a project: "A project is an adaptable table, board, and roadmap that integrates with your issues and pull requests", and "Information is synced automatically to your project as you make changes" ([GitHub Docs: About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)). Built-in workflows "automatically add items from repositories that match a filter" ([GitHub Docs: Adding items automatically](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)). Each stage of a change opens its own pull request, so something has to open one issue per change. A project belongs to a user or an organization, not to the repository, and a project template copies "configured workflows (except any auto-add workflows)" (About Projects), so `templates/` cannot ship one and each generated project sets its own up. `intent/playbook-plays/spec.md` (accepted) proposes that "the root uses no other tracker" (**Sources of truth**).
- **A dashboard tool that reads the spec files.** spec-view installs with `pip install spec-view`, reads an optional `status:` field at the top of each file, and offers `spec-view list` ("Simple text table of specs + status") and `spec-view serve` ("Start web dashboard at localhost:8080") ([spec-view 0.3.0](https://pypi.org/project/spec-view/0.3.0/)). It runs on a person's machine, so a reader needs a clone and Python.
- **A page in the docs app** of each generated project, once `intent/monorepo-apps/spec.md` is built: it adds `apps/docs` (requirement 1), where "Documentation for people lives" (requirement 11). A deployed site is readable without a GitHub account. This repository has no docs app ("deploys no app", requirement 15), so the root needs another page, as `intent/playbook-plays/spec.md` puts the loop guide in "`apps/docs`; `CONTRIBUTING.md` in the root".

Today's accepted design, the `loop-status` skill in `intent/playbook-plays/spec.md`, is the baseline: it needs an agent and reads every folder on each run, which is the cost this intent names.

Whatever the option, `intent/README.md` line 6 changes, because its rule conflicts with `intent/playbook-plays/spec.md`. Depending on the option, that spec's **Status values**, **Status skill**, and **Reminder** change too. The stages a change can be in are that spec's **Status values** (`draft`, `accepted`, `done`, `withdrawn`, `replaced`) plus `rejected` from `intent/README.md`; whether the record adds plan and build stages is open.

## Affected users and systems

- Executives, sales, business analysts, product owners, engineers, and agents, in this repository and in every generated project.
- `intent/` and its README, and `intent/playbook-plays/spec.md`.
- Depending on the option: the `write-intent` and `write-spec` skills, which would write the record; `.husky/`, the agent hook configuration, and CI, in the root and in `templates/base/`, for a check that the index matches the records; a GitHub project per repository; the docs app in generated projects.

## Constraints

- The product owner decided on 2026-11-10: the change applies in this repository and in every generated project.
- The repository is the source of truth for intents, specs, and plans (`intent/playbook-plays/spec.md`, **Sources of truth**, from page 22: "name one system as the source of truth, with everything else holding a copy or a link to the original").
- A changed hook or CI rule goes through `constitution-changes.md`.

## Open questions

- Which option above, or which mix of them?
- Where does a change's stage live, and which pull request writes each stage, so that "built" and "done" are recorded by the change that causes them and not by memory?
- Should a stage change in the same pull request as the work, so the record does not lag the merge, which `intent/playbook-plays/spec.md` accepts today?
- Who reads it: does an executive or a salesperson open GitHub, or does the status need to reach them somewhere else?
