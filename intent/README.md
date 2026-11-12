# Intent

This folder is the intent home. Every change starts here as an `intent.md`, and its record stays here. Git history keeps the author, the time, and every revision of each file.

- Each change has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name. The folder holds `intent.md` (Plan), then `spec.md` (Design), then `plan.md` (Build).
- **Plan.** An idea, a ticket, or an incident becomes `intent.md`, written by sending the idea with `/sdlc:sdlc-mode`, which interviews the originator. The originator corrects the draft before it is committed, and the product owner reviews it in its pull request. Merging its pull request accepts it; closing the pull request rejects it. No person edits the status line: the file stays `Status: draft.`, and the spec's pull request sets it to `Status: accepted.`.
- **Design.** Sending the intent's path with `/sdlc:sdlc-mode` turns the accepted `intent.md` into `spec.md`, committed alongside it. The product owner reviews the spec against the idea and resolves each area of concern with its policy owner. Merging the spec's pull request accepts it and starts the build; the plan's commit sets the spec to `Status: accepted.`.
- **Build.** The engineer sends `/sdlc:sdlc-mode build` with the spec's path, starts in plan mode with `intent.md` and `spec.md`, and commits the approved plan as `plan.md`. When implementation departs from the plan, `plan.md` changes in the same commit.
- **Done.** A change is `done` when the tree meets every numbered requirement of its `spec.md`. The agent sets `Status: done.` in `intent.md` and `spec.md` in the pull request that meets the last requirement, and the code owner's approval of that pull request accepts it.

## Which file holds what

The bullets above say who writes and who decides each file. What each file answers:

| File        | Answers                                                                                                    |
| :---------- | :--------------------------------------------------------------------------------------------------------- |
| `intent.md` | The problem, the outcome wanted, the users and systems it affects, its constraints, and its open questions |
| `spec.md`   | What to build and how it is designed: requirements, design, and areas of concern                           |
| `plan.md`   | How to make the change: the files that change, the order of the work, and the tests that prove it          |

## Where a technology choice goes

- **A choice already made**, such as a required framework or service, goes into the intent's **Constraints**. The spec designs within it.
- **A choice to weigh**, such as two libraries or two approaches, goes into the intent's **Proposed outcome** as a proposal or into its **Open questions**. The spec compares the options in its design, with sources, and the product owner accepts or corrects the choice in review.
