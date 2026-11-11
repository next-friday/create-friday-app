---
"@next-friday/create-app": major
---

Generated projects no longer include the `git-workflow` and `script-driven-changes` agent skills, in `.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`, or the links to them in `.cursor/BUGBOT.md`. Each stack's `AGENTS.md` has a new convention with the rules from `git-workflow` that no Git hook enforces: branch from the latest `origin/main` as `<type>/<short-description>`, open the pull request ready for review, drive it until it waits only on code owner approval, rebase and force-push with lease only your own branches, and leave the merge to a person. If a script or habit in your project calls either skill, use the `AGENTS.md` convention instead.
