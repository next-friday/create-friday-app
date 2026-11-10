# Intent: Every branch on GitHub has an open pull request, and the system keeps it that way

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

On 2026-11-10 the product owner had to delete the branch `claude/spec-github-files` by hand. Pull request #69 merged from it at 05:42:32Z, and the repository deleted the branch, because `delete_branch_on_merge` is `true` in the repository's REST API response. The session that opened #69 committed `cb59b3a` at 05:43:25Z and pushed it to the same branch name, which created the branch again with no pull request. Its one sentence never reached `main`, and nothing on GitHub showed that the branch held unreviewed work.

The product owner names manual branch deletion a serious departure from the workflow: neither a person nor an agent should ever have to do it. The playbook has every change arrive as a pull request: "Anything the agent writes arrives as a PR through branch protection" (page 45), and "Branch protection turns anything the agent writes into a PR, with no direct path to main" (page 46). A branch with no pull request is work outside that path.

Today, only the agent's own discipline prevents this. `intent/loop-autonomy/spec.md`, requirement 7 (pull request #72), has the agent check that a pull request is still open before it pushes. That covers the agent, not a person, and not a merge that lands between the check and the push. Generated projects lack even the automatic deletion: `templates/base/SETUP.md` does not turn on "Automatically delete head branches".

## Proposed outcome

- Every branch on GitHub other than `main` has an open pull request, or it is deleted by the system when its pull request merges or closes. No person and no agent deletes a branch by hand.
- When a branch exists with no open pull request, for example after a push that follows a merge, the system opens a pull request for it, so the work goes through review and the normal end of the loop: a merge deletes the branch, and a close lets the system delete it.
- The same holds in this repository and in every generated project.

## Affected users and systems

- The product owner, the engineers, and the agents of this repository and of every generated project.
- The GitHub repository settings, branch rulesets, and `.github/workflows/` in the root and in `templates/base/`, and `templates/base/SETUP.md`.

## Constraints

- The product owner decided on 2026-11-10: the system opens a pull request for a branch that has none, rather than deleting it, so no work is lost; and the rule applies in this repository and in every generated project.
- The normal flow pushes a branch and opens its pull request a few seconds later. The system must not open a second pull request for a branch whose author is about to open one.
- A new workflow or a changed ruleset goes through `constitution-changes.md` and the workflow rule in `intent/ci/spec.md`.
- The agent still never approves or merges (page 39).

## Open questions

- What deletes the branch of a pull request that closes without merging? GitHub's automatic deletion acts on merge; the spec finds the platform feature or the workflow step that covers a close.
- How long does the system wait after a push before it opens a pull request, so it does not race the author?
