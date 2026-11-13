# Build phase: plan, then implement

This playbook turns a merged spec into a plan the engineer accepts, and then into working code.

1. Find the change: the `intent/<change>/` folder whose `spec.md` or `plan.md` the request names. Its `spec.md` must be on the default branch beside its `intent.md`. In each case below, say only that, in two or three lines, and stop: write no file.
   - The request names no change, or the folder has no `spec.md` on any branch: list each `intent/*/` on the default branch that has a `spec.md` and no `plan.md`, or say that there is none.
   - The spec exists only on another branch: say that the spec is not merged yet, and name that branch.
   - `intent/<change>/plan.md` is already on the default branch: say that the plan is merged, name the file, and say that the change is built only when each requirement of `spec.md` is checked against the tree.

   When the request is a bug fix with no spec, none of these cases applies: follow `playbooks/fix.md` instead.

2. When `intent/<change>/plan.md` exists on a branch that is not merged, check out that branch. When the request says the plan is accepted, go to step 6. Otherwise show that plan and go to step 5.
3. Read `intent.md`, `spec.md`, the four policies, found as `playbooks/design.md` step 2 says, and the code the change touches. Start from the accepted spec, in the agent tool's plan mode when it has one, and give the plan the change's `intent.md` and `spec.md`. Then interview the engineer until they have said four things: the files the change touches, the order of the work, the tests that prove it, and each option they rule out.
   - **When all four are already said, in the request or in the files, go to step 4 in the same turn.**
   - **When one is missing, ask and stop.** Write no plan in that turn. Ask in rounds, as step 3 of `playbooks/plan.md` does: numbered questions, each with a recommended answer or "No recommendation". Wait for the answers, and build the next round on them.
4. Write the plan from the template below. Use exactly the template's headings. The date in the title is the date of the last commit to `intent/<change>/intent.md`: `git log -1 --format=%cs -- intent/<change>/intent.md`. An engineer who has never seen this conversation must be able to implement the change from the plan alone.
   - **Files that change:** every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work:** numbered steps. Each ends with the check that proves it.
   - **Risks:** what the change could break, which step is the riskiest, and each option you chose not to take and why.
   - **Proof:** the tests and commands that show every requirement of the spec is met, by requirement number, and the test or review step for each policy requirement the spec cites.

   Show the whole plan and name the file only as `intent/<change>/plan.md`. In plan mode you cannot write the file. Show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Ask whether an engineer could build from it, and for their GitHub handle when you cannot read it. Revise until they say yes. Change no code and commit nothing before that yes. In plan mode, approving the plan is that yes. When the spec classes the change as higher risk, say that a tech lead or an architect accepts the plan with the engineer.
6. Create the branch as `playbooks/open-pr.md` says, unless step 2 checked one out. Set the plan's `Accepted by:` line, under its title, to the handle of the engineer who said yes in step 5 or whom the request names, and commit `intent/<change>/plan.md` before any other change. In that commit, set the spec's status line to `Status: accepted.`, because its pull request is merged.
7. Implement the plan in its order. After each step, run the check that proves it and fix what fails. For a bug fix, follow `playbooks/fix.md` steps 7 and 8: commit the failing test on a `fix/` branch, and the gate then blocks test edits. When the work departs from the plan, change `plan.md` in the same commit. When the change meets the last requirement of `spec.md`, set `Status: done.` in `intent.md` and `spec.md`.
8. Run every check under **Verifying your work** in the project's `AGENTS.md` and keep the output. Every check must pass: fix the code, and never skip, delete, or weaken a test. Then run the `verifier` subagent and fix what it reports. Start it on the model that `.agents/sdlc-models.md` names after `verify:`, at the effort on that line when the session can set one; when you cannot start a subagent, do what `../../../agents/verifier.md`, relative to this playbook, says yourself. For UI work, when `.mcp.json` lists a `playwright` server, also close the loop with a visual check: start the app, give the browser tool the page and the mock the spec or the request names, screenshot, compare, and adjust, and repeat until it matches; two or three rounds is normal. When a check cannot run in this session, say which one and why, and never report it as passed.
9. Go on in the same turn, without asking: follow `playbooks/open-pr.md`, and then `playbooks/review.md`. Pushing the branch and opening the pull request are part of this task.

**Next:** `playbooks/open-pr.md`; an agent; in the same turn, as soon as step 8 passes.

## Template

```markdown
# Plan: <title> (from intent.md <YYYY-MM-DD>)

Accepted by: @<engineer>.

## Files that change

## Order of work

## Risks

## Proof
```
