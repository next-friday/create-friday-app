# Plan: write `intent.md`

1. Let the originator describe the problem in their own words: what they cannot do today, who is affected, what better looks like, and what is out of scope.
2. Read the code, the docs, and the existing `intent/` folders. Never ask what a file can tell you.
3. Interview in rounds until no decision is left to guess. Each round, ask every question whose prerequisites are settled, numbered, each with your recommended answer, worded so "yes" accepts it. Wait for the answers, and build the next round on them. Aim at the problem (who, how often, and a number with its source), the outcome as the user would see it, the constraints, and what is out of scope. A decision the originator cannot make yet becomes an open question.
4. Write `intent/<change>/intent.md` from the template below, where `<change>` is a short kebab-case name. Show the whole draft.
5. **Gate: the originator corrects the draft.** Ask whether it matches what they meant, and revise until they say yes. Commit nothing, push nothing, and open no pull request before that yes.
6. Commit `intent.md` on a new branch, push it, and open a pull request ready for review, as `AGENTS.md` says for branches and pull requests.
7. **Gate: the product owner accepts or rejects the intent.** Merging the pull request with `Status: accepted.` accepts it; setting `Status: rejected.` and merging rejects it. Report the pull request's URL and stop.

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
