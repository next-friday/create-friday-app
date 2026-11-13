# Open the pull request

Branch from the latest `origin/main`, and open the pull request ready for review. Name the branch as the project's contributing guide says and fill the body from `.github/pull_request_template.md`. Never merge a pull request: a person merges it with `--squash` after code owner approval, bottom-up for a stack of pull requests.

1. Clean the diff against the default branch. Remove debug output, commented-out code, changes the plan does not name, and comments that add nothing the code does not show.
2. Do what the project's `AGENTS.md` and `CONTRIBUTING.md` require for this kind of change.
3. When step 1 or 2 changed a file, run the checks the project's agent instructions name again. When one fails, fix the code and run it again. Commit only when they pass.
4. Push the branch and open the pull request ready for review, as this playbook's opening paragraph says. When the branch already has a pull request, update that one. Fill the body from `.github/pull_request_template.md`:
   - what changed and why, with the paths of `intent/<change>/spec.md` and `plan.md` when they exist;
   - `Closes #<issue>` for each issue that already exists and that the change closes. When there is none, write what the template's own section asks for, and leave it out when the template has no such section.
   - each check you ran, with its result copied from the output.

   When you cannot open a pull request from this session, say so, give the pushed branch's name, and go on to step 5: the review reads the pushed branch's diff.

5. Go on in the same turn, without asking: follow `playbooks/review.md`.

**Next:** `playbooks/review.md`; an agent; in the same turn, as soon as step 4 is done.
