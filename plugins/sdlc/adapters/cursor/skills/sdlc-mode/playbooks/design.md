# Design phase: write `spec.md`

This playbook turns a merged intent into the requirements and design spec.

1. Find the intent: the `intent/<change>/intent.md` the request names. It must be on the default branch and have no `spec.md` beside it. In each case below, say only that, in two or three lines, and stop: write no file and add no review of the intent.
   - The request names no intent, or the file does not exist on any branch: list each `intent/*/intent.md` on the default branch that has no `spec.md`, or say that there is none.
   - The file exists only on another branch: say that the intent is not merged yet, and name that branch.
   - `spec.md` already exists: say so and name the file.
2. Read the four policies, every time, before you write: for each of `brand`, `security`, `compliance`, and `ux`, read the project's `.agents/skills/<area>-policy/SKILL.md` when it exists, and the plugin's default at `../../<area>-policy/SKILL.md`, relative to this playbook, otherwise. Then read the code and the docs the change touches.
3. Write `intent/<change>/spec.md` from the template below. Use exactly the template's headings.
   - **Request:** under the status line, quote the words of the request that started this spec. End the line with `Skills at <hash>.`, the short hash of the last commit that changed the plugin's files in this repository: `git log -1 --format=%h -- plugins/sdlc`. When the plugin is not in this repository, write `Skills at unknown.`
   - **Requirements:** numbered. Each one states a result a test or a reader can check.
   - **Design:** how the change fits the existing code: the files that change, and what each one does afterwards.
   - **Policies:** one line for each of the four policies. State which rules of that policy the change must meet, each as a requirement number, or write "Does not apply" and why.
   - **Areas of concern:** a policy rule the change cannot meet, two policies that contradict, or a decision the files do not settle. Give each one a number and the policy it comes from. Under each, on a line of its own, write `Decision: <the decision you propose>.` Write "None" only when there are none.
   - **Open questions:** each open question from `intent.md`, answered with its evidence or carried forward. Write "None" only when the intent has none.
4. Commit `spec.md` on a new branch. In the same commit, set the intent's status line to `Status: accepted.`, because its pull request is merged. Push the branch, and open a pull request ready for review, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests. When you cannot open a pull request from this session, say so and give the pushed branch's name.
5. **Gate: the product owner reviews the spec.** The product owner corrects the `Decision:` line under each area of concern, with its policy owner, then merges the pull request to accept the spec and those decisions as written, or closes it to reject it. Change a `Decision:` line when they tell you its text. For a change the spec classes as higher risk, the product owner consults a tech lead before accepting. You do none of these. The spec stays `Status: draft.`: never write `Status: accepted.` in this pull request, because the plan's commit sets it. Report the pull request's URL, keep it green as `playbooks/review.md` says, and wait.

**Hands off to:** `playbooks/build.md`; an engineer with an agent; when the product owner has merged the spec's pull request and the engineer sends `/sdlc:sdlc-mode build` with the spec's path.

## Template

```markdown
# Spec: <title>

From `intent/<change>/intent.md`. Status: draft.

Request: "<the words of the request that started this spec>".

## Requirements

## Design

## Policies

## Areas of concern

## Open questions
```
