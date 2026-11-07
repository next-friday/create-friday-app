---
"@next-friday/create-app": major
---

Generated projects follow Anthropic's AI-native SDLC Playbook in Claude Code and Cursor: `SETUP.md` replaces the setup steps in `README.md`; `intent/`, `lessons/`, `evals/`, `bands.yaml`, skills, a `verifier` subagent, and a review policy are written once in the project and in `.agents/`, and `pnpm rules:sync` renders them for each tool; sessions start in plan mode; new hooks format edits, block test edits during a bug fix, and gate production deploys; CI triages failed builds; `@claude` fixes review comments.

Migration: generate a new project with the same stack, copy the new files, and follow its `SETUP.md`.
