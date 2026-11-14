---
tags: [needs-write]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/sdlc:sdlc-mode build from intent/app-version/spec.md

My answers: the only file that changes is src/version/version.controller.ts, a new file. The order of work is the test first and then the controller. The proof is one unit test file that checks that GET /version answers 200 with the version from package.json. The option I rule out is reading the version from an environment variable. No open questions.
