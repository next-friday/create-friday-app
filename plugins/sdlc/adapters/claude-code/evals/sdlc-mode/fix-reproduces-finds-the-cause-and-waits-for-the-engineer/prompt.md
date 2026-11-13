---
tags: [needs-write]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/sdlc:sdlc-mode fix a bug: parseVersion("1.2") in src/version.ts returns "1.NaN.0" where it should return "1.2.0"
