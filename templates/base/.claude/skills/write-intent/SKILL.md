---
name: write-intent
description: Write intent.md, the proto-spec that starts a change, by interviewing the originator. Run it with /write-intent.
disable-model-invocation: true
---

# Write intent.md

1. Let the originator describe the problem in their own words: what they cannot do today, who is affected, what better looks like, and what is out of scope.
2. Interview them in rounds until no decision is left to guess. Each round, ask every question whose prerequisites are already settled, numbered, each with your recommended answer, worded so "yes" accepts it. Then wait for the answers, and build the next round on them. Aim at the problem (who, how often, and a number with its source), the outcome as the user would see it, the constraints, and what is out of scope.
3. Find facts yourself: read the code, the docs, and the existing `intent/` folders before you ask, and never ask what a file can tell you. Put only decisions to the originator. When they cannot answer one yet, record it as an open question instead of guessing.
4. Write the result as `intent/<change>/intent.md`, where `<change>` is a short kebab-case name, using the template below. Show the whole draft, and ask whether it matches what they meant. Revise it until they say it does.
5. When the originator confirms the draft, commit `intent.md` and open a pull request. The product owner accepts it by merging the pull request, or rejects it by setting `Status: rejected.` and merging.

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
