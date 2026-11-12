---
tags: [skill-creator]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/sdlc แก้บั๊ก: parseVersion("1.2") ใน src/version.ts คืนค่า "1.NaN.0" ทั้งที่ควรได้ "1.2.0"
