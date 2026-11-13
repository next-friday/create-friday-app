---
type: llm
focus: last_message
weight: 1
---

PASS if the reply says the verifier subagent starts on the `explore` model, `opus` at the effort `xhigh`, and gives `~/.claude/rules/sdlc-models.md` as the source.
A caveat about what the reply did not check does not matter.
FAIL if the reply names another model or effort for the verifier, says the model is unknown or the session's default, or does not cite the rule.
