---
"@next-friday/create-app": patch
---

A generated project's `pnpm gates:check` and `pnpm evals:run` run their scratch `git` commands, the gate scripts, and the agent command without the variables that `git rev-parse --local-env-vars` lists, such as `GIT_DIR`. Run from a git hook, as `pnpm verify` is in the pre-push hook, they no longer add commits or branches to the repository that pushes.
