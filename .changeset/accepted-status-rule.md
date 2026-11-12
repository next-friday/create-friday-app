---
"@next-friday/create-app": minor
---

A person accepts an intent or a spec by merging its pull request and edits no status line. The spec's pull request sets the intent to `Status: accepted.`, and the plan's commit sets the spec. `pnpm plan:check` fails when a branch writes `Status: accepted.` in an intent or a spec that is not on `main`, or in a folder that has no file for the next stage. The `Spec on intent merge` workflow runs for an intent that reaches `main` with `Status: draft.` or `Status: accepted.` and no `spec.md` beside it.
