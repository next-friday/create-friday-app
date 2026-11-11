# Plan: write `intent.md`

1. Let the originator describe the problem in their own words: what they cannot do today, who is affected, what better looks like, and what is out of scope.
2. Read the code, the docs, and the existing `intent/` folders. Never ask what a file or a command can tell you: the author, for one, is `git config user.name`.
3. Interview until the originator has said four things: the problem (who, how often, and a number with its source), the outcome as the user would see it, the constraints, and what is out of scope.
   - **When all four are already said, go to step 4 in the same turn.**
   - **When one is missing, ask and stop.** Write no draft in that turn. Ask in rounds: each round holds only questions that do not depend on another question in the same round, numbered, each with a concrete answer you recommend, worded so "yes" accepts it. A recommended answer is a fact or a choice, such as "Recommended: only the checkout page", never an instruction to the person. When you have no answer to recommend, write "No recommendation" and ask plainly. Wait for the answers, and build the next round on them.
4. Write `intent/<change>/intent.md` from the template below, where `<change>` is a short kebab-case name. Write the file in the language of the files already in `intent/`. Use exactly the template's five headings; what is out of scope goes under **Proposed outcome**. Anything else that is unknown, unverified, or not yet decided goes under **Open questions**; write "None" only when nothing is, and never list what the originator already answered. Show the whole draft.
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
