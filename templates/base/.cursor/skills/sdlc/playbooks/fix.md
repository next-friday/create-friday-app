# Fix phase: repair a defect with a plan and a failing test

This playbook takes a defect in behaviour that already exists to a pull request. It has no intent and no spec: its plan is the only file it adds under `intent/`.

1. Decide that the request qualifies. It qualifies only when the request is a defect in behaviour that already exists, and the fix adds no new behaviour and no new dependency and changes no schema and no public interface. When a condition fails, say which one in two lines and follow `.agents/skills/sdlc/playbooks/plan.md` instead.
2. Reproduce the defect yourself by running the code, and keep the output. Ask the person only when you can name the specific reason you cannot reach it, such as a credential or a service this session cannot use.
3. Find the cause from what running the code shows. List the candidate causes, rule each out with a command or an observation, and never guess. Name the one cause the evidence leaves. When it leaves none, or more than one, say so and ask for what is missing.
4. Write the plan from the template in `.agents/skills/sdlc/playbooks/build.md`, in the language of the files already in `intent/`, and keep the reply in the language the person wrote in. The title is `# Plan: <title> (fix)`. Use exactly the template's four headings, and keep the plan short. Name the file `intent/<short-description>/plan.md`; the folder holds only this file.
   - **Files that change:** every file, marked new, changed, or deleted, with one line on what it does afterwards.
   - **Order of work:** the cause and the evidence for it, then numbered steps. Each ends with the check that proves it.
   - **Risks:** what the fix could break, and each option you chose not to take and why.
   - **Proof:** the test that fails today and passes once the cause is fixed, and the command that runs it.

   Show the whole plan and name the file only as `intent/<short-description>/plan.md`. In plan mode you cannot write the file. Show the plan as the plan.

5. **Gate: the engineer accepts the plan.** Ask whether an engineer could fix the defect from it, and for their GitHub handle when you cannot read it. Revise until they say yes. Change no code and commit nothing before that yes. In plan mode, approving the plan is that yes.
6. Create the branch `fix/<short-description>` as `AGENTS.md` says. Set the plan's `Accepted by:` line, under its title, to the handle of the engineer who said yes in step 5, and commit `intent/<short-description>/plan.md` as the first commit.
7. Reproduce the defect as a test. Run it and check that it fails for the reason the cause gives. Commit the failing test before any fix.
8. Make the test pass without editing it. On a `fix/` branch, `.agents/hooks/agent-test-edit-gate.sh` blocks test edits once the failing test is committed. On a branch with another name, create `.git/bug-fix-in-progress` first, and delete it once the test passes.
9. Run every check under **Verifying your work** in `AGENTS.md`. Keep the output. When one fails, fix the code, and never skip, delete, or weaken a test. When a check cannot run in this session, say which one and why, and never report it as passed.
10. Go on in the same turn, without asking. Follow `.agents/skills/sdlc/playbooks/open-pr.md`, and then `.agents/skills/sdlc/playbooks/review.md`.

**Next:** `.agents/skills/sdlc/playbooks/open-pr.md`; an agent; in the same turn, as soon as step 9 passes.
