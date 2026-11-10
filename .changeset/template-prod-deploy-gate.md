---
"@next-friday/create-app": patch
---

Generated projects now block agents from `prod`: `.agents/hooks/agent-production-gate.sh` stops `gh workflow run` and workflow dispatches with `environment=prod`, Railway CLI commands that target `prod`, and release tag pushes (a `v<number>`, `tags/`, or `refs/tags/` ref, `--tags`, `--follow-tags`, `--mirror`, or `push.followTags`), unless the agent was started with `RELEASE_APPROVAL` set. The hook used to look for a command containing both "deploy" and "production", so it never matched the `prod` environment. `SETUP.md` documents `RELEASE_APPROVAL`, and each stack's README asks for required reviewers on `prod` only, because `dev` deploys on every push to `main`.
