# Build phase: plan, then implement

This playbook turns a merged spec into a plan the engineer accepts, and then into working code.

1. Find the change: the `intent/<change>/` folder whose `spec.md` or `plan.md` the request names. Its `spec.md` must be on the default branch beside its `intent.md`. In each case below, say only that, in two or three lines, and stop: write no file.
   - The request names no change, or the folder has no `spec.md` on any branch: list each `intent/*/` on the default branch that has a `spec.md` and no `plan.md`, or say that there is none.
   - The spec exists only on another branch: say that the spec is not merged yet, and name that branch.
   - `intent/<change>/plan.md` is on the default branch and `spec.md` says `Status: done.`: say that the change is built, and name both files.

   When the request is a bug fix with no spec, none of these cases applies: follow `playbooks/fix.md` instead.

2. When `intent/<change>/plan.md` is on the default branch, the engineer accepted it by merging its pull request: go to step 6. When it exists only on a branch that is not merged, check out that branch, show that plan, and go to step 5.
3. Read `intent.md`, `spec.md`, the four policies, found as `playbooks/design.md` step 2 says, and the code the change touches. Start from the accepted spec, in the agent tool's plan mode when it has one, and give the plan the change's `intent.md` and `spec.md`. Then interview the engineer until they have said four things: the files the change touches, the order of the work, the tests that prove it, and each option they rule out.
   - **When all four are already said, in the request or in the files, go to step 4 in the same turn.**
   - **When one is missing, ask and stop.** Write no plan in that turn. Ask in rounds, as step 3 of `playbooks/plan.md` does: numbered questions, each with a recommended answer or "No recommendation". Wait for the answers, and build the next round on them.
4. Write the plan from the template below. Use exactly the template's headings. An engineer who has never seen this conversation must be able to implement the change from the plan alone.
   - **Files that change:** every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work:** numbered steps. Each ends with the check that proves it.
   - **Risks:** what the change could break, which step is the riskiest, and each option you chose not to take and why.
   - **Proof:** the tests and commands that show every requirement of the spec is met, by requirement number, and the test or review step for each policy requirement the spec cites.

   Show the whole plan and name the file only as `intent/<change>/plan.md`. In plan mode you cannot write the file. Show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Commit `intent/<change>/plan.md` on a new branch, with the `Accepted by:` line as the template has it. In that commit, set the spec's status line to `Status: accepted.`, because its pull request is merged. Push the branch and open a pull request that changes no file outside `intent/`, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests. Revise the plan as the engineer asks; each revision is a commit on that branch. The engineer merges that pull request to accept the plan, or closes it to reject it. You never merge it, and you change no file outside `intent/` before it is merged. In plan mode, the engineer's approval lets you write the file and open this pull request; it is not the acceptance. When the spec classes the change as higher risk, say that a tech lead or an architect approves that pull request before it is merged. Report the pull request's URL, keep it green as `playbooks/review.md` says, and wait.
6. When the plan's pull request is merged, create a new branch as `playbooks/open-pr.md` says. In its first commit, set the plan's `Accepted by:` line, under its title, to the account that merged that pull request, read from the host. When that pull request has an approving review from a second person, add `Also accepted by: @<handle>.` on the next line. When you cannot read the host, write the handle the engineer gives. Never write a handle the host or the engineer did not give.
7. Implement the plan in its order. After each step, run the check that proves it and fix what fails. For a bug fix, follow `playbooks/fix.md` steps 7 and 8: commit the failing test on a `fix/` branch, and the gate then blocks test edits. When the work departs from the plan, change `plan.md` in the same commit. When the change meets the last requirement of `spec.md`, set `Status: done.` in `intent.md` and `spec.md`.
8. Run every check the project's agent instructions name and keep the output. Every check must pass: fix the code, and never skip, delete, or weaken a test. Then run the `verifier` subagent and fix what it reports. Start it on the model that `.agents/sdlc-models.md` names after `verify:`, at the effort on that line when the session can set one; when you cannot start a subagent, do what `../../../agents/verifier.md`, relative to this playbook, says yourself. For UI work, when the session has a browser tool, also close the loop with a visual check: start the app, give the browser tool the page and the mock the spec or the request names, screenshot, compare, and adjust, and repeat until it matches; two or three rounds is normal. When a check cannot run in this session, say which one and why, and never report it as passed.
9. Go on in the same turn, without asking: follow `playbooks/open-pr.md`, and then `playbooks/review.md`. Pushing the branch and opening the pull request are part of this task.

**Next:** `playbooks/open-pr.md`; an agent; in the same turn, as soon as step 8 passes.

## Template

```markdown
# Plan: <title>

Accepted by: @<engineer>.

## Files that change

## Order of work

## Risks

## Proof
```
