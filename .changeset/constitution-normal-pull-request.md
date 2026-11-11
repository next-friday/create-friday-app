---
"@next-friday/create-app": patch
---

Generated projects' `constitution-changes` rule (`.agents/rules/constitution-changes.md`, `.agents/rules.json`, and the rendered `.claude/rules` and `.cursor/rules` copies) now says the constitution changes in a pull request like any other change, and a code owner approves it in review. It no longer requires a dedicated issue. When a task needs a constitution change, the agent writes the exact new text and the files it goes in on the pull request, and a person commits it to that branch.
