# Intent: Write and clean the loop's text the way `pstack` does

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- The loop's output is text: `intent.md`, `spec.md`, `plan.md`, changesets, pull request descriptions, and commit messages. Executives, sales, business analysts, and engineers read these files to decide and to build.
- The text is hard to read. In the 27 Markdown files under `intent/` at commit `257532c`, 555 of 1,915 sentences are longer than 25 words, which is 29%. The files hold 317 semicolons. A script counted both, with code blocks, tables, and headings left out.
- No skill says how to write. The six skills under `.agents/skills/` are `sdlc`, `sdlc-help`, and the four policies. The only rule for a writer is the convention **Write replies a person can check** in `AGENTS.md`. It covers what a reply may claim, not how a document reads.
- A pull request description has no fixed shape for a reviewer. `open-pr.md` step 4 fills `.github/pull_request_template.md` with what changed, the issue, and the checks.
- The agent that wrote the code also removes its comments. `open-pr.md` step 1 has that agent clean its own diff, and no second reader looks.
- No check reads prose. `pnpm verify` formats Markdown with Prettier and lints its structure, and a sentence of 60 words passes both.

## Proposed outcome

The loop writes and cleans text as `pstack` does in the `cursor/plugins` repository. A point below that follows `pstack` names the file it follows.

- **Two skills, used in order.** `technical-writing` holds how to write. `unslop` holds the patterns to remove. A playbook writes with the first and then cleans with the second (`pstack/skills/poteto-mode/playbooks/opening-a-pr.md`).
- **`technical-writing` keeps its four layers** (`pstack/skills/technical-writing/SKILL.md`):
  - Pick one mode for a document: tutorial, how-to, reference, or explanation.
  - Write sentences to the reader.
  - Make statements load one at a time.
  - Leave no sentence open to two readings.
- **Each kind of text names the layers that apply to it.** A pull request description and a commit message use every layer except the choice of mode. A plan is a how-to (`pstack/skills/poteto-mode/playbooks/multi-phase-plan.md`). **Proposal:** the skill says the same for an intent, a spec, and a changeset, which `pstack` does not have.
- **A rule never makes a sentence worse.** The skill keeps "When a rule makes a sentence worse, fix the sentence another way or leave it alone", and the section on varying sentence length.
- **The skill shows one worked example**, with the text before and after.
- **`unslop` keeps stable rule numbers.** Other skills cite a rule by its number, and "A removed rule leaves a gap" (`pstack/skills/unslop/SKILL.md`).
- **A new jargon word enters by proposal.** An agent that finds one proposes it in its reply as a change to the jargon rule of `unslop`, and does not edit the skill itself (`pstack/skills/technical-writing/SKILL.md`).
- **The playbooks call the skills at fixed points** (`pstack/skills/poteto-mode/SKILL.md`):
  - Any text a person reads, a reply in a session included, goes through `unslop`.
  - An intent, a spec, a plan, a changeset, a pull request description, and a commit message are written with `technical-writing`.
  - Before a commit, the diff is cleaned of code that only a machine would write, as the `deslop` skill of `cursor-team-kit` does.
  - Before a review, a subagent that did not write the code reads the comments, as `no-comments` does with its own subagent.
- **A pull request description is a briefing a reviewer reads in a minute** (`opening-a-pr.md`). "It says why the change exists, what it leaves out, what it could break, and how you proved it works." **Proposal:** these points go inside the sections of `.github/pull_request_template.md`, which keeps its headings.
- **A change to a skill is tested blind.** The session under test does not know it is tested, and the judge does not know which version wrote which text (`pstack/skills/poteto-mode/playbooks/eval.md`).
- **One step past `pstack`: a script checks every text, not only a plan.** `pstack` checks the text of a plan with a script, which fails on a long dash, a curly quote, and a colon in mid-sentence (`pstack/skills/poteto-mode/scripts/check-plan.mjs`). A person runs ours with one command, `pnpm verify` runs it, and CI runs it. It reads the Markdown files and the commit messages that a branch adds or changes. It fails with the file, the line, the rule number, and the fix. **Proposal:** it fails only on rules with one right answer, such as a listed word, an em dash, a semicolon, or heading case. It reports a long sentence without failing, so no one shortens a sentence only to pass.
- The skills sit where the `sdlc-mode` skill sits and move with it. When the `sdlc-mode` skill ships in a plugin, they ship in the same plugin.
- A generated project gets the skills and the check, and so does this repository.
- **Proposal** for the spec to compare, with sources: a maintained prose linter, such as Vale or textlint, against a script of our own. `.agents/rules/platform-and-library-first.md` puts a maintained library before custom code.
- Out of scope:
  - Rewriting files that already exist. An intent, a spec, or a plan that is on `main` keeps its text.
  - Rules for Thai text.
  - Text in a product's user interface, which the brand and UX policies cover.

## Affected users and systems

- Every reader of an intent, a spec, a plan, a changelog, or a pull request in this repository and in each generated project.
- Every agent that writes one of those through the `sdlc-mode` skill, and every person who reads its replies.
- The playbooks `plan`, `design`, `build`, `fix`, `maintain`, `review`, and `open-pr`, the reply shape in the `sdlc-mode` skill, the eval cases, the scripts of `pnpm verify`, and CI, in the root and in `templates/base/`.

## Constraints

- The check reads only what a branch adds or changes, so no accepted file has to change to pass it.
- The check costs nothing to run: it calls no model and no paid service.
- The source skills are under the MIT License: `pstack` with "Copyright (c) 2026 Lauren Tan" (`pstack/LICENSE`), and `cursor-team-kit` with "Copyright (c) 2026 Cursor" (`cursor-team-kit/LICENSE`). A file that carries their text carries the notice.
- The skills name no vendor's agent tool, as `intent/sdlc-plugin/intent.md` asks of every skill that will move into the plugin.
- `.agents/rules/code-comments.md` stays the rule for comments. The subagent that reads comments applies it and adds no second rule.
- The product owner decided that each skill is made and changed with Anthropic's `skill-creator` skill (`anthropics/skills`, `skills/skill-creator/SKILL.md`): "Create new skills, modify and improve existing skills, and measure skill performance." Its loop runs each test case with the skill and against a baseline, grades the runs, and shows the results to a person.
- A rule that a script cannot decide stays in a skill as guidance and is not half-checked.
- The human gates stay as they are.

## Open questions

- Which rules a script can decide without a false alarm.
- Whether a failed rule blocks a commit, a push, or only CI.
- How the check reads a pull request description, which is not a file in the branch.
- Whether quoted text, such as a source passage inside a spec, is checked.
- Which linter the spec chooses, and whether its rule packages may be used under their licences.
- How a blind test runs: with the eval runner this repository has, whose cases are in `.agents/skill-evals/`, or with `claude plugin eval`, which scores a plugin against a run with no plugin ([Claude Code: Test plugins with evals](https://code.claude.com/docs/en/plugin-evals.md)).
- How the blind test of `pstack` and the blind comparison of `skill-creator` fit into one procedure.
- How much a second subagent for comments adds to the cost of each pull request.
