# Design phase: write `spec.md`

This playbook turns a merged intent into the requirements and design spec. A person or a job can start it; the steps are the same.

1. Find the intent: the `intent/<change>/intent.md` the request names. It must be on the default branch and have no `spec.md` beside it. In each case below, say only that, in two or three lines, and stop: write no file and add no review of the intent.
   - The request names no intent, or the file does not exist on any branch: list each `intent/*/intent.md` on the default branch that has no `spec.md`, or say that there is none.
   - The file exists only on another branch: say that the intent is not merged yet, and name that branch.
   - `spec.md` already exists: say so and name the file.
2. Read the four policies, every time, before you write: `.agents/skills/brand-policy/SKILL.md`, `.agents/skills/security-policy/SKILL.md`, `.agents/skills/compliance-policy/SKILL.md`, and `.agents/skills/ux-policy/SKILL.md`. Then read the code and the docs the change touches.
3. Write `intent/<change>/spec.md` from the template below, in the language of the files already in `intent/`. Use exactly the template's headings.
   - **Requirements:** numbered; each one states a result a test or a reader can check.
   - **Design:** how the change fits the existing code: the files that change, and what each one does afterwards.
   - **Policies:** one line for each of the four policies: the rules of that policy the change must meet, each as a requirement number, or "Does not apply" and why.
   - **Areas of concern:** a policy rule the change cannot meet, two policies that contradict, or a decision the files do not settle. Give each one a number, the policy it comes from, and that policy's owner from `.github/CODEOWNERS`. When `.github/CODEOWNERS` names no owner for a policy's folder, write "no owner in `.github/CODEOWNERS`" in place of the owner, and add one area of concern that says so. Write "None" only when there are none.
   - **Open questions:** each open question from `intent.md`, answered with its evidence or carried forward. Write "None" only when the intent has none.
4. Commit `spec.md` on a new branch, push it, and open a pull request ready for review, as `AGENTS.md` says for branches and pull requests. Put the areas of concern first in the pull request's description, under the template's first heading. When you cannot open a pull request from this session, say so and give the pushed branch's name.
5. **Gate: the product owner reviews the spec.** The product owner resolves each area of concern with its policy owner, accepts the spec by setting `Status: accepted.` and merging the pull request, or rejects it by closing it; you do neither. Report the pull request's URL, keep it green as `AGENTS.md` says, and wait.

**Next:** `AGENTS.md`; an engineer; when the product owner has merged the spec's pull request, the engineer starts the build in plan mode with `intent.md` and `spec.md`.

## Template

```markdown
# Spec: <title>

From `intent/<change>/intent.md`. Status: draft.

## Requirements

## Design

## Policies

## Areas of concern

## Open questions
```
