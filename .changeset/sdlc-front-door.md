---
"@next-friday/create-app": major
---

Generated projects start work through one command, `/sdlc`, and no longer include the `write-intent` skill. `/sdlc` matches a request to a playbook in `.agents/skills/sdlc/playbooks/`: `question` answers without changing anything, and `plan` interviews the originator, drafts `intent/<change>/intent.md`, and waits for their yes before it commits or opens a pull request. A request for a later step, such as a spec or a deploy, is told that the step has no playbook yet. `/sdlc-help` explains the workflow and starts no work. Each stack's `AGENTS.md` gains a convention for replies a person can check, and tells the agent to answer a problem report with the `/sdlc` message that would start the work. If you ran `/write-intent`, send the same request with `/sdlc`.
