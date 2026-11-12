---
tags: [needs-write]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/sdlc:sdlc ลงมือ build ตาม intent/app-version/spec.md

คำตอบของผม: ไฟล์ที่แก้คือ src/version/version.controller.ts ไฟล์ใหม่ไฟล์เดียว ลำดับงานคือเขียน test ก่อนแล้วค่อยเขียน controller ทดสอบด้วย unit test หนึ่งไฟล์ที่ตรวจว่า GET /version ตอบ 200 พร้อมเวอร์ชันจาก package.json ตัวเลือกที่ตัดทิ้งคือการอ่านเวอร์ชันจากตัวแปรสภาพแวดล้อม ไม่มีคำถามค้าง
