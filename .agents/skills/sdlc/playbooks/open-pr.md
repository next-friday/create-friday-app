# Open the pull request

The `build` playbook ends here. Nothing in it stops for a person.

1. Clean the diff against the default branch. Remove debug output, commented-out code, changes the plan does not name, and comments that `.agents/rules/code-comments.md` does not allow.
2. Do what `AGENTS.md` and `CONTRIBUTING.md` require of every change, such as a release note.
3. When step 1 or 2 changed a file, run the checks under **Verifying your work** in `AGENTS.md` again. When one fails, fix the code and run it again. Commit only when they pass.
4. Push the branch and open the pull request ready for review, as `AGENTS.md` says for branches and pull requests. When the branch already has a pull request, update that one. Fill the body from `.github/pull_request_template.md`:
   - what changed and why, with the paths of `intent/<change>/spec.md` and `plan.md`;
   - `Closes #<issue>` for each issue the change closes, or the word the template asks for when there is none;
   - each check you ran, with its result copied from the output.

   When you cannot open a pull request from this session, say so and give the pushed branch's name. When you cannot push either, say so; the review then reads the local branch's diff.

**Next:** `.agents/skills/sdlc/playbooks/review.md`; an agent; in the same turn, as soon as step 4 is done.
