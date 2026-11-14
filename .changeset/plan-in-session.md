---
"@next-friday/create-app": minor
---

The `sdlc` plugin adds a correction to the project's agent instructions when a person corrects the same mistake twice. Its `build` and `fix` playbooks take the engineer's acceptance of a plan in the session, and put `plan.md` in one pull request with the code and one changeset for the whole change; `pnpm plan:check` no longer asks for a pull request that holds only the plan. Before pushing or handing over a patch, the agent runs each CI check it can run on the changed files and says which it cannot.
