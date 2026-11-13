---
"@next-friday/create-app": patch
---

fix(templates): close gaps in the plan gate

- `pnpm plan:check` stops with the host tool's error when `GH_TOKEN` is set and the host cannot be read, where it passed without checking who merged the plan.
- The `build` and `fix` playbooks commit and push the plan in one step and wait for the engineer's merge in the next, pick up a plan that is already merged or already on a branch, and confirm a merged plan with `git fetch` when the host cannot be read.
- A handle may hold an underscore.
