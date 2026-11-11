# Plan: Every branch has an open pull request, and every pull request ends in a merge

Accepted by: @joetakara.

From `intent/branch-pull-request/intent.md` and `spec.md`.

A push to a branch whose pull request has merged recreates the branch with no pull request. Requirement 1, the pre-push hook, stops that push. This plan builds requirement 2; requirements 3 and 4 are met by the `sdlc` playbooks.

## Files that change

| File                                       | Change                                                                             |
| :----------------------------------------- | :--------------------------------------------------------------------------------- |
| `templates/base/SETUP.md`                  | Step 3: **General → Pull Requests:** select **Automatically delete head branches** |
| `CONTRIBUTING.md`                          | The same bullet, for the root                                                      |
| `intent/branch-pull-request/spec.md`       | `Status: done.`                                                                    |
| `intent/branch-pull-request/plan.md` (new) | This plan                                                                          |

`intent/README.md`, `templates/base/intent/README.md`, and the `plan.md` and `design.md` playbooks keep saying that closing the pull request rejects an intent or a spec. The agent opens each pull request as `.agents/skills/sdlc/playbooks/open-pr.md` says.

## Order of work

1. Make the `SETUP.md` and `CONTRIBUTING.md` edits.
2. Generate a project (`AGENTS.md`, template check) and run its `pnpm verify`.
3. Commit `plan.md` with the change. Run `pnpm verify` in the root, open the pull request, and drive it to green (page 38).

## Risks

- **Departure: the workflow is removed, and the agent opens the pull request.** No workflow opens or reopens a pull request. A workflow that ran on `GITHUB_TOKEN` needed a person to select **Approve workflows to run** and **Update branch** on each pull request it opened, which are steps outside the human gates. The agent opens each pull request (spec requirement 3), and closing a pull request rejects an intent or a spec (spec requirement 4).

## Proof

- 1, 3, 4: the pre-push hook and the `sdlc` playbooks carry them; this plan does not change them.
- 2: `git grep -n "Automatically delete head branches" -- CONTRIBUTING.md templates/base/SETUP.md` finds both bullets.
- 5: `pnpm verify` passes in the root and in the generated project. Its output goes in the pull request.
