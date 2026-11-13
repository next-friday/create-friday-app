# Spec: Make the CLI easy to start, gate on evals, route work by model, and close what earlier work left open

From `intent/starter-follow-ups/intent.md`. Status: draft.

Request: "docs(repo): add the starter follow-ups intent (#218)", the merge of the intent's pull request by the product owner. Skills at `9d4c827`.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review. Item numbers are those of the intent's **Problem** section.

## Requirements

Delivery 1, items 3 to 5:

1. Every stack's `AGENTS.md` says that `RELEASE_APPROVAL` lifts the production gate only when it matches the extended regular expression on the first line of `.agents/release-approval-form`, and no longer says that any value but an empty one, `0`, `false`, or `no` lifts it.
2. The production gate paragraph of `templates/base/SETUP.md` and of each stack's `AGENTS.md` is held once, with a `deploy:railway` section around only the clause that names the Railway command.
3. A test in `test/create.test.ts` fails when `templates/deploy-railway/turborepo/turbo.json` differs from `templates/turborepo/turbo.json` in anything but the `railway.json` entry of `globalDependencies`.
4. The `CONTRIBUTING.md` of a project with the deploy target `none` says nothing of promoting a commit; with `railway` it says what it says today.
5. The root `.github/workflows/ci.yml` Template job fails a project with the deploy target `none` whose file names or file content name the host, and its message says "deploy target".
6. The root Consumer Smoke job generates a project with `--deploy none` and one with `--deploy railway`.
7. The WCAG criteria under the UX policy line and area of concern 1 of `intent/chat-reply-ux/spec.md` are those of the standard at <https://www.w3.org/TR/WCAG22/>, quoted with their numbers and names. When the standard cannot be opened, the numbers written from memory are removed, and the spec says the criteria are not named because the standard could not be opened.

Delivery 2, item 6:

8. The `setup-sdlc` skill offers three roles, each a model the session offers and a reasoning effort from the budget:
   - `main`: the model of the session itself, which does the work. **Proposal:** default `sonnet`.
   - `explore`: the model of a subagent that reads and searches files and runs checks. **Proposal:** default `haiku`.
   - `advise`: the model of a subagent that reviews a plan, a recurring failure, or work about to be reported done, and returns advice. **Proposal:** default `opus`.
9. **Proposal:** `setup-sdlc` writes the three role lines and the budget into a rule the agent tool loads in every session: `~/.claude/rules/sdlc-models.md` for Claude Code and `~/.cursor/rules/sdlc-models.mdc`, with `alwaysApply: true`, for Cursor. It no longer writes `.agents/sdlc-models.md`. It writes no model the session does not offer.
10. `setup-sdlc` cannot switch the session's own model, so it tells the person which model to choose for the `main` role, and how, in their agent tool.
11. The playbooks start a subagent on the `explore` model to read or search more than a few files, and the `verifier` subagent on the `explore` model.
12. The `build` and `fix` playbooks start a subagent on the `advise` model, give it the material below, and act on its advice or say why not:
    1. when the draft plan is written, before its pull request is opened: the plan and the spec;
    2. when the same check fails a second time after a fix: the failure, the change, and the log;
    3. before the reply reports the work done: the diff, the spec, and the checks' output.
13. With no rule or no line for a role, a playbook starts the subagent on the session's model and says so in the reply.
14. `SETUP.md` says that Claude Code's advisor tool, set with `/advisor opus`, gives the same advice inside the session on the Anthropic API and Claude Platform on AWS, and that it is experimental.

Delivery 3, item 1:

15. The name prompt accepts `my-app` when the person presses Enter. **Proposal:** `my-app`.
16. The stack prompt starts on one stack, chosen by pressing Enter. **Proposal:** Next.js.
17. Each prompt asks a full question that says what the choice gives, and each stack's choice names what the project holds.
18. `--yes`, with the short form `-y`, creates the project with the defaults of requirements 15 and 16 and asks nothing, with or without a terminal. A name or a `--stack` given with it wins over the default.
19. `--yes` with no name stops before writing a file when a directory `my-app` exists and is not empty, and the message names it and says to pass a name.
20. `--help` lists `--yes` and the defaults.
21. Every argument, prompt order, and stack name that exists today works as today. A run without a terminal and without `--yes` still needs a name and `--stack`.

Delivery 4, item 2:

22. A generated project holds the plugin's eval cases, rendered by `pnpm plugin:sync` into `templates/base/plugins/sdlc/claude-code/evals/`.
23. A workflow in `templates/base/.github/workflows/` runs `claude plugin eval plugins/sdlc/claude-code` on a pull request that changes a file under `plugins/sdlc/` or `.agents/`, with `--json`, `--trust-plugin`, a pinned `--model`, `--threshold`, and `--max-cost-usd`, and fails when the command exits with a code other than 0.
24. The workflow runs only when the repository variable `CLAUDE_CI_ENABLED` is `true`, and uses the secret `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`, as `SETUP.md` step 8 says for the other model jobs.
25. Each run's `results.json` is kept as an artifact of the workflow run.
26. **Proposal:** the threshold and the cost ceiling are the repository variables `EVAL_PASS_THRESHOLD` and `EVAL_MAX_COST_USD`, with defaults `0.8` and `20`, the values of the example in "Run evals in CI" of the plugin eval documentation.
27. `SETUP.md` step 8 names the workflow, the two variables, and that each run is a model call billed to the account.

Every delivery:

