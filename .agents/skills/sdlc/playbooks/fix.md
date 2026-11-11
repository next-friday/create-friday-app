# Fix phase: repair a defect with a failing test

This playbook takes a defect in behaviour that already exists to a pull request, with no intent, spec, or plan.

1. Decide that the request qualifies. It qualifies only when the request is a defect in behaviour that already exists. The fix must add no new behaviour and no new dependency. It must change no schema and no public interface. When a condition fails, say which one in two lines and follow `.agents/skills/sdlc/playbooks/plan.md` instead.
2. Reproduce the defect as a test on a new branch. Create the branch as `AGENTS.md` says. Run the test and check that it fails for the reason the defect gives. Commit the failing test before any fix.
3. Create `.git/bug-fix-in-progress`, then make the test pass without editing the test. The marker makes `.agents/hooks/agent-test-edit-gate.sh` block test edits. Delete the marker once the test passes.
4. Run every check under **Verifying your work** in `AGENTS.md`. Keep the output. When one fails, fix the code, and never skip, delete, or weaken a test. When a check cannot run in this session, say which one and why, and never report it as passed.
5. Go on in the same turn, without asking. Follow `.agents/skills/sdlc/playbooks/open-pr.md`, and then `.agents/skills/sdlc/playbooks/review.md`. No human gate comes before the code owner's review of the pull request.

**Next:** `.agents/skills/sdlc/playbooks/open-pr.md`; an agent; in the same turn, as soon as step 4 passes.
