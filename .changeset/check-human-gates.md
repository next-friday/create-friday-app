---
"@next-friday/create-app": minor
---

Generated projects run `pnpm human-gates:check` in `pnpm verify` (`verify:static` in each stack) and in CI. The check reads `.agents/skills/sdlc/playbooks/*.md` and fails when a gate or a waiting step names no human role, or when a playbook lacks a `**Next:**` line that names what runs next, who runs it, and what starts it. The `plan` and `question` playbooks now carry that line, and the `plan` playbook says that in plan mode the originator approving the plan is the yes to the draft. A rejected intent is a closed pull request, no longer `Status: rejected.`; the product owner still accepts by setting `Status: accepted.` and merging.
