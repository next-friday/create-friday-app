# Intent

This folder holds the documents for one change while it is planned and built. Documentation of the CLI as it is now lives in `README.md`, `CONTRIBUTING.md`, and `AGENTS.md`.

Every change commits its approved plan as `plan.md`. A change also starts from `intent.md` and `spec.md` when it is large: a new feature, a change across teams, or a change a tech lead classes as higher risk.

| Change                                                        | Documents                                   |
| :------------------------------------------------------------ | :------------------------------------------ |
| Every change                                                  | `plan.md`                                   |
| Large: a new feature, a change across teams, or a higher risk | `intent.md`, then `spec.md`, then `plan.md` |

Each change has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name.

- **Plan.** An idea, a ticket, or an incident becomes `intent.md`, written with the `write-intent` skill. The product owner reviews and corrects it before it is committed. Merging its pull request accepts it; closing the pull request rejects it.
- **Design.** The `write-spec` skill turns the accepted `intent.md` into `spec.md`, committed alongside it. The product owner reviews the spec against the idea and resolves each area of concern with its policy owner. Accepting the spec starts the build.
- **Build.** The engineer starts in plan mode with the change's `intent.md` and `spec.md`, when they exist, and commits the approved plan as `plan.md`. When implementation departs from the plan, `plan.md` changes in the same commit.
- **Merge.** In the same pull request, move what stays true into `README.md`, `CONTRIBUTING.md`, or `AGENTS.md`, whichever covers it. After the merge, the folder is a record of the change and is not edited again.
