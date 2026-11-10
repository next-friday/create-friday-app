# Spec: Every branch has an open pull request, and every pull request ends in a merge

From `intent/branch-pull-request/intent.md` (accepted 2026-11-10 by the merge of pull request #72). Status: draft.

Written at `b76ed2c` with the `write-spec` skill. GitHub Docs claims are read from the `github/docs` repository at `f309096` (2026-11-09), because `docs.github.com` is not reachable from this session; each cites the file under `content/` or `data/`.

## Requirements

1. A push that would recreate a branch the remote deleted is refused by the pre-push hook, in the root and in `templates/base/`.
2. GitHub deletes a branch when its pull request merges, in the root and in every generated project.
3. When a branch other than `main` exists with no open pull request, the system opens one for it.
4. When a pull request closes without merging, the system reopens it.
5. A rejected intent or spec is recorded by merging its pull request with `Status: rejected.`, and every file that says closing rejects says this instead.
6. Requirements 1 to 5 hold in this repository and in every generated project. No person and no agent deletes a branch or closes a pull request by hand.

## Design

### 1. The pre-push hook

Issue #73 holds the hook, tested in seven cases. When the remote no longer has a branch that this clone pushed before, the hook refuses the push. "Pushed before" means a remote-tracking ref exists for the branch, or the branch's upstream is set to it. `.husky/**` is in the constitution (`.claude/settings.json`, deny list), so the change ships through #73 and its own pull request (`constitution-changes.md`). The rest of this change does not depend on it.

### 2. Automatic deletion on merge

GitHub's setting: "You can have head branches automatically deleted after pull requests are merged in your repository" (`content/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-the-automatic-deletion-of-branches.md`). The root already has it: `delete_branch_on_merge` is `true` in the repository's REST API response. `templates/base/SETUP.md` step 3 does not set it, so a generated project gets it only if an admin turns it on. Step 3 gains a bullet: "**General → Pull Requests:** select **Automatically delete head branches**."

### 3. A pull request for every branch

A new workflow, `.github/workflows/branch-pull-request.yml`, in the root and in `templates/base/`, with two jobs.

**`open-for-pushed-branch`** runs on `push` to any branch except `main`. It acts only when the branch had a pull request that merged and has no open one, which is the 2026-11-10 case: `gh pr list --head "$BRANCH" --state merged` returns a pull request and `--state open` returns none. It then opens a pull request at once. A new branch with no pull request history is left alone, because its author usually opens the pull request moments later. Pull request #72 opened about a minute after its branch was first pushed.

**`open-for-every-branch`** runs on `schedule`, once a day. It lists the remote branches other than `main`. For each one with no open pull request and a last commit older than one hour, it opens a pull request. Proposal for the product owner to accept or correct in review: once a day, and one hour. The schedule runs at most once a day, and the hour leaves the author room to open the pull request first.

The pull request either job opens:

- targets `main` and is ready for review, because CI skips drafts (`.agents/skills/git-workflow/SKILL.md`, line 12);
- takes its title from the branch's last commit subject, so `validate-pr-title.yml` applies to it as to any other;
- has a body that names the branch, says the system opened it because the branch had no open pull request, and links this spec.

**The token.** Proposal: the jobs use `GITHUB_TOKEN`, so a generated project needs no extra secret. GitHub Docs sets two conditions on that choice:

- The repository setting **Allow GitHub Actions to create and approve pull requests** must be on, because it controls "whether `GITHUB_TOKEN` can create and approve pull requests" (`content/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository.md`, line 117). Step 3 of `templates/base/SETUP.md` adds it.
- CI on such a pull request waits for a person: "when a workflow using `GITHUB_TOKEN` creates or updates a pull request, the resulting `pull_request` event creates workflow runs in an **approval-required** state", and "a user with write access to the repository can start the runs by selecting **Approve workflows to run**" (`data/reusables/actions/actions-do-not-trigger-workflows.md`).

The alternative is a GitHub App installation token, which starts CI without the approval prompt (`content/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow.md`). It needs an App and two secrets in every project. See **Areas of concern**.

**Branches the workflow skips.**

- **Bot branches.** Branches whose names start with `dependabot/` or `renovate/` are skipped. Dependabot names its branches `dependabot/PACKAGE-MANAGER/DEPENDENCY` (`content/code-security/reference/supply-chain-security/dependabot-options-reference.md`, line 631), and the bot that made the branch owns its pull request. Renovate's prefix is unverified, because Renovate's documentation was not read in this session. The plan confirms it.
- **Branches pushed by `GITHUB_TOKEN`.** These start no `push` run, because "events triggered by the `GITHUB_TOKEN` will not create a new workflow run" (same reusable). Changesets' version branch in `release.yml` is one such branch. Its pull request is opened by the same action, so the daily job finds an open pull request and does nothing.

### 4. Reopen a pull request closed without merging

A third job in the same workflow, **`reopen-closed-unmerged`**, runs on `pull_request` `closed`. GitHub Docs: "To run a workflow when a pull request merges, use the `pull_request` `closed` event type along with a conditional that checks the `merged` value of the event" (`content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`, line 579). When `merged` is false, the job reopens the pull request with `gh pr reopen`. It then comments that a pull request ends only by merging, and that a rejection merges with `Status: rejected.`.

- The job skips pull requests from `dependabot/` and `renovate/` branches. Dependabot's own commands close pull requests. For example, `@dependabot ignore this dependency` "Closes the pull request and prevents Dependabot from creating any more pull requests for this dependency" (`content/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands.md`, line 23).
- A reopen by `GITHUB_TOKEN` starts CI in the same approval-required state as above.
- If the head branch was deleted when the pull request closed, the reopen fails and the job fails, so the close is visible in the Actions log.

The job uses `pull_request`, not `pull_request_target`, as the workflow rule in `intent/ci/spec.md` (**The workflow rule**) requires. A pull request from a fork gets a read-only token on `pull_request`, so the job cannot reopen it (see **Areas of concern**).

### 5. Rejection is a merge

| File                                                                                             | Line        | Today                                                                                    | Becomes                                                                                                               |
| :----------------------------------------------------------------------------------------------- | :---------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `intent/README.md` and `templates/base/intent/README.md`                                         | 6           | "Merging its pull request accepts it; closing the pull request rejects it."              | "Merging its pull request records the decision: `Status: accepted.` accepts it, and `Status: rejected.` rejects it."  |
| `.agents/skills/write-intent/SKILL.md` and `templates/base/.agents/skills/write-intent/SKILL.md` | 12 (step 5) | "The product owner accepts it by merging the pull request, or rejects it by closing it." | "The product owner accepts it by merging the pull request, or rejects it by setting `Status: rejected.` and merging." |
| `templates/base/SETUP.md`                                                                        | 7           | "The product owner merges or closes it."                                                 | "The product owner merges it with `Status: accepted.` or `Status: rejected.`"                                         |
| `intent/playbook-plays/intent.md`                                                                | 37          | "A rejected intent never becomes a file, because closing its pull request rejects it"    | "A rejected intent stays as a file with `Status: rejected.`, because its pull request merges"                         |

The rendered skill copies in `.claude/skills/` and `.cursor/skills/` follow with `pnpm rules:sync` in the root. For `templates/base/`, they are rendered in a generated project and copied back (`AGENTS.md`, **Things Claude gets wrong**, "Template rule copies"). The playbook allows this record: the decision "is recorded as the merge or the closing review" (page 13). Page 13's lagging indicator, "the share of intent.md files that the product owner accepts into Stage 2: Design rather than closes", is read from the `Status:` lines.

### Files that change

| File                                                                       | Change                                                                                     |
| :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `.husky/pre-push`, `templates/base/.husky/pre-push`                        | Issue #73, in its own pull request                                                         |
| `.github/workflows/branch-pull-request.yml` and its `templates/base/` copy | New, with the three jobs above                                                             |
| `templates/base/SETUP.md`                                                  | Step 3: automatic deletion and the Actions setting. Line 7: as in **Rejection is a merge** |
| The files in **Rejection is a merge**, and their rendered skill copies     | As that table says                                                                         |
| `intent/branch-pull-request/intent.md`                                     | `Status: accepted.` (#72 merged)                                                           |

The root's repository settings change outside git: an admin turns on **Allow GitHub Actions to create and approve pull requests**. Nothing in the repository records that setting today, so the plan names who sets it.

### Order of work

1. Issue #73 lands on its own.
2. Write the workflow in the root and run `actionlint` and `zizmor`, which `ci.yml` already runs, on it.
3. Make the documentation changes in **Rejection is a merge**, then run `pnpm rules:sync`.
4. Copy the workflow, the `SETUP.md` step, and the template documentation into `templates/base/`. Render the template skill copies in a generated project and run its `pnpm verify`.
5. A repository admin turns on the Actions setting in the root.

## Proof

- Issue #73's seven cases pass against the committed hooks.
- In the root, after the change:
  - A branch pushed with no pull request has one within a day.
  - A push to the branch of a merged pull request, made with `git push --no-verify` by a person testing the workflow, opens a pull request in that run.
  - A pull request closed without merging is open again within the job's run.
- `git ls-remote origin 'refs/heads/*'` four weeks after the change lists only `main` and branches with an open pull request.
- `pnpm verify` passes in the root and in one generated project per stack.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review the next two items.
- **The Actions setting allows approving too:** the one setting lets `GITHUB_TOKEN` "create and approve pull requests". A workflow could approve a pull request. The `main` ruleset in `templates/base/SETUP.md` step 3 requires "review from Code Owners", and the workflow's identity is not a code owner, so its approval cannot satisfy that rule. That reading follows from the ruleset, not from a GitHub Docs statement, and is unverified.
- **CI waits for a click:** a pull request the system opens or reopens runs CI only after a person selects **Approve workflows to run**. That click is a person at the review gate (page 39), but it is one more step. A GitHub App token removes it, at the cost of an App and two secrets per project. Proposal: `GITHUB_TOKEN` now. The product owner can choose the App in review.
- **Fork pull requests:** the reopen job cannot reopen a fork's pull request on `pull_request`. A generated project may be public (`intent/github-files/spec.md`, **Areas of concern**, "A public generated project"). A public project that takes fork pull requests would need a second `pull_request_target` exception, which this spec does not add.
- **Renovate's branch prefix:** unverified, see **Branches the workflow skips**.
- **`claude/spec-github-files`:** the daily job will open a pull request for this branch. Its one sentence is already on `main` from #72, so the pull request may show no file changes. Whether GitHub merges a squash with an empty diff is unverified. The plan checks it before the workflow's first run.
- **Overlapping specs:** `intent/ci/spec.md` adds the workflow rule this workflow follows and removes template scanners from `SETUP.md` step 3. `intent/github-files/spec.md` rewrites `SETUP.md` line 57 in step 3. `intent/monorepo-apps/spec.md` restructures `templates/base/`. The plans need one order for step 3 of `SETUP.md`.

## Open questions

The intent's two open questions are answered here:

- **Which tools close pull requests on their own:** Dependabot does, through its `ignore` commands. Its branches are skipped (**Branches the workflow skips**). Whether Dependabot also closes a pull request when a newer update replaces it is not stated in the documentation read, and the skip covers that case either way.
- **How long the system waits:** a branch that had a merged pull request gets a new one at once. Any other branch gets one after an hour, by the daily job (proposal).

No question is carried forward.
