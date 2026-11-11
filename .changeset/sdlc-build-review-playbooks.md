---
"@next-friday/create-app": major
---

`/sdlc` now plans and builds from a merged spec, opens the pull request, reviews it, and drives it to green: send the spec's path with `/sdlc`, for example `/sdlc build intent/<change>/spec.md`, and the `build`, `open-pr`, and `review` playbooks run to the code owner's gate. The `babysit-pr` skill is removed from `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` of generated projects, and the `AGENTS.md` of every stack now points to `.agents/skills/sdlc/playbooks/review.md`; send `/sdlc` with the pull request instead, for example `/sdlc review <pull request URL>`.
