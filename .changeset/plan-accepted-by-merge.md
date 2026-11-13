---
"@next-friday/create-app": minor
---

feat(templates): accept a plan by merging its pull request

In a generated project, the `sdlc` plugin now records who approved at three gates:

- A plan is committed in a pull request of its own, and the engineer accepts it by merging that pull request. The code follows in a second pull request, and `pnpm plan:check` fails a branch that adds a plan together with code.
- With `GH_TOKEN` and `gh`, `pnpm plan:check` fails a plan whose `Accepted by:` line is not the account that merged the plan's pull request.
- A spec carries a `Decision:` line under each area of concern and the commit of the skills that wrote it, and an intent names its author by handle.
