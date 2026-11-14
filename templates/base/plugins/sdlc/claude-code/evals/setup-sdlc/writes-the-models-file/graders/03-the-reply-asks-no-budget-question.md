---
type: llm
focus: last_message
weight: 1
---

PASS if the reply uses the budget `medium` from the request and asks the person nothing about the budget.
FAIL if the reply asks the person to choose a budget, or offers the budget choices as a question.
