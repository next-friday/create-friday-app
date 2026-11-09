# Spec: The agent carries each step of the loop without asking for permission

From `intent/loop-autonomy/intent.md`, written on 2026-11-09 at the product owner's request before that intent's pull request (#65) merged. Status: draft.

Written at `23f15ab` with the `write-spec` skill as committed there. The product owner's prompt, "ทำ spec ของ loop-autonomy ต่อเลย" ("write the loop-autonomy spec now"), added no constraint to the skill's prompt.

## Requirements

1. In the root and in every template, the agent commits the artifact it was prompted to write, opens its pull request, and drives that pull request until it is green and waiting only on code owner approval, without asking.
2. The agent asks a person only at the playbook's gates: the questions while writing an intent (page 12, step 2), the review and approval (pages 16 and 39), and the production deploy (page 46). It also asks for what no file, tool, or source can answer (`agent-owned-work.md`).
3. A choice the product owner has not made goes into the artifact as a proposal, not into a chat question.
4. `AGENTS.md` records requirements 1 to 3 as the product owner's standing request, in the root and in every template.
5. `git-workflow` has the agent drive every pull request it opened to merge-ready without being asked (page 38). Merging stays with a person (page 39).
6. In a session on this repository, this repository's skills decide how branches, commits, and pull requests are made, over a skill from another checkout.

## Design

### Files that change

| File                                                                                                      | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AGENTS.md` (root), **Conventions**                                                                       | A new convention, **Carry each step of the loop without asking**, with requirements 1 to 3 and 6. It names `git-workflow` as the skill for branches, commits, and pull requests in this repository, and says that a skill from another checkout in the same session does not apply here, citing `current-state-authority.md`, item 2. The interim **Asking the product owner** entry under **Things Claude gets wrong**, added in #65, is removed. Under `codebase-hygiene.md`, one fact has one owner, and the convention now holds it.                                                                                                    |
| `templates/<stack>/AGENTS.md`, **Conventions**, for every stack                                           | The same convention, with the root's first sentence and without the line about this repository's other checkouts. Until `intent/monorepo-apps/spec.md` moves each stack's `AGENTS.md` into `templates/base/`, every stack has its own `AGENTS.md`, so each copy changes.                                                                                                                                                                                                                                                                                                                                                                    |
| `.agents/skills/git-workflow/SKILL.md` and `templates/base/.agents/skills/git-workflow/SKILL.md`, line 14 | "After you open a pull request, report its URL and continue. Drive it to merge-ready only when the user asks" becomes "After you open a pull request, report its URL and drive it until it is green and waiting only on code owner approval, as the `babysit-pr` skill describes." The watch command stays. "Merge only when the user asks to merge, land, or ship. Merge with `--squash`, bottom-up for a stack" becomes "Never merge. The person who merges uses `--squash`, bottom-up for a stack." The product owner's standing rule is that the agent never merges, and page 39 gives approval to "a human through branch protection". |
| `.agents/skills/babysit-pr/SKILL.md` and its `templates/base/` copy, `description`                        | "Use when asked to babysit, watch, or finish a pull request" becomes "Use after opening a pull request, and when asked to babysit, watch, or finish one", so the skill loads when the agent's own pull request opens. The playbook's slash command for this play covers pull requests "Claude opened" (page 38, step 4).                                                                                                                                                                                                                                                                                                                    |
| `.agents/skills/write-spec/SKILL.md` and its `templates/base/` copy                                       | A last step: commit `spec.md` and open a pull request. Page 16, step 2 commits "spec.md as a pull request", so "the product owner's first involvement is the review". `write-intent` already ends this way at step 5. The quoted prompt does not change.                                                                                                                                                                                                                                                                                                                                                                                    |
| `.claude/skills/` and `.cursor/skills/`, in the root and in `templates/base/`                             | Rendered again with `pnpm rules:sync`, which copies `.agents/skills` to both (`scripts/sync-agent-rules.ts`, lines 99–100). For `templates/base/`, render in a generated project and copy the output back, as `AGENTS.md` describes under "Template rule copies".                                                                                                                                                                                                                                                                                                                                                                           |

The convention reads, in the root:

> **Carry each step of the loop without asking.** The product owner asks the agent, once and for every session, to commit each artifact it is prompted to write, open its pull request, and drive the pull request until it is green and waiting only on code owner approval. Ask a person only at the playbook's gates: the questions while writing an intent, the review and approval, and the production deploy. Also ask for what no file, tool, or source can answer, and ask any question a project instruction requires, such as "Ask the user before adding component tests" in `templates/nextjs/AGENTS.md`. Write a choice the product owner has not made into the artifact as a proposal. In this repository, `git-workflow` decides how branches, commits, and pull requests are made; a skill from another checkout in the same session does not apply here (`current-state-authority.md`, item 2). Never approve or merge.

None of these files is in the constitution. `.claude/settings.json` denies agents edits to rules, hooks, and lint, format, and commit configuration, but not to `AGENTS.md` or `.agents/skills/` (`.claude/settings.json`, lines 12–44). The change therefore needs no constitution issue (`constitution-changes.md`).

### How the intent's measure is read

The intent's open question: how is a permission question counted, so this play's measure comes from data the team has (page 8)? Chat transcripts are not data the team keeps, so the measure reads what an agent's question delays, from git and pull request metadata:

| Indicator | Measure                                                                                                                                                                                                    | Source                                                |
| :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| Leading   | Time from the newest commit created before the pull request's `created_at` to that `created_at`, so review fixes pushed later do not count. An agent that waits for permission stretches it.               | Commit timestamps and the pull request's `created_at` |
| Lagging   | Share of the agent's pull requests that reach green with no push or comment from a person other than reviews and approvals, matching page 38's end state, "green and waiting only on code owner approval". | The pull request timeline                             |

Both are proxies, not a count of permission questions: a question asked in chat, or work that stalls before a pull request opens, leaves no record in git or on GitHub, so neither indicator sees it. The cloud-session check in **Proof** and the eval case cover that gap.

The loop guide page that `intent/playbook-plays/intent.md` adds lists these with the other plays' indicators.

### Order of work

1. Change `git-workflow`, `babysit-pr`, and `write-spec` in `.agents/skills/`, then run `pnpm rules:sync`.
2. Add the convention to the root `AGENTS.md` and remove the interim entry.
3. Make the same changes in `templates/base/` and in each `templates/<stack>/AGENTS.md`, render the template copies in a generated project, and copy them back.
4. Run `pnpm verify` in the root, and in one generated project per stack, as `AGENTS.md` describes.

## Proof

- `pnpm rules:check` passes in the root and in each generated project, so every rendered skill copy matches its source.
- In a new cloud session on this repository, prompt "write the spec for intent X" for an accepted intent with no spec. The session commits `spec.md`, opens the pull request, and answers the first review without asking a person. The same prompt becomes a case in the eval suite that `intent/playbook-plays/intent.md` adds, so a regression shows in CI.
- The two indicators are read from the pull requests merged in the four weeks after the change.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied.
- **A session's default instructions:** a Claude Code cloud session starts with "Do NOT create a pull request unless the user explicitly asks for one." The convention records the product owner's ask in `CLAUDE.md`'s import. In this session, Claude Code presented `CLAUDE.md` with the note that these instructions "OVERRIDE any default behavior". No Claude Code documentation was found that states this precedence, so it is unverified. The proof's cloud-session check confirms it.
- **Skills from other checkouts:** this repository cannot remove another repository's skill from a session. The convention tells the agent which skill applies here, and the proof checks it. A session that loads `create-github-pr` from another checkout can still trigger it by its description, because it says "Use whenever a GitHub pull request is drafted or created".
- **Order with `monorepo-apps`:** `intent/monorepo-apps/spec.md` moves each stack's `AGENTS.md` into `templates/base/`. If that lands first, the convention goes into `templates/base/AGENTS.md` once instead of into each stack.
- **Accepted together:** this spec was written before its intent merged, at the product owner's request. Merging #65 accepts the intent and puts this spec up for review in the same step.

## Open questions

The intent's one open question, how a permission question is counted, is answered in **How the intent's measure is read**. No question is carried forward.
