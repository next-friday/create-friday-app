# Build phase: plan, then implement

This playbook turns a merged spec into a plan the engineer accepts, and then into working code.

1. Find the change: the `intent/<change>/` folder whose `spec.md` or `plan.md` the request names. Its `spec.md` must be on the default branch beside its `intent.md`. In each case below, say only that, in two or three lines, and stop: write no file.
   - The request names no change, or the folder has no `spec.md` on any branch: list each `intent/*/` on the default branch that has a `spec.md` and no `plan.md`, or say that there is none.
   - The spec exists only on another branch: say that the spec is not merged yet, and name that branch.
   - `intent/<change>/plan.md` is already on the default branch: say that the change is built, and name the file.

   When the request is a bug fix with no spec, none of these cases applies: follow `.agents/skills/sdlc/playbooks/fix.md` instead.

2. When `intent/<change>/plan.md` exists on a branch that is not merged, check out that branch. When the request says the plan is accepted, go to step 7. Otherwise show that plan and go to step 5.
3. Read `intent.md`, `spec.md`, and the code the change touches.
4. Write the plan from the template below, in the language of the files already in `intent/`. Use exactly the template's headings. The date in the title is the date of the last commit to `intent/<change>/intent.md`: `git log -1 --format=%cs -- intent/<change>/intent.md`. An engineer who has never seen this conversation must be able to implement the change from the plan alone.
   - **Files that change:** every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work:** numbered steps. Each ends with the check that proves it.
   - **Risks:** what the change could break, which step is the riskiest, and each option you chose not to take and why.
   - **Proof:** the tests and commands that show every requirement of the spec is met, by requirement number.

   Show the whole plan and name the file only as `intent/<change>/plan.md`. In plan mode you cannot write the file. Show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Ask whether an engineer could build from it, and revise until they say yes. Change no code and commit nothing before that yes. In plan mode, approving the plan is that yes. When the spec classes the change as higher risk, say that a tech lead or an architect accepts the plan with the engineer.
6. Create the branch as `AGENTS.md` says. Set the plan's `Accepted by:` line, under its title, to the engineer who said yes in step 5, and commit `intent/<change>/plan.md` as its first commit.
7. Implement the plan in its order. After each step, run the check that proves it and fix what fails. For a bug fix, follow **Start a bug fix with a failing test** in `AGENTS.md`: commit the test on a `fix/` branch, and the gate then blocks test edits. When the work departs from the plan, change `plan.md` in the same commit.
8. Run every check under **Verifying your work** in `AGENTS.md` and keep the output. Every check must pass: fix the code, and never skip, delete, or weaken a test. Then look for `.claude/agents/verifier.md`: when it exists, run the `verifier` subagent and fix what it reports; when you cannot start a subagent, do what that file says yourself. When a check cannot run in this session, say which one and why, and never report it as passed.
9. Go on in the same turn, without asking: follow `.agents/skills/sdlc/playbooks/open-pr.md`, and then `.agents/skills/sdlc/playbooks/review.md`. Pushing the branch and opening the pull request are part of this task.

**Next:** `.agents/skills/sdlc/playbooks/open-pr.md`; an agent; in the same turn, as soon as step 8 passes.

## Template

```markdown
# Plan: <title> (from intent.md <YYYY-MM-DD>)

Accepted by: @<engineer>.

## Files that change

## Order of work

## Risks

## Proof
```
