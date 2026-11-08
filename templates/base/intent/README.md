# Intent

This folder holds the documents for one change while it is planned and built. Documentation of the system as it is now lives in `docs/`.

Size the documents to the change. The engineer picks the size; a tech lead decides which changes count as higher risk.

| Change                                                        | Documents                                    |
| :------------------------------------------------------------ | :------------------------------------------- |
| Small: a fix, or a change the existing tests already cover    | None; the pull request description is enough |
| Medium: several files, or behavior that users notice          | `plan.md`                                    |
| Large: a new feature, a change across teams, or a higher risk | `intent.md`, then `spec.md`, then `plan.md`  |

A change with documents has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name.

- **Plan.** An idea, a ticket, or an incident becomes `intent.md`, written with the `write-intent` skill. The product owner reviews and corrects it before it is committed. Merging its pull request accepts it; closing the pull request rejects it.
- **Design.** The `write-spec` skill turns the accepted `intent.md` into `spec.md`, committed alongside it. The product owner reviews the spec against the idea and resolves each area of concern with its policy owner. Accepting the spec starts the build.
- **Build.** The engineer starts in plan mode with the change's `intent.md` and `spec.md`, when they exist, and commits the approved plan as `plan.md`. When implementation departs from the plan, `plan.md` changes in the same commit.
- **Merge.** In the same pull request, move what stays true into `docs/`: a lasting decision becomes an ADR in `docs/adr/`, and new behavior, commands, or configuration go into the page that covers them. After the merge, the folder is a record of the change and is not edited again.
