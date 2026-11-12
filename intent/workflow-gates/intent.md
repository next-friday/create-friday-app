# Intent: Agents cannot skip a workflow step, and no gate leaves a change stuck

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

The product owner found that the workflow holds only where a hook makes the agent follow it: agents forget steps that only prose asks for. An audit of `main` at `74fe4ec`, rechecked at `04ea8d4`, found these steps written as prose with nothing behind them, in this repository and in every generated project:

- **Checks before reporting done.** `AGENTS.md`, **Verifying your work**, in the root and each `templates/<stack>/`: "Run all three before reporting any task complete, and paste the output." No hook runs them when the session ends. `pre-push` runs `pnpm verify` in the root, and `pnpm check` in a generated project (`templates/base/.husky/pre-push`, line 12), which runs `test:changed` instead of `test:coverage` (`templates/nodejs/package.json`, lines 16 and 39). The verifier subagent's description says it checks the change "before the session reports done" (`.agents/agents.json`), and nothing calls it (`intent/pre-push-review/intent.md`). The playbook enforces "Verification before a task is reported done, and the block on the agent editing test files during a fix, both implemented as hooks where the organization wants them guaranteed" (page 33).
- **Never approve or merge.** Since #89, the shell gate blocks `gh pr merge`, `gh pr review --approve`, and the matching `gh api` calls (`.agents/hooks/agent-shell-gate.sh`, lines 203–221), `.claude/settings.json` denies `Bash(gh pr merge*)` (line 34), and `.agents/hooks/agent-mcp-gate.sh` blocks the GitHub MCP merge tools and a review with the event `APPROVE`, in this repository and in `templates/base/`. `AGENTS.md` calls the gate "a convenience, not a security boundary" (line 61), and the root ruleset for `main` requires no approving review (`required_approving_review_count: 0`), so nothing on GitHub stops a merge that gets past the gate. The playbook: "Separation of duties is preserved, because the agent that wrote the code has no way to approve it" (page 39).
- **The test-edit gate.** The bug-fix convention of `AGENTS.md` has the agent create `.git/bug-fix-in-progress` itself, so the gate holds only while the agent keeps the marker, and the shell gate allows creating and deleting it. `intent/lean-agent-setup/spec.md`, still a draft, removes the gate (requirement 6) and moves the check into `REVIEW.md`, the playbook's alternative: "check the diff in review and reject any change that touches a test" (page 32, step 7). In this repository no review applies `REVIEW.md` to a pull request: Claude Code Review stays off here (`intent/pre-push-review/intent.md`).
- **Committing the approved plan.** The plan convention of `AGENTS.md`: "Commit the approved plan as `intent/<change>/plan.md`." Nothing checks that a plan was committed. `intent/pre-push-review/intent.md` checks a pushed commit against a plan that exists, not that one exists.

The same audit found gates and settings that can leave a change with no one able to move it:

- **Approving the product owner's own pull requests.** `templates/base/SETUP.md`, step 3, protects `main` with "at least one approval, review from Code Owners", and "Pull request authors cannot approve their own pull requests" ([GitHub Docs: Approving a pull request with required reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews)). An agent working under a person's account opens its pull requests as that person: every pull request from #65 to #100 that a bot did not open is authored by `joetakara`. In a team of one, no one else can approve. In this repository the root ruleset has `require_code_owner_review: false` today. `.github/CODEOWNERS` names `@joetakara` and `@next-friday-engineer`; whether `@next-friday-engineer` is a second person who can approve is unverified. `intent/playbook-plays/spec.md` proposes it as the product owner's deputy (**Areas of concern**).
- **A pull request that can never merge.** A duplicate pull request, or one whose branch holds nothing that is not on `main`, ends only when a person closes it. `intent/branch-pull-request/spec.md` (requirement 4) makes closing a pull request the way to reject an intent or a spec, and says nothing about a pull request that is neither.
- **Updating every open branch after each merge.** The root ruleset sets `strict_required_status_checks_policy: true`: "The topic branch **must** be up to date with the base branch before merging" ([GitHub Docs: Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)). Each merge leaves every other open pull request unable to merge until its branch is updated, as on #80: `43c5e29` ("Merge remote-tracking branch 'origin/main'", by the agent) and `416d3db` ("Merge branch 'main'", committed by GitHub through **Update branch**). `templates/base/SETUP.md` does not say whether generated projects require branches to be up to date.
- **The deleted-branch message.** Neither `.husky/pre-push` nor `templates/base/.husky/pre-push` refuses a branch deleted on the remote, so neither says "run git fetch --prune and git branch --unset-upstream first"; that command behaves as follows. When the refused branch is not the one checked out, `git branch --unset-upstream` acts on the current branch instead. If the current branch has an upstream, it removes it silently and exits 0; if not, it fails with "fatal: branch 'main' has no upstream information". Both were reproduced on 2026-11-10.

## Proposed outcome

