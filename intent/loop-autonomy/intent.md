# Intent: The agent carries each step of the loop without asking for permission

Author: Joe Takara (Developer Productivity). Status: accepted.

## Problem

This repository runs the AI-native SDLC Playbook on itself before it ships the loop to every generated project. While doing that, the agent asked the product owner in chat whether to open the pull request for `intent/monorepo-apps/spec.md` (pull request #65), and asked which fix to apply to the stale `Status:` lines, although `intent/playbook-plays/intent.md` already says who writes them. The product owner had to answer before the work moved, so a person blocked a step the playbook never gives to a person.

The playbook does not ask the agent to seek permission for these steps:

- A step's output is a committed artifact that starts the next step: "A stage ends by committing an artifact with the commit initiating the next stage" (page 8), and the end state is "a loop in which each accepted artifact fires the next gate. Human attention concentrates at the gates" (page 9).
- What the agent writes arrives as a pull request: "Anything the agent writes arrives as a PR through branch protection" (page 45), and the spec pass commits "spec.md as a pull request", so "the product owner's first involvement is the review" (page 16).
- The agent drives a pull request it opened: "For PRs Claude opened, go further and let Claude babysit the PR to merge … until the PR is green and waiting only on code owner approval" (page 38).
- The person acts at the gates: answering the intent questions (page 12, step 2), approving through branch protection, "Approval comes from a human through branch protection" (page 39), and authorizing production (page 46).

The agent asked because other instructions loaded into the session outranked this repository's:

| Instruction                                                                      | Where it comes from                                                                                          | What the repository says                                                                                                     |
| :------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| "Do NOT create a pull request unless the user explicitly asks for one."          | The default instructions of a Claude Code cloud session                                                      | `.agents/skills/git-workflow/SKILL.md`, line 12: "push its branch and open the pull request ready for review without asking" |
| "Run `gh pr create` only when the user explicitly asks to open or create the PR" | The `create-github-pr` skill of another repository checked out in the same session (`friday-code-standards`) | The same `git-workflow` skill covers opening a pull request in this repository                                               |
| "Drive it to merge-ready only when the user asks"                                | This repository: `.agents/skills/git-workflow/SKILL.md`, line 14, in the root and in `templates/base/`       | Page 38 has the agent babysit every pull request it opened, without being asked                                              |

The automated handover in `intent/playbook-plays/intent.md` runs the spec pass as a CI job, outside any chat, which removes the question for that step. Until each step is automated, the playbook expects them to be prompted by hand ("First, you prompt each step by hand", page 9), and in those sessions the instructions above still apply.

## Proposed outcome

- In the root and in every template, the agent carries out the mechanical steps of the loop without asking: it commits the artifact it was prompted to write, opens the pull request, and drives it until it is green and waiting only on code owner approval. It asks a person only at the gates the playbook gives a person: the questions while writing an intent (page 12), the review and approval (pages 16 and 39), the production deploy (page 46), and anything no file, tool, or source can answer (`agent-owned-work.md`).
- A choice the product owner has not made goes into the artifact as a proposal, for the product owner to correct in review, not into a chat question.
- `AGENTS.md` states this as the product owner's standing request, in the root and in every template, so a session's default "only when the user explicitly asks" is met by an explicit, recorded ask. The correction added to the root's `AGENTS.md` in pull request #65 ("Asking the product owner") is the first form of it, made under page 38, step 5: "When a review flags a mistake for the second time, the correction goes into CLAUDE.md".
- `git-workflow` line 14 follows page 38: the agent drives every pull request it opened to merge-ready, without being asked. Merging stays with a person.
- In a session on this repository, the repository's own skill decides how a pull request is opened. Project instructions on the affected path come before other sources (`current-state-authority.md`, item 2), so a skill from another checkout, such as `create-github-pr`, does not override `git-workflow`.

## Affected users and systems

- The product owner and the engineers of this repository and of every generated project.
- `AGENTS.md` and `.agents/skills/git-workflow/SKILL.md` in the root and in `templates/base/`.

## Constraints

- The product owner put this intent ahead of the other accepted intents.
- The agent still never approves or merges (page 39), never passes the production gate (page 46), and asks the intent questions the playbook lists (page 12, step 2).
- This repository cannot change a session's default instructions or another repository's skills; the outcome works through this repository's own files.

## Open questions

- How is a permission question counted, so the playbook's measure for this play can be read from data the team has (page 8)? Pull request comments and chat transcripts are candidates; the spec decides.
