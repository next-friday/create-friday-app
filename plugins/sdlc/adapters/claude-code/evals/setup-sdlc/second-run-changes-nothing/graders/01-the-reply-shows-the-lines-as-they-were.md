---
type: llm
focus: last_message
weight: 1
---

PASS if the reply shows the budget `medium` and the role lines the request gave, `sonnet` for main, `haiku` for explore, and `opus` for advise, each with the effort `high`, with no line changed. Showing the rule for the person to save, or saying it was written again with the same content, does not matter.
FAIL if the reply shows another model or effort for any role, says a line now differs from what the request gave, or does not show the lines.
