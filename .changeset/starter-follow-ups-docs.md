---
"@next-friday/create-app": patch
---

A generated project's `AGENTS.md` now says that `RELEASE_APPROVAL` lifts the production gate only when it matches the first line of `.agents/release-approval-form`, as the gate has applied it since 9.5.1. The production gate paragraph of `AGENTS.md` and `SETUP.md` is held once, and a project with the deploy target `none` no longer says in `CONTRIBUTING.md` that a deploy promotes a commit.