- **Checks before done.** When an agent session ends its turn with changes the checks have not seen, a hook runs the checks `AGENTS.md` **Verifying your work** names (`pnpm verify`) and sends the failures back to the agent instead of letting it stop. In Claude Code this is the `Stop` hook: exit code 2 "Prevents Claude from stopping, continues the conversation", `stop_hook_active` "is `true` when Claude Code is already continuing as a result of a stop hook", and "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn" ([Claude Code: Hooks reference](https://code.claude.com/docs/en/hooks)). A person then sees the failure rather than a loop. The checks must run without a download beyond `pnpm install` (`intent/playbook-plays/spec.md`, requirement 6), or the hook sends the agent back on a failure it cannot fix.
- **The test-edit gate holds without the agent's cooperation.** **Proposal:** a CI check, keyed to something the agent does not set and clear alone, refuses a bug-fix change that edits a test already on `main`. The way out is the playbook's review alternative: a code owner accepts the test change in review.
- **A plan exists before code.** A check refuses a change that edits code without a committed `plan.md` for its change.
- **Every gate has someone who can pass it.** Decided: agents get their own identity, a GitHub App owned by `next-friday`, so a person approves what an agent opens. Until then, code-owner review stays off in this repository. **Proposal:** `SETUP.md` gives a team of one a way to approve an agent's pull request that keeps a person as the approver.
- **No pull request is stuck open.** Every pull request has a way to end that no person carries out by hand.
- **No branch is updated by hand.** **Proposal:** this repository uses a merge queue: "Pull request merge queues are available in any public repository owned by an organization" ([GitHub Docs: Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)), and this repository is public. A workflow "**must** use the `merge_group` event" to run on the queue, and the four checks the ruleset requires run today only on `pull_request` or `push` (`ci.yml`, `validate-pr-title.yml`, `dependency-review.yml`, `secret-scan.yml`). Generated projects are private repositories on GitHub Team (`intent/ci/spec.md`, requirement 8), where the same page offers merge queues only with GitHub Enterprise Cloud.
- **The deleted-branch message names the branch:** `git branch --unset-upstream <branch>`.
- The same holds in this repository and in every generated project, except where a step above names one of them.

This change amends drafts and accepted specs:

- `intent/lean-agent-setup/spec.md` (draft): requirement 6, which removes the test-edit gate; requirement 10, if a check above lands in `pre-push`, which that spec limits to blocking pushes to `main`; and requirement 4, which narrows the shell gate to skipping Git hooks and protected-path writes, and so would drop the merge and approval block that #89 added.
- `intent/branch-pull-request/spec.md` (done): its title, "every pull request ends in a merge", if the way a stuck pull request ends is not a merge.

Owned by other changes, and not repeated here:

- Blocking an agent's `gh pr merge`, `gh pr review --approve`, the matching `gh api` calls, and the GitHub MCP merge tools and a review with the event `APPROVE`: done in #89 (`agent-shell-gate.sh`, `agent-mcp-gate.sh`, `.claude/settings.json`).
- The production gate's match on `prod`: built in #98 (`intent/playbook-plays/spec.md`, requirement 9).
- `editorconfig-checker` without a download on first use: `intent/playbook-plays/spec.md`, requirement 6, and `intent/lean-agent-setup/spec.md`.
- The reviewer before a push, and `plan.md` kept in step with the code: `intent/pre-push-review/intent.md`.
- The managed settings example, which today lets no agent reach `github.com`: `intent/lean-agent-setup/spec.md`, **Managed settings example**.
- The agent's own identity: the loop GitHub App that `intent/playbook-plays/spec.md` proposes (**Automated handover**, **Token**), which the agent identity intent builds on, and that spec's deputy who approves the product owner's own pull requests (**Areas of concern**).

## Affected users and systems

- The product owner, the engineers, and the agents of this repository and of every generated project.
- In the root and in `templates/base/`: `.agents/hooks/`, `.claude/settings.json`, `.cursor/hooks.json`, `.husky/pre-push`, and `REVIEW.md`.
- CI: `ci.yml`, `validate-pr-title.yml`, `dependency-review.yml`, and `secret-scan.yml` in the root, and the CI workflow of each stack.
- The plan and bug-fix conventions of `AGENTS.md` in the root and in each `templates/<stack>/`, the `babysit-pr` and `git-workflow` skills (the second removed by `intent/lean-agent-setup/spec.md`, requirement 14), `CONTRIBUTING.md` in the root and in each `templates/<stack>/`, and `templates/base/SETUP.md`.
- `intent/lean-agent-setup/spec.md` and `intent/branch-pull-request/spec.md`, which this change amends.
- The root ruleset for `main`, which a person changes in GitHub.

## Constraints

- The product owner decided: a fix is enforced by a hook or a script, not by an agent's memory, in this repository and in every generated project; agents never approve or merge; no person or agent closes a pull request or deletes a branch by hand.
- No gate may leave a change that no one can move. Each gate names who passes it and how.
- Approval comes from a person: "Approval comes from a human through branch protection, informed by the findings" (page 39).
- A file in the constitution changes through `constitution-changes.md`, and agent settings deny those files to agents, so a person makes those edits. `intent/lean-agent-setup/spec.md` (draft, requirement 3) removes `constitution-changes.md`.

## Open questions

- Whether Cursor has a hook when the agent stops, and whether it can send the agent back, is unverified: `cursor.com` could not be reached from this session.
- What marks a change as a bug fix in a way the agent cannot set and clear on its own: the pull request title's `fix` type, which CI already validates, a label a code owner sets, or something else?
- How does a check know which `intent/<change>/` a branch implements, so it can require that change's `plan.md`? `intent/pre-push-review/intent.md` needs the same mapping for its plan check, and pull request #86 (`intent/change-status-index/intent.md`) asks where a change's stage is recorded.
- Who is `@next-friday-engineer`, and can that account approve the product owner's pull requests now?
- What approves an agent's pull request in a team of one before agent identity reaches generated projects?
- Does GitHub squash-merge a pull request with no changes? If not, how does a duplicate or empty pull request end without a person closing it?
- Without merge queues on GitHub Team, how do generated projects avoid updating branches by hand: loose status checks, or an agent that updates the branch?
