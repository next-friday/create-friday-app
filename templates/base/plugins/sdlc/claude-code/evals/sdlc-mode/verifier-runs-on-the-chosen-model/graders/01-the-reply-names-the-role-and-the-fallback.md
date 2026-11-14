---
type: llm
focus: last_message
weight: 1
---

PASS if the reply says the verifier subagent starts on the `explore` model, and that because the rule `~/.claude/rules/sdlc-models.md` is missing or cannot be read, it starts on the session's own model.
A caveat about what the reply did not check does not matter.
FAIL if the reply names a specific model or effort as read from a rule, says the verifier runs on the `advise` model, or does not say what happens with no rule.
