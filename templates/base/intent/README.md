# Intent

This folder is the intent home. Every change starts here as an `intent.md`, and its record stays here. Git history keeps the author, the time, and every revision of each file.

- Each change has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name. The folder holds `intent.md` (Plan), then `spec.md` (Design), then `plan.md` (Build).
- The playbooks in `.agents/skills/sdlc/playbooks/` say who writes and who accepts each file.
- A change is `done` when the tree meets every numbered requirement of its `spec.md`. The agent sets `Status: done.` in `intent.md` and `spec.md` in the pull request that meets the last requirement, and the code owner's approval of that pull request accepts it.

## Which file holds what

What each file answers:

| File        | Answers                                                                                                    |
| :---------- | :--------------------------------------------------------------------------------------------------------- |
| `intent.md` | The problem, the outcome wanted, the users and systems it affects, its constraints, and its open questions |
| `spec.md`   | What to build and how it is designed: requirements, design, and areas of concern                           |
| `plan.md`   | How to make the change: the files that change, the order of the work, and the tests that prove it          |

## Where a technology choice goes

- **A choice already made**, such as a required framework or service, goes into the intent's **Constraints**. The spec designs within it.
- **A choice to weigh**, such as two libraries or two approaches, goes into the intent's **Proposed outcome** as a proposal or into its **Open questions**. The spec compares the options in its design, with sources, and the product owner accepts or corrects the choice in review.
