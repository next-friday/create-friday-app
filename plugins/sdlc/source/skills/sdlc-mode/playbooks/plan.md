# Plan phase: write `intent.md`

This playbook writes the intent. The build plan, `intent/<change>/plan.md`, comes later and is not written here.

1. Let the originator describe the problem in their own words: what they cannot do today, who is affected, what better looks like, and what is out of scope.
2. Read the code, the docs, and the existing `intent/` folders. Find the rest yourself, as `.agents/rules/agent-owned-work.md` says: the author, for one, is `git config user.name`.
3. Interview until the originator has said four things: the problem, the outcome, the constraints, and what is out of scope. The problem names who is affected, how often, and a number with its source. The outcome is what the user would see.
   - **When all four are already said, go to step 4 in the same turn.**
   - **When one is missing, ask and stop.** Write no draft in that turn. Ask in rounds. Each round holds only questions that do not depend on another question in the same round. Number the questions. Each asks one thing and carries a concrete answer you recommend, worded so "yes" accepts it. A recommended answer is a fact or a choice, such as "Recommended: only the checkout page", never an instruction to the person. When you have no answer to recommend, write "No recommendation" and ask plainly. Wait for the answers, and build the next round on them.
4. Write `intent/<change>/intent.md` from the template below, where `<change>` is a short kebab-case name. Write the file in the language of the files already in `intent/`. Use exactly the template's five headings. What is out of scope goes under **Proposed outcome**. Anything else that is unknown, unverified, or not yet decided goes under **Open questions**. Write "None" only when nothing is, and never list what the originator already answered. Show the whole draft, and name the file only as `intent/<change>/intent.md`. In plan mode you cannot write the file. Show the draft as the plan, and write the file once it is approved.
5. **Gate: the originator corrects the draft.** Ask whether it matches what they meant, and revise until they say yes. Commit nothing, push nothing, and open no pull request before that yes. In plan mode, the originator approving the plan is that yes.
6. Commit `intent.md` on a new branch, push it, and open a pull request ready for review, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests.
7. **Gate: the product owner accepts or rejects the intent.** The product owner merges the pull request to accept the intent, or closes it to reject it. You do neither. The file stays `Status: draft.`: never write `Status: accepted.` in this pull request, because the spec's pull request sets it. Report the pull request's URL, keep it green as `playbooks/review.md` says, and wait.

**Next:** `playbooks/design.md`; an agent; when the product owner has merged the intent's pull request and a person or a job asks for the spec.

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