28. `pnpm plugin:sync` renders each changed plugin file, and `pnpm plugin:check` passes.
29. `pnpm verify` passes in a generated project of each of the five stacks with each deploy target.
30. Each delivery is one pull request with its own changeset: `patch` for delivery 1, and **Proposal:** `minor` for deliveries 2, 3, and 4. Delivery 1 is a fix and a rewording; the others add what a project or a person can do.

## Design

Delivery 1:

- Each stack's `AGENTS.md` and `templates/base/SETUP.md`: the two variants of the production gate paragraph become one paragraph; only the Railway clause sits in a `deploy:railway` section. The sentence on `RELEASE_APPROVAL` names `.agents/release-approval-form`.
- `test/create.test.ts`: the `turbo.json` case reads both files as JSON, drops `railway.json` from the deploy layer's `globalDependencies`, and compares.
- Each stack's `CONTRIBUTING.md`: the sentence on promotion sits in a `deploy:railway` section.
- The root `.github/workflows/ci.yml`: the host check adds `find -iname '*railway*'`; Consumer Smoke loops over both deploy targets. A person commits it from a patch.
- `intent/chat-reply-ux/spec.md`: the UX line and area of concern 1, with the quoted criteria or the removal.

Delivery 2:

- `plugins/sdlc/source/skills/setup-sdlc/SKILL.md`: steps 1 to 5 detect the models, ask the budget, choose the three roles, and write the rule of requirement 9; a step says how to choose the session's model.
- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`: one paragraph on starting a subagent on a role's model, the fallback of requirement 13, and how each tool takes the model: Claude Code's `model` and `effort` on the subagent call, Cursor's model slug on the `Task` call.
- `playbooks/build.md`, `fix.md`, `review.md`: the three moments of requirement 12, and the `verifier` on the `explore` model.
- `templates/base/SETUP.md`: the advisor tool sentence of requirement 14.

Delivery 3:

- `src/arguments.ts`: `--yes` and `-y`, and the usage text.
- `src/create.ts`: `askName` passes `defaultValue: "my-app"`; `askStack` passes `initialValue: "nextjs"`; `resolveProject` skips both prompts with `--yes`; the full questions. `@clack/prompts` 1.8.1 offers `defaultValue` on a text prompt and `initialValue` on a select prompt (`node_modules/@clack/prompts/dist/index.d.mts`).
- `src/stacks.ts`: each stack's hint says what the project holds.
- `test/arguments.test.ts`, `test/create.test.ts`: the cases of requirements 15 to 21.
- `README.md`: the quick start with Enter and with `--yes`.

Delivery 4:

- `scripts/sync-plugin.ts`: renders `plugins/sdlc/adapters/claude-code/evals/` into `templates/base/plugins/sdlc/claude-code/evals/`.
- `templates/base/.github/workflows/plugin-evals.yml` (new): the job of requirements 23 to 26. A person commits it from a patch.
- `templates/base/SETUP.md`, step 8: requirement 27.

## Policies

- **Brand:** rule 4, as requirement 17: each prompt and each stack's hint uses one name for one thing. The change shows no other brand value.
- **Security:** rule 6, as requirement 24: the eval workflow reads its credential from a repository secret and prints none. `v5.0.0-2.2.1`, as requirement 21: an argument is checked as today. The other chapters hold no Level 1 requirement for a prompt default, a document, or a CI job that runs the project's own cases.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- **UX:** the change adds no screen; the CLI's prompts are text in a terminal, and requirements 15 to 17 make each prompt say what it asks and accept a default with Enter. See area of concern 1.

## Areas of concern

1. UX, rule 2. The CLI is a terminal program, and WCAG 2.2 is written for web content. This spec names no success criterion for it.
   Decision: no criterion is named for the CLI; requirements 15 to 17 are the UX requirements.
2. No policy. Requirement 9 moves the model choice out of the project, so a team no longer shares one, and a CI job, which has no home-directory rule, takes the fallback of requirement 13.
   Decision: accepted. Each person's sessions offer different models.
3. No policy. Requirement 11 runs the `verifier` on the `explore` model, a smaller model than today's default for `verify`. A smaller model can miss a failure a larger one would catch.
   Decision: accepted, as the product owner's division of work puts subagent work on Haiku.
4. No policy. Requirement 26 sets a default threshold of `0.8`. On this repository's suite, one run on the small model passed every grader in 8 of 22 cases, so a project that turns the workflow on can find its pull requests red until its cases pass.
   Decision: the default is `0.8`, and `SETUP.md` says to run the suite once by hand before turning the workflow on.
5. No policy. Requirement 12 adds up to three subagent calls on the largest model to a build, each billed to the account.
   Decision: accepted. The calls happen at the three moments only.
6. No policy. Requirement 7 needs `www.w3.org` allowed in the session's network.
   Decision: the build asks once to allow the host; when that is declined, the numbers are removed.

## Open questions

1. The default stack: Next.js, requirement 16, a proposal.
2. The default project name: `my-app`, requirements 15 and 19, a proposal.
3. The release of item 1: `minor`, requirement 30, a proposal.
4. The eval pass-rate threshold: answered as requirement 26 and area of concern 4, a proposal from the documentation's example. The product owner decides it here.
5. Where each role's model is kept: answered as requirement 9, a proposal.
6. The roles: answered as requirement 8, a proposal.
7. The way to the WCAG standard: answered as requirement 7 and area of concern 6.
8. The order of delivery: requirements 1 to 7, then 8 to 14, then 15 to 21, then 22 to 27, each one pull request.
