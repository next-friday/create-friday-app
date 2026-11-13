# Fix phase: repair a defect with a plan and a failing test

This playbook takes a defect in behaviour that already exists to a pull request. It has no intent and no spec: its plan is the only file it adds under `intent/`.

1. Decide that the request qualifies. It qualifies only when the request is a defect in behaviour that already exists, and the fix adds no new behaviour and no new dependency and changes no schema and no public interface. When a condition fails, say which one in two lines and follow `playbooks/plan.md` instead. When `intent/<short-description>/plan.md` for this defect is already on the default branch, the engineer accepted it by merging its pull request: go to step 7.
2. Reproduce the defect yourself by running the code, and keep the output. Ask the person only when you can name the specific reason you cannot reach it, such as a credential or a service this session cannot use.
3. Find the cause from what running the code shows. List the candidate causes, rule each out with a command or an observation, and never guess. Name the one cause the evidence leaves. When it leaves none, or more than one, say so and ask for what is missing.
4. Write the plan from the template in `playbooks/build.md`, and have it reviewed on the `advise` model as `playbooks/build.md` step 4 says, with the plan and the cause in place of `spec.md`. The title is `# Plan: <title> (fix)`. Use exactly the template's four headings, and keep the plan short. Name the file `intent/<short-description>/plan.md`; the folder holds only this file.
   - **Files that change:** every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work:** the cause and the evidence for it, then numbered steps. Each ends with the check that proves it.
   - **Risks:** what the fix could break, and each option you chose not to take and why.
   - **Proof:** the test that fails today and passes once the cause is fixed, and the command that runs it.

   Show the whole plan and name the file only as `intent/<short-description>/plan.md`. In plan mode you cannot write the file. Show the plan as the plan.

5. Commit `intent/<short-description>/plan.md` on a new branch, with the `Accepted by:` line as the template has it, push it, and open a pull request that changes no file outside `intent/`, as the opening paragraph of `playbooks/open-pr.md` says for branches and pull requests. In plan mode, the engineer's approval lets you write the file and do this step; it is not the acceptance.
6. **Gate: the engineer accepts the plan.** The engineer merges that pull request to accept the plan, or closes it to reject it. You never merge it, and you change no file outside `intent/` before it is merged. Revise the plan as the engineer asks; each revision is a commit on that branch. Report the pull request's URL, or the pushed branch's name when you could not open one, keep it green as `playbooks/review.md` says, and wait.
7. When the plan's pull request is merged, create the branch `fix/<short-description>` as `playbooks/open-pr.md` says. In its first commit, set the plan's `Accepted by:` line, under its title, to the account that merged that pull request, read from the host. When you cannot read the host, confirm with `git fetch` that the plan is on the default branch, and write the handle the engineer gives; ask for it when they gave none. Never write a handle the host or the engineer did not give.
8. Reproduce the defect as a test. Run it and check that it fails for the reason the cause gives. Commit the failing test before any fix.
9. Make the test pass without editing it. When the test fails a second time after a fix, start a subagent on the `advise` model as `playbooks/build.md` step 8 says.
10. Run every check the project's agent instructions name. Keep the output. Before you report the fix done, have it reviewed on the `advise` model as `playbooks/build.md` step 9 says, with the plan in place of `spec.md`. When one fails, fix the code, and never skip, delete, or weaken a test. When a check cannot run in this session, say which one and why, and never report it as passed.
11. Go on in the same turn, without asking. Follow `playbooks/open-pr.md`, and then `playbooks/review.md`.

**Hands off to:** `playbooks/open-pr.md`; an agent; in the same turn, as soon as step 10 passes.
