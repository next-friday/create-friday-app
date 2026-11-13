# Intent: Make the CLI easy to start, gate on evals, route work by model, and close what earlier work left open

Author: @joetakara (Developer Productivity). Status: draft.

## Problem

The product owner asked for these six matters in one intent.

1. The CLI is hard for a person new to it. `src/create.ts:383` asks "Project name" with `my-app` only as a placeholder, so pressing Enter does not accept it, and `src/create.ts:401` asks "Stack" with no default. Neither prompt says what the choice gives. No argument accepts every default at once.
2. Evals do not gate a merge. The AI-native SDLC Playbook says "The pass-rate threshold is enforced as a merge check, runs are logged" (page 35). A generated project holds the `sdlc` plugin and no eval case, and no check reads a pass rate. This is item 16 of `intent/approval-evidence/intent.md`, which was left out of that spec.
3. Every stack's `AGENTS.md` describes the production gate wrongly. It says "Any value lifts the gate except an empty value, `0`, `false`, and `no`, in any letter case" (`templates/nestjs/AGENTS.md:49` and `:52`, and the same lines of the other four stacks). Since version 9.5.1, `templates/base/.agents/hooks/agent-production-gate.sh` lifts the gate only for a `RELEASE_APPROVAL` that matches the first line of `.agents/release-approval-form`. An agent that reads `AGENTS.md` has the gate wrong.
4. An independent audit of the deploy target change found four things that `intent/chat-reply-ux/intent.md` left out of scope:
   1. `templates/deploy-railway/turborepo/turbo.json` is a whole copy of `templates/turborepo/turbo.json`, and nothing finds the two drifting apart.
   2. The production gate paragraph is held once for each deploy target, whole, in `templates/base/SETUP.md` and in each stack's `AGENTS.md`, where only one clause differs.
   3. The `CONTRIBUTING.md` of a project with no deploy target says that "every deploy promotes a commit from `main` (see the Deploy section in the README)" (`templates/nestjs/CONTRIBUTING.md:48`), and that README's deploy section describes no promotion.
   4. The root `.github/workflows/ci.yml` reads the content of a generated project's files for the host name and not their names, its message says "deploy host" where the CLI says "deploy target", and its Consumer Smoke job never passes `--deploy`.
5. `intent/chat-reply-ux/spec.md` names two WCAG 2.2 success criteria from memory, under its UX policy line and its area of concern 1, because the standard could not be opened from the session that wrote it. The repository's rule `.agents/rules/evidence-before-claims.md` says not to write a value without a source.
6. The plugin does not route work by model. The `setup-sdlc` skill writes a model and an effort for four roles, `build`, `review`, `verify`, and `evals`, into `.agents/sdlc-models.md`, and only the `verify:` line is read, by `plugins/sdlc/source/skills/sdlc-mode/playbooks/build.md:28`. No step sends exploring files to a smaller model, and no step asks a stronger model at a hard decision.

## Proposed outcome

1. A person who presses Enter at every prompt gets a working project, and one argument gives the same project with no prompt. Each prompt says, in a full sentence, what the choice gives. Every argument, prompt, and stack name that exists today works as it does today.
2. A generated project holds eval cases for the plugin, and its CI fails a pull request whose pass rate is under a threshold the project sets. Each run is kept.
3. Every stack's `AGENTS.md` states the condition that lifts the production gate as the hook applies it.
4. The four findings of item 4 are fixed: the two `turbo.json` files cannot drift unseen, the production gate paragraph holds its target-specific clause once, a project's `CONTRIBUTING.md` matches its deploy target, and the root CI checks file names, says "deploy target", and generates a project with each deploy target in Consumer Smoke.
5. The WCAG criteria in `intent/chat-reply-ux/spec.md` are read from the standard, or, when it cannot be opened, the numbers written from memory are removed and the spec says so.
6. The product owner's division of work:
   - Sonnet does the main work.
   - Haiku takes subagent work, such as exploring files.
   - Opus advises: when a plan is made, when a bug recurs, and before work is reported done.

   This works in both agent tools the plugin is rendered for. The `pstack` plugin of `cursor/plugins` (commit `05b4917`) does the same: its `setup-pstack` skill writes one line per role into a rule the agent tool loads in every session, `~/.cursor/rules/pstack-models.mdc` in Cursor and `~/.claude/rules/pstack-models.md` in Claude Code, and its `poteto-mode` skill passes an "explicit model per role (configurable via `/setup-pstack`)" with each subagent it starts. Claude Code's advisor tool matches the three moments: "before committing to an approach, when stuck on a recurring error, or before declaring a task complete" (https://code.claude.com/docs/en/advisor).

Out of scope:

- Removing or renaming an argument, a prompt, or a stack.
- Deprecating a published version on npm.

## Affected users and systems

- A person who creates a project, often for the first time.
- An engineer and a reviewer in a generated project: the eval check, the production gate's description, and the models the plugin starts.
- The CLI: `src/create.ts`, `src/arguments.ts`, and their tests.
- The templates: each stack's `AGENTS.md` and `CONTRIBUTING.md`, `templates/base/SETUP.md`, the `deploy-railway` layer, the stacks' workflows.
- The plugin: the `setup-sdlc` skill, the playbooks that start a subagent, the eval cases.
- This repository's `.github/workflows/ci.yml` and `intent/chat-reply-ux/spec.md`.
- `@next-friday/create-app` on npm: each part needs a new version.

## Constraints

- An eval run calls a model and costs money, so the check is off until a project turns it on; the templates already gate every model call behind the repository variable `CLAUDE_CI_ENABLED`. What depends on a customer's environment, such as a model provider or a secret, is not built in.
- No eval grader is loosened to pass.
- The workflows and the hooks are in the constitution: a person commits them from a patch.
- A model the session does not offer is never written. Claude Code's advisor tool is experimental and works only on the Anthropic API and Claude Platform on AWS, so it is not the only way the advice is asked for.
- Opening the WCAG standard needs `www.w3.org` allowed in the session's network.

## Open questions

1. The default stack. **Proposal:** Next.js.
2. The default project name. **Proposal:** `my-app`; the argument that accepts every default stops with a message when a directory of that name already exists.
3. The release of item 1. **Proposal:** `minor`, because every command that ran before still runs the same way.
4. The eval pass-rate threshold. No proposal: no source gives a number. The product owner decides it in the spec.
5. Where the model of each role is kept. **Proposal:** in a rule in each person's home directory, as `pstack` does, because each person's sessions offer different models; the alternative is the project's `.agents/sdlc-models.md`, shared by the team.
6. The roles. **Proposal:** main, explore, and advise, in place of the four roles of today, and every role line is read by a step that starts a subagent.
7. The way to the WCAG standard. **Proposal:** allow `www.w3.org` in the session's network and read it; when that is declined, remove the numbers.
8. The order of delivery. **Proposal:** items 3, 4, and 5 first, because they are small and correct what is wrong; then item 6, item 1, and item 2. Each delivery is one pull request and one version.
