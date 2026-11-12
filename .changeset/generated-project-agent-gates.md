---
"@next-friday/create-app": minor
---

A generated project has no `pnpm human-gates:check`, `pnpm intent:check`, `pnpm suppressions:check`, or `pnpm peers:check` command, no `scripts/check-human-gates.ts` or `scripts/check-intent.ts`, and no `.agents/hooks/agent-suppression-gate.sh`. `pnpm verify:static`, the `pnpm check` that `pre-push` runs, and the CI workflow run `pnpm rules:check`, `pnpm gates:check`, `pnpm plan:check`, `pnpm bands:check`, and the other static checks without them. `/sdlc` runs no intent checker.

The `pre-push` hook rejects a push to `main` and then runs `pnpm check`. It does not reject a push of a branch whose remote branch no longer exists.

The shell gate `.agents/hooks/agent-shell-gate.sh` blocks shell writes to protected files and `gh` commands that merge a pull request, approve one, or approve a deployment. It does not look for `--no-verify`, `git commit -n`, `HUSKY=0`, `core.hooksPath`, git aliases, `git commit-tree`, `git update-ref`, `gh repo delete`, `gh issue delete`, `gh release delete`, or a `gh api` call that reads its input from a file, and it never asks before a command, including `git push --force`, `git reset --hard`, `git clean`, `git branch -D`, `git stash drop`, and `git worktree remove --force`. `.claude/settings.json` denies edits to the protected files and `gh pr merge`; it does not deny the commands in this paragraph. The MCP gate blocks `merge_pull_request`, `enable_pr_auto_merge`, and `pull_request_review_write` with the event `APPROVE` in any letter case, and allows review comments and change requests.

`RELEASE_APPROVAL` lifts `.agents/hooks/agent-production-gate.sh` for every value except an empty value, `0`, `false`, and `no`, in any letter case. `SETUP.md` and each stack's `AGENTS.md` say so.

`.claude/managed-settings.example.json` sets no `allowManagedHooksOnly`, allows the MCP server `npx @playwright/mcp@0.0.83`, and allows `pnpm build`, `pnpm test`, and `pnpm lint:check`.
