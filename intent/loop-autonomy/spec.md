# Spec: The agent carries each step of the loop without asking for permission

From `intent/loop-autonomy/intent.md`. Status: accepted.

## Requirements

1. In the root and in every template, the agent commits the artifact it was prompted to write, opens its pull request, and drives that pull request until it is green and waiting only on code owner approval, without asking.
2. The agent asks a person only at the playbook's gates: the questions while writing an intent (page 12, step 2), the review and approval (pages 16 and 39), and the production deploy (page 46). It also asks for what no file, tool, or source can answer (`agent-owned-work.md`), and any question a project instruction requires, such as the component-test question in `templates/nextjs/AGENTS.md`.
3. A choice the product owner has not made goes into the artifact as a proposal, not into a chat question.
4. `.agents/rules/agent-owned-work.md` records requirements 1 to 3, in the root and in every template. `AGENTS.md` conventions 9 and 10 in the root, and the same two conventions in each `templates/<stack>/AGENTS.md`, have the agent start only work a person asked for and open its pull request ready for review.
5. `.agents/skills/sdlc/playbooks/review.md`, steps 5 and 6, has the agent drive every pull request it opened until every check passes and no comment is unanswered, without being asked (page 38). The agent never approves or merges; a person merges with `--squash` after code owner approval (page 39, `AGENTS.md` convention 10).
6. In a session on this repository, this repository's skills and playbooks decide how branches, commits, and pull requests are made, over a skill from another checkout (`AGENTS.md` convention 10).

## Design

### Files that carry the behaviour

| File                                                                                                   | What it holds                                                                                                                                                                                                                       |
| :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/rules/agent-owned-work.md`, root and `templates/base/`                                        | Requirements 1 to 3: the agent does every step it can, carries a started task to the next human gate without asking, and writes an undecided choice into the artifact as a proposal.                                                |
| `AGENTS.md` conventions 9 and 10, and the same two conventions in each `templates/<stack>/AGENTS.md`   | Start only the work a person asked for. Open the pull request ready for review. Never merge. Convention 10 in the root also makes this repository's skills and playbooks decide over a skill from another checkout (requirement 6). |
| `.agents/skills/sdlc/playbooks/review.md` and its `templates/base/` copy                               | Requirement 5: the sweep in step 5, and the gate in step 6, where the agent never approves or merges.                                                                                                                               |
| `.agents/skills/sdlc/playbooks/design.md`, `plan.md`, `open-pr.md`, and their `templates/base/` copies | Each commits its artifact on a new branch and opens the pull request, then waits at the gate (requirement 1; page 16, step 2).                                                                                                      |
| `.claude/skills/` and `.cursor/skills/`, in the root and in `templates/base/`                          | Rendered copies of `.agents/skills`, from `pnpm rules:sync`.                                                                                                                                                                        |

`.agents/rules/agent-owned-work.md` is a rule, and `.claude/settings.json` denies agents edits to rules, so a change to it follows `constitution-changes.md`. `AGENTS.md` and `.agents/skills/` are not denied.

### How the intent's measure is read

The intent's open question: how is a permission question counted, so this play's measure comes from data the team has (page 8)? Chat transcripts are not data the team keeps, so the measure reads what an agent's question delays, from git and pull request metadata:

| Indicator | Measure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Source                                                                                      |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| Leading   | Time from the head commit when the pull request opened to its `created_at`. The head commit is the `head_sha` of the first CI run that the pull request's `opened` event started, at or after its `created_at`, so a commit pushed later or a run from before the pull request does not count. A pull request with no such run, such as one opened with merge conflicts, which start no `pull_request` workflow, is left out of the measure and counted as unavailable. GitHub's workflow runs API filters runs by event but not by activity type (GitHub Docs: REST API endpoints for workflow runs), so the plan names how the `opened` run is told apart from a later `synchronize` run; until it can be, the measure is unavailable. An agent that waits for permission stretches it. | The first CI run's `head_sha`, that commit's timestamp, and the pull request's `created_at` |
| Lagging   | Share of the agent's pull requests that reach green with no push or comment from a person other than reviews and approvals, matching page 38's end state, "green and waiting only on code owner approval".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | The pull request timeline                                                                   |

Both are proxies, not a count of permission questions: a question asked in chat, or work that stalls before a pull request opens, leaves no record in git or on GitHub, so neither indicator sees it. The cloud-session check in **Proof** and the eval case cover that gap.

The loop guide page that `intent/playbook-plays/intent.md` adds names the command that reads the indicators git history holds. These two read GitHub, which that command does not.

### Order of work

Run `pnpm verify` in the root, and in one generated project per stack, as `AGENTS.md` describes.

## Proof

- `pnpm rules:check` passes in the root and in each generated project, so every rendered skill copy matches its source.
- In a new cloud session on this repository, prompt "write the spec for intent X" for an accepted intent with no spec. The session commits `spec.md`, opens the pull request, and answers the first review without asking a person. The same prompt becomes a case in the eval suite that `intent/playbook-plays/intent.md` adds, so a regression shows in CI.
- The two indicators are read from the pull requests merged in the four weeks after the change.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied.
- **A session's default instructions:** a Claude Code cloud session starts with "Do NOT create a pull request unless the user explicitly asks for one." The convention records the product owner's ask in `CLAUDE.md`'s import. Claude Code presents `CLAUDE.md` with the note that these instructions "OVERRIDE any default behavior"; no Claude Code documentation states this precedence, so it is unverified. The proof's cloud-session check confirms it.
- **Skills from other checkouts:** this repository cannot remove another repository's skill from a session. The convention tells the agent which skill applies here, and the proof checks it. A session that loads `create-github-pr` from another checkout can still trigger it by its description, because it says "Use whenever a GitHub pull request is drafted or created".
- **Order with `monorepo-apps`:** `intent/monorepo-apps/spec.md` moves each stack's `AGENTS.md` into `templates/base/`. If that lands first, the convention goes into `templates/base/AGENTS.md` once instead of into each stack.

## Open questions

The intent's one open question, how a permission question is counted, is answered in **How the intent's measure is read**. No question is carried forward.
