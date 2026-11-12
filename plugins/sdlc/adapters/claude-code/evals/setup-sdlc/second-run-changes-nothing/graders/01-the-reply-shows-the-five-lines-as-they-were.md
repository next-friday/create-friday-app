---
type: llm
focus: last_message
weight: 1
---

PASS if the reply shows the budget `medium` and these five lines of `.agents/sdlc-models.md`: `sonnet` for build, review, and verify, `haiku` for evals, each with the effort `high`. Saying that the file was written again with the same content does not matter.
FAIL if the reply shows another model or effort for any role, says a line now differs from what the project held, or does not show the lines.
