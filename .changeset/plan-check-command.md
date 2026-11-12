---
"@next-friday/create-app": minor
---

Every generated project gets `pnpm plan:check`. It checks each `intent/<change>/plan.md` that a branch adds or changes: the headings of the plan template, the `Accepted by:` line once the branch changes a file outside `intent/`, a `spec.md` beside the plan, and a Proof section that names every numbered requirement of that spec; it also reports a spec with `Status: done.` that has no plan.

A folder under `intent/` that holds a `plan.md` and neither an `intent.md` nor a `spec.md` is a fix plan. It needs the same headings and the same `Accepted by:` line, needs no `spec.md`, and needs a Proof section that is not empty.
