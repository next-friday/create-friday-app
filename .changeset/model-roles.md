---
"@next-friday/create-app": minor
---

The `sdlc` plugin routes work by model. `/sdlc:setup-sdlc` now sets three roles, `main`, `explore`, and `advise` (defaults Sonnet, Haiku, and Opus), and writes them into a rule in the person's home directory that the agent tool loads in every session, in place of `.agents/sdlc-models.md`. The playbooks start a subagent on the `explore` model to read files and to run the `verifier`, and one on the `advise` model when a plan is written, when the same check fails twice, and before work is reported done. Run `/sdlc:setup-sdlc` again to write the new rule; an existing `.agents/sdlc-models.md` is no longer read.
