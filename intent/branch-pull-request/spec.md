# Spec: A pushed branch has a pull request the agent opens, and a deleted branch is not recreated

From `intent/branch-pull-request/intent.md`. Status: done.

GitHub Docs claims are read from the `github/docs` repository at `f309096`, because `docs.github.com` is not reachable from this session; each cites the file under `content/` or `data/`.

## Requirements

1. A push that would recreate a branch the remote deleted is refused by the pre-push hook, in the root and in `templates/base/`.
2. GitHub deletes a branch when its pull request merges, in the root and in every generated project.
3. For a branch the agent pushes, the agent opens the pull request ready for review, as `.agents/skills/sdlc/playbooks/open-pr.md` (step 4) and `AGENTS.md` (convention 10 in the root, and the branches convention in each `templates/<stack>/AGENTS.md`) say.
4. The product owner rejects an intent or a spec by closing its pull request, and accepts it by merging with `Status: accepted.` (`.agents/skills/sdlc/playbooks/plan.md`, step 7; `.agents/skills/sdlc/playbooks/design.md`, step 5; `intent/README.md`, line 6).
5. Requirements 1 to 4 hold in this repository and in every generated project.

## Design

### 1. The pre-push hook

`.husky/pre-push` (lines 10–15) and `templates/base/.husky/pre-push` (lines 11–16) hold the hook. When the remote no longer has a branch that this clone pushed before, the hook refuses the push. "Pushed before" means a remote-tracking ref exists for the branch, or the branch's upstream is set to it. `.husky/**` is in the constitution (`.claude/settings.json`, deny list), so a change to it follows `constitution-changes.md`.

### 2. Automatic deletion on merge

GitHub's setting: "You can have head branches automatically deleted after pull requests are merged in your repository" (`content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches.md`). The root already has it: `delete_branch_on_merge` is `true` in the repository's REST API response. `templates/base/SETUP.md:55` has the bullet "**General → Pull Requests:** select **Automatically delete head branches**" in step 3, so a generated project has it once an admin follows the step; `CONTRIBUTING.md:88` has the same bullet for the root.

### 3. A pull request for a pushed branch

No workflow opens or reopens pull requests. `.github/workflows/` holds no `branch-pull-request.yml`, in the root or in `templates/base/`. A workflow on `GITHUB_TOKEN` leaves each pull request it opens in an approval-required state, and a person must select **Approve workflows to run** and **Update branch**. Those steps sit outside the playbook's gates: "Human attention concentrates at the gates" (page 9). The playbook has the agent act "under the agent's own identity" (page 46).

So the agent opens the pull request. After it pushes a branch, `open-pr.md` step 4 has it push the branch and open the pull request ready for review, or update the branch's existing pull request, with the body from `.github/pull_request_template.md`. `AGENTS.md` convention 10 repeats the rule for this repository, and `review.md` steps 5 and 6 have the agent drive that pull request to green. The pre-push hook (requirement 1) stops the one case in which a branch comes back after its pull request merged.

### 4. Rejection is a closed pull request

`intent/README.md:6` says "Merging its pull request with `Status: accepted.` accepts it; closing the pull request rejects it." `plan.md` step 7 and `design.md` step 5 say the same for an intent and for a spec, and `templates/base/.agents/skills/sdlc/playbooks/` carries both. The playbook allows this record: the decision "is recorded as the merge or the closing review" (page 13).

### Files that carry the behaviour

| File                                                                                                | What it holds                                         |
| :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| `.husky/pre-push`, `templates/base/.husky/pre-push`                                                 | Requirement 1                                         |
| `templates/base/SETUP.md` (line 55), `CONTRIBUTING.md` (line 88)                                    | Requirement 2: **Automatically delete head branches** |
| `.agents/skills/sdlc/playbooks/open-pr.md`, `AGENTS.md`, `templates/<stack>/AGENTS.md`              | Requirement 3                                         |
| `.agents/skills/sdlc/playbooks/plan.md`, `design.md`, `intent/README.md`, and their template copies | Requirement 4                                         |

The root's **Automatically delete head branches** setting is a GitHub setting that git does not record. An admin turns it on in the root: the repository's REST API response shows `delete_branch_on_merge` as `true`.

## Proof

- `git grep -n "no longer exists on" -- .husky templates/base/.husky` finds the hook's refusal message in both.
- `git grep -n "Automatically delete head branches" -- CONTRIBUTING.md templates/base/SETUP.md` finds both bullets.
- `git ls-files .github/workflows templates/base/.github/workflows | grep branch-pull-request` prints nothing.
- `pnpm verify` passes in the root and in one generated project per stack.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied.

## Open questions

None.
