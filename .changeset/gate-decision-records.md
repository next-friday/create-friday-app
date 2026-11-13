---
"@next-friday/create-app": minor
---

feat(templates): record each gate decision

In a generated project:

- Each hook that allows or blocks an action appends a line to `.agents/logs/gate-decisions.jsonl`, which git ignores: the time, the hook, the decision, the reason for a block, and the session. The line holds no command text.
- `RELEASE_APPROVAL` lifts the production gate only when it matches the expression in the new `.agents/release-approval-form`, shipped as `^[A-Z]+-[0-9]+$`. A value such as `1`, which lifted the gate before, no longer does: set the form to your organization's approval records. A lifted gate records the value and the Git user name.
