# Plan: Every branch has an open pull request, and every pull request ends in a merge

From `intent/branch-pull-request/intent.md` and `spec.md` (both merged: #72, #74). Engineer: Joe Takara, who accepts this plan in plan mode (playbook page 19–20). Written at `main` `279701f`.

## Context

A session pushed to a branch after its pull request had merged, which recreated the branch with no pull request, and the product owner had to delete it by hand. The product owner ruled that no person or agent deletes a branch or closes a pull request by hand; the system does it, in the root and in every generated project. The spec splits this into five parts. This plan builds parts 2–5. Part 1, the pre-push hook, is a constitution change and ships through issue #73 on its own.

## Files that change

| File                                                                                                   | Change                                                                                                                                                                                                                                                                                                 |
| :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/branch-pull-request.yml` (new)                                                      | Two jobs, below                                                                                                                                                                                                                                                                                        |
| `templates/base/.github/workflows/branch-pull-request.yml` (new)                                       | Identical copy                                                                                                                                                                                                                                                                                         |
| `templates/base/SETUP.md`                                                                              | Step 3: the Workflow permissions bullet also selects **Allow GitHub Actions to create and approve pull requests**, and a new bullet: **General → Pull Requests:** select **Automatically delete head branches**. Line 7: "The product owner merges it with `Status: accepted.` or `Status: rejected.`" |
| `intent/README.md`, `templates/base/intent/README.md` (line 6)                                         | Closing no longer rejects; the `Status:` line records accept or reject (spec table)                                                                                                                                                                                                                    |
| `.agents/skills/write-intent/SKILL.md`, `templates/base/.agents/skills/write-intent/SKILL.md` (step 5) | Reject by setting `Status: rejected.` and merging                                                                                                                                                                                                                                                      |
| `.claude/skills/`, `.cursor/skills/` copies, root and `templates/base/`                                | Re-rendered: `pnpm rules:sync` in the root; for the template, in a generated project, copied back                                                                                                                                                                                                      |
| `intent/playbook-plays/intent.md` (line 37)                                                            | A rejected intent stays as a file with `Status: rejected.`                                                                                                                                                                                                                                             |
| `CONTRIBUTING.md`                                                                                      | New **Repository settings** section listing the two settings an admin turns on once in the root                                                                                                                                                                                                        |
| `intent/branch-pull-request/spec.md`                                                                   | `Status: accepted.`; Renovate prefix now verified; the deletion departure below                                                                                                                                                                                                                        |
| `intent/branch-pull-request/plan.md` (new)                                                             | This plan                                                                                                                                                                                                                                                                                              |

## The workflow

`permissions: {}` at the top. Each job gets `pull-requests: write` (plus `contents: write` where it deletes a branch), uses `gh` with `GH_TOKEN: ${{ github.token }}` and `GH_REPO`, and checks out nothing. Untrusted values such as branch names pass through `env:`. Multi-line `run:` blocks start with `set -euo pipefail`. These are the conventions in `intent/ci/spec.md`, **The workflow rule**, and the sibling workflows `zizmor.yml` and `validate-pr-title.yml`.

**Job `open-pull-request`** runs on `push` (`branches-ignore: [main]`), `schedule` (daily), and `workflow_dispatch`. Its candidates:

- On a push: the pushed branch, only if it had a merged pull request and has no open one. Two `gh pr list --head` calls, `--state merged` and `--state open`, decide this.
- On the schedule or a dispatch: every branch from `gh api --paginate repos/$GH_REPO/branches` except `main`, with no open pull request, and a last commit more than an hour old.

Branches starting with `dependabot/` or `renovate/` are skipped. Renovate's default prefix is now verified: "change `branchPrefix` from the default `renovate/` value" (`renovatebot/renovate` `docs/usage/configuration-options.md`, line 513, at `0c61367`).

For each candidate, the job reads `ahead_by` from `gh api repos/$GH_REPO/compare/main...$branch`:

- **More than 0:** `gh pr create --base main --head "$branch" --title "<last commit subject>" --body "<why the system opened it, with a link to the spec>"`, ready for review.
- **0:** the branch holds nothing that is not on `main`, so the job deletes it (`gh api -X DELETE repos/$GH_REPO/git/refs/heads/$branch`). **Departure from the spec, for your approval.** The spec has the system open a pull request for every branch without one. GitHub cannot open a pull request for a branch with no commits ahead of its base, and such a branch has no work to lose. Deleting it is the "deleted by the system" outcome the intent names. The spec records this in the same commit.

**Job `reopen-closed-unmerged`** runs on `pull_request` `closed` when `github.event.pull_request.merged == false`. It skips a head branch starting with `dependabot/` or `renovate/`, and a head repository that is not this repository (a fork's token is read-only). It runs `gh pr reopen "$NUMBER" --comment "<a pull request ends only by merging; to reject, set Status: rejected. and merge>"`. The `--comment` flag is verified (`gh pr reopen --help`, gh 2.89.0).

## Order of work

1. Restart `claude/stoic-hawking-j5qfk3` from `origin/main`.
2. Write the root workflow. Run `actionlint` (1.7.12, the release `zizmor.yml` pins, checked against its SHA-256) and `zizmor --persona pedantic` (from PyPI) on `.github`, and fix every finding.
3. Copy the workflow to `templates/base/`. Make the `SETUP.md` and rejection edits. Run `pnpm rules:sync` in the root.
4. Generate a project (`AGENTS.md`, template check), run its `pnpm rules:sync`, and copy the rendered `write-intent` copies back. Then run its `pnpm verify`.
5. Update `spec.md` and commit `plan.md` with the change. Run `pnpm verify` in the root, open the pull request, and drive it to green (page 38).

## Verification

- `actionlint` and `zizmor` print no findings on the root `.github`. CI's Zizmor workflow repeats both on the pull request.
- `pnpm verify` passes in the root and in the generated project. Its output goes in the pull request.
- `git grep -n "closing the pull request rejects\|rejects it by closing\|merges or closes it"` returns nothing outside `intent/branch-pull-request/`.
- After the merge, an admin turns on **Allow GitHub Actions to create and approve pull requests** in the root. Then a `workflow_dispatch` run of the workflow on `main` should open a pull request for `claude/spec-github-files`, the live proof. That branch has one commit ahead of `main` (`cb59b3a`). The pull request ends by merging, as the new rule requires.

## Risks

- **A person must start CI:** CI on a pull request that `GITHUB_TOKEN` opens or reopens waits for **Approve workflows to run**. The spec accepted this.
- **The Actions setting is not in git:** **Allow GitHub Actions to create and approve pull requests** is a repository setting. Until an admin enables it, `gh pr create` in the workflow fails, and the failure shows in the Actions log.
- **Every push starts a short job:** about two API calls on most branches. The schedule runs once a day.

## Departure: the workflow is removed

After #75 merged, the product owner removed `.github/workflows/branch-pull-request.yml` and its `templates/base/` copy. The workflow ran on `GITHUB_TOKEN`, so each pull request it opened needed a person to select **Approve workflows to run** and **Update branch**. Those are steps outside the playbook's gates: "Human attention concentrates at the gates" (page 9). The playbook has the agent act "under the agent's own identity" (page 46), so spec requirements 3 and 4 wait for that identity. Requirements 1, 2, and 5 stand. The **Allow GitHub Actions to create and approve pull requests** setting had no other use, so `CONTRIBUTING.md` and `templates/base/SETUP.md` no longer ask for it, and an admin turns it off in the root.
