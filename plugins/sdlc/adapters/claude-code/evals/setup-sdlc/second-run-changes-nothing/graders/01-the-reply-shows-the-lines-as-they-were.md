---
type: llm
focus: last_message
weight: 1
---

PASS if the reply shows the budget `medium` and these lines of `~/.claude/rules/sdlc-models.md`: `sonnet` for main, `haiku` for explore, and `opus` for advise, each with the effort `high`. Saying that the rule was written again with the same content does not matter.
FAIL if the reply shows another model or effort for any role, says a line now differs from what the rule held, or does not show the lines.
