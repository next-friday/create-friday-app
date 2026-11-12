---
"@next-friday/create-app": minor
---

Every generated project gets `pnpm plan:check`. It checks each `intent/<change>/plan.md`: the headings of the plan template, the `Accepted by:` line once the branch changes a file outside `intent/`, a `spec.md` beside the plan, and a Proof section that names every numbered requirement of that spec; it also reports a spec with `Status: done.` that has no plan.
