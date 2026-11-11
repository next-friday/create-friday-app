# Intent: Every branch has an open pull request, and every pull request ends in a merge

Author: Joe Takara (Developer Productivity). Status: done.

## Problem

The product owner had to delete the branch `claude/spec-github-files` by hand. Pull request #69 merged from it at 05:42:32Z, and the repository deleted the branch, because `delete_branch_on_merge` is `true` in the repository's REST API response. The session that opened #69 committed `cb59b3a` at 05:43:25Z and pushed it to the same branch name, which created the branch again with no pull request. Its one sentence never reached `main`, and nothing on GitHub showed that the branch held unreviewed work.

The product owner names manual branch deletion a serious departure from the workflow: neither a person nor an agent should ever have to do it. The playbook has every change arrive as a pull request: "Anything the agent writes arrives as a PR through branch protection" (page 45), and "Branch protection turns anything the agent writes into a PR, with no direct path to main" (page 46). A branch with no pull request is work outside that path.

Nothing prevents it today: `.husky/pre-push` and `templates/base/.husky/pre-push` check only for `main`. A rule in a skill would depend on the agent's memory and would not cover a person, so the product owner requires a fix enforced by a script or rule. Generated projects lack even the automatic deletion: `templates/base/SETUP.md` does not turn on "Automatically delete head branches".

## Proposed outcome

- Every branch on GitHub other than `main` has an open pull request, and the system deletes it when its pull request merges. No person and no agent deletes a branch by hand.
- When a branch exists with no open pull request, for example after a push that follows a merge, the system opens a pull request for it, so the work goes through review and the normal end of the loop: a merge deletes the branch.
- The pre-push hook refuses a push that would recreate a branch the remote deleted, in the root and in `templates/base/`, so the case stops before it reaches GitHub. Issue #73 carries that constitution change with a tested hook.
- A pull request ends only by merging. No person and no agent closes one by hand. Proposal for the product owner to accept or correct in review: the system reopens a pull request that closes without merging, so the close does not stand.
- A rejected intent or spec is recorded by merging it with `Status: rejected.`, so rejection also goes through the merge (proposal). The playbook allows either record: the decision "is recorded as the merge or the closing review" (page 13). This keeps the first. These files say today that closing rejects, and change with it: `intent/README.md` and `templates/base/intent/README.md` line 6, `.agents/skills/write-intent/SKILL.md` and its `templates/base/` copy, step 5, `templates/base/SETUP.md` line 7, and `intent/playbook-plays/intent.md` line 37. Page 13's lagging indicator, "the share of intent.md files that the product owner accepts into Stage 2: Design rather than closes", is then read from the `Status:` lines.
- The same holds in this repository and in every generated project.

## Affected users and systems

- The product owner, the engineers, and the agents of this repository and of every generated project.
- The GitHub repository settings, branch rulesets, and `.github/workflows/` in the root and in `templates/base/`, and `templates/base/SETUP.md`.

## Constraints

- The product owner decided: the system opens a pull request for a branch that has none, rather than deleting it, so no work is lost; and the rule applies in this repository and in every generated project.
- The product owner decided: when the workflow runs correctly, no pull request is closed by hand; every pull request goes through the merge.
- The normal flow pushes a branch and opens its pull request a few seconds later. The system must not open a second pull request for a branch whose author is about to open one.
- A changed hook, a new workflow, or a changed ruleset goes through `constitution-changes.md` and the workflow rule in `intent/ci/spec.md`.
- The agent still never approves or merges (page 39).

## Open questions

- Which tools close pull requests on their own, and how does the rule treat them? Dependabot may close a pull request that a newer update replaces; this is unverified, because GitHub Docs could not be reached from this session. The spec checks each tool that the root and the templates use.
- How long does the system wait after a push before it opens a pull request, so it does not race the author?
