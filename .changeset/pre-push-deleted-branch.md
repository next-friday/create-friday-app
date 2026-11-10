---
"@next-friday/create-app": patch
---

The generated `.husky/pre-push` hook refuses a push that recreates a branch the remote deleted after its pull request merged or closed. The hook treats a branch as pushed before when `refs/remotes/<remote>/<branch>` exists or the branch upstream points at it, and the push of a new branch name still works.
