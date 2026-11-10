---
"@next-friday/create-app": patch
---

The generated `.husky/pre-push` hook's refusal for a deleted branch no longer guesses that the branch's pull request merged or closed, since the remote branch may have been deleted by hand. It says the branch no longer exists on the remote, how to continue on a new branch from the latest `main`, and that `git fetch --prune` followed by `git branch --unset-upstream` lets you reuse the name.
