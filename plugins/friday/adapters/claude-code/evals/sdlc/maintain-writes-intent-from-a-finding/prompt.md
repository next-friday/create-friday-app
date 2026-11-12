---
tags: [needs-write]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/friday:sdlc งานตรวจอัตโนมัติพบว่า GET /health ตอบ 500 ทุกครั้งตั้งแต่ commit ล่าสุด log: "TypeError: Cannot read properties of undefined (reading 'status')" ที่ src/health/health.controller.ts ไม่มีคนให้ถาม
