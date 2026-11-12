---
type: llm
focus: last_message
weight: 1
---

PASS if every mention of the pull request in the reply is the full URL https://github.com/acme/shop/pull/42, or a number written next to that URL.
FAIL if the reply names the pull request only as #42 or as "pull request 42" with no URL.
