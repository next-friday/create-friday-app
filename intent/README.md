# Intent

This folder is the intent home. Every change starts here as an `intent.md`, and its record stays here. Git history keeps the author, the time, and every revision of each file.

- Each change has its own folder, `intent/<change>/`, where `<change>` is a short kebab-case name. The folder holds `intent.md` (Plan), then `spec.md` (Design), then `plan.md` (Build).
- **Plan.** An idea, a ticket, or an incident becomes `intent.md`, written with the `write-intent` skill. The product owner reviews and corrects it before it is committed. Merging its pull request accepts it; closing the pull request rejects it.
- **Design.** The `write-spec` skill turns the accepted `intent.md` into `spec.md`, committed alongside it. The product owner reviews the spec against the idea and resolves each area of concern with its policy owner. Accepting the spec starts the build.
- **Build.** The engineer starts in plan mode with `intent.md` and `spec.md`, and commits the approved plan as `plan.md`. When implementation departs from the plan, `plan.md` changes in the same commit.
