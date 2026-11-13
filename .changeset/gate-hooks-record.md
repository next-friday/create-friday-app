---
"@next-friday/create-app": patch
---

fix(templates): make the gate hooks record and check the approval form

Version 9.5.0 shipped `.agents/release-approval-form` and the `SETUP.md` text for it without the hooks that use them. In a generated project, the hooks now do what that text says:

- Each hook that allows or blocks an action appends a line to `.agents/logs/gate-decisions.jsonl`: the time, the hook, the decision, the session, and a fixed reason for a block. The line holds no command text and no path.
- `RELEASE_APPROVAL` lifts the production gate only when it matches the first line of `.agents/release-approval-form`. A value such as `1` no longer lifts it. A lifted gate records the value and the Git user name.
- A hook blocks, with a message that names the file, when `.agents/hooks/record-gate-decision.sh` cannot be loaded.
