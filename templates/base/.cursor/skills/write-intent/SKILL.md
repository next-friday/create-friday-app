---
name: write-intent
description: Write intent.md, the proto-spec that starts a change. Use whenever someone describes an idea, a problem, or a change they want, before a spec or code exists.
---

# Write intent.md

1. Let the originator describe the problem in their own words: what they cannot do today, who is affected, what better looks like, and what is out of scope.
2. Brainstorm until the idea is concrete. Ask the questions an analyst would ask: scope, users, constraints, and what success looks like.
3. Write the result as `intent/<change>/intent.md`, where `<change>` is a short kebab-case name, using the template below.
4. Ask the originator to correct anything you misunderstood.
5. Commit `intent.md` and open a pull request. The product owner accepts it by merging the pull request, or rejects it by closing it.

## Template

```markdown
# Intent: <title>

Author: <name> (<team>). Status: draft.

## Problem

## Proposed outcome

## Affected users and systems

## Constraints

## Open questions
```
