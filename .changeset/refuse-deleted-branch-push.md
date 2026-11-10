---
"@next-friday/create-app": patch
---

The generated `.husky/pre-push` hook refuses a push to a branch that this clone pushed before and that the remote no longer has. This happens when GitHub deletes the branch after its pull request merges, with **Automatically delete head branches** on, as `SETUP.md` asks. Push the follow-up work to a new branch from the latest `main` and open a pull request.
