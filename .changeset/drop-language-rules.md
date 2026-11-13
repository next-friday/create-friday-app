---
"@next-friday/create-app": patch
---

A generated project no longer tells the agent which language to write in. The `sdlc` playbooks, the `sdlc-help` skill, and `AGENTS.md` lose their language rules, the eval cases under `.agents/skill-evals/` lose the checks that required a Thai reply, and their prompts are in English.
