# Spec: Ship the SDLC playbook as the `sdlc` plugin

From `intent/sdlc-plugin/intent.md`. Status: accepted.

Request: "/sdlc intent/sdlc-plugin/intent.md". Skills at `90c2ed0`.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. The plugin's source is one directory, `plugins/sdlc/source/`. It holds the skills `sdlc` with every playbook, `sdlc-help`, `setup-sdlc`, and the four policy skills; the text of the `verifier` subagent; and the scripts `check-plan.ts`, `check-bands.ts`, and `measure-loop.ts`.
2. No file under `plugins/sdlc/` imports, links to, or copies a file of this repository outside `plugins/sdlc/`. `pnpm plugin:check` fails when one does.
3. No file under `plugins/sdlc/source/` names a vendor's agent tool. `pnpm plugin:check` fails when a name from `plugins/sdlc/adapters/vendor-names.json` appears there.
4. `pnpm plugin:sync` renders the source into one adapter for each tool, `plugins/sdlc/adapters/claude-code/` and `plugins/sdlc/adapters/cursor/`. Each adapter holds the rendered skills and subagent, whose tool-specific fields come from `plugins/sdlc/adapters/agents.json`, and that tool's manifest, `.claude-plugin/plugin.json` or `.cursor-plugin/plugin.json`, with `"name": "sdlc"` and no person's name or email. The Claude Code adapter also holds the eval cases, in `plugins/sdlc/adapters/claude-code/evals/`. `pnpm plugin:check` fails when an adapter is stale, and `pnpm verify` runs it.
5. Adding a tool adds one directory under `plugins/sdlc/adapters/` and one entry in the render script. It changes no file under `plugins/sdlc/source/`.
6. The repository root holds one marketplace file for each tool, `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`. Each lists the plugin `sdlc` and points to that tool's adapter. **Proposal:** the marketplace is named `next-friday-plugins`, so this repository enables `sdlc@next-friday-plugins`.
7. In a Claude Code session with the plugin loaded, `/sdlc:sdlc-mode <request>` runs the loop, and `claude -p "/sdlc:sdlc-mode <request>"` runs it without a terminal session.
8. The manifests carry no `version` field, so the version of the plugin is its commit.
9. A project that has its own policy keeps it at `.agents/skills/<area>-policy/SKILL.md`. The `design`, `build`, and `review` playbooks read that file when it exists, and the plugin's default otherwise.
10. The plugin's playbooks carry the text of these five conventions, and name no `AGENTS.md` convention by its heading: **Start from the accepted spec, in plan mode**; **Start a bug fix with a failing test**; **Do not start work a person did not ask for**; **Branch from the latest `origin/main`, and open the pull request ready for review**; **Write replies a person can check**.
11. `AGENTS.md` holds none of the five conventions of requirement 10. One convention names the plugin's `sdlc-mode` skill as the way work runs. It keeps the sentence of its branch convention that is a fact about this repository: its skills and playbooks decide over a skill from another checkout.
12. The plugin's skills name `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md` by path where they rely on them, and restate neither.
13. Every step marked **Gate** in a playbook today is in the plugin's playbook word for word, except that `.agents/skills/sdlc/playbooks/<file>` is written `playbooks/<file>` and `/sdlc` is written `/sdlc:sdlc-mode`.
14. The `setup-sdlc` skill, run in a project:
    1. Asks for a budget in one question and writes the model for each role to `.agents/sdlc-models.md`, chosen from the models the session offers. **Proposal:** the four choices are those of `setup-pstack` (`unlimited`, `large`, `medium`, `small`), and the roles are build, review, verify, and evals.
    2. Reads `SETUP.md` and reports, for each step, whether it is done.
    3. Does the steps an agent can do, and lists the steps a person does outside the repository.
    4. Gives the same result when it is run again with the same answers.
15. When `.agents/sdlc-models.md` names a model for the verify role, the `sdlc-mode` skill starts the `verifier` subagent on that model. An eval case shows it.
16. The eval cases run with `claude plugin eval`, which scores the plugin against a run with no plugin ([Claude Code: Test plugins with evals](https://code.claude.com/docs/en/plugin-evals.md)). No script of this repository runs them, and the root's `scripts/run-agent-evals.ts` is deleted.
17. This repository uses the plugin from its own tree: its skills, subagent, eval cases, and the three scripts exist once outside `templates/`, under `plugins/sdlc/`.
18. `.github/CODEOWNERS` in the root names an owner for `/plugins/sdlc/`, for the `sdlc-mode` skill inside it, and for each policy skill inside it.
19. A reply of the `sdlc-mode` skill gives the full URL of each pull request, issue, branch, workflow run, and file on the host that it names. Its **Status** line gives the URL of the page where the person acts next. The product owner decided this.

## Design

Risk: higher. The change replaces how this repository receives the instructions its agents follow.

**Layout.**

```text
plugins/sdlc/
  source/
    skills/sdlc-mode/SKILL.md, playbooks/*.md
    skills/sdlc-help/SKILL.md
    skills/setup-sdlc/SKILL.md
    skills/<area>-policy/SKILL.md
    agents/verifier.md
    scripts/check-plan.ts, check-bands.ts, measure-loop.ts
  adapters/
    agents.json, vendor-names.json
    claude-code/.claude-plugin/plugin.json, skills/, agents/, evals/<skill>/<case>/
    cursor/.cursor-plugin/plugin.json, skills/, agents/
.claude-plugin/marketplace.json
.cursor-plugin/marketplace.json
```

The `cursor/plugins` repository ships `pstack` the same way: its root holds `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`, the Cursor copy is `pstack/` with `.cursor-plugin/plugin.json`, and the Claude Code copy is `harness/pstack/claude-code/` with `.claude-plugin/plugin.json`.

Moving the plugin to a repository of its own moves `plugins/sdlc/` and the two marketplace files.

**What the plugin reads in a project.** `intent/`, `bands.yaml`, `SETUP.md`, `AGENTS.md`, `.agents/rules/agent-owned-work.md`, `.agents/rules/evidence-before-claims.md`, `.agents/skills/<area>-policy/SKILL.md`, and `.agents/sdlc-models.md`. It reads them where the project keeps them, and holds no copy.

**Files that change.**

| File                                                                                             | Afterwards                                                                                                                                                                         |
| :----------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/`, `.agents/agents/`, `.agents/agents.json`, `.agents/skill-evals/`, in the root | Hold nothing the plugin holds. The skills, the subagent's text, and the scripts move to `plugins/sdlc/source/`; the eval cases and `agents.json` move to `plugins/sdlc/adapters/`. |
| `.claude/skills/`, `.claude/agents/`, `.cursor/skills/`, `.cursor/agents/`, in the root          | The rendered copies of the moved skills and subagent are removed.                                                                                                                  |
| `scripts/sync-plugin.ts` (new)                                                                   | Renders `plugins/sdlc/source/` into the two adapters. With `--check` it fails on a stale adapter and runs the checks of requirements 2 and 3.                                      |
| `scripts/sync-agent-rules.ts`, root                                                              | Renders rules, `review.md`, and `mcp.json`, and a project's own policy skill. A person commits this file.                                                                          |
| The playbooks under `plugins/sdlc/source/skills/sdlc-mode/`                                      | Carry the five conventions of requirement 10, and read a project's policy file before the plugin's default.                                                                        |
| `scripts/run-agent-evals.ts`, root                                                               | Deleted. `claude plugin eval` runs the cases in `plugins/sdlc/adapters/claude-code/evals/`.                                                                                        |
| `.claude/settings.json`, root                                                                    | Gain `extraKnownMarketplaces` and `enabledPlugins`. The root names its own tree as the marketplace. A person commits this file.                                                    |
| `AGENTS.md`, root                                                                                | Lose the five conventions; gain the one convention of requirement 11. The sections that remain state commands, checks, architecture, and corrections for this repository.          |
| `package.json`, root                                                                             | The three script entries run the plugin's scripts and `evals:run` runs `claude plugin eval`; the root gains `plugin:sync` and `plugin:check`.                                      |
| `.github/CODEOWNERS`, root                                                                       | The lines for `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` become lines for `/plugins/sdlc/`.                                                                       |
| `.agents/review.md` and `REVIEW.md`, in the root                                                 | Name the policies in force, the project's own or the plugin's default, in place of "the four policies in `.agents/skills/`".                                                       |
| `scripts/check-changesets.ts`                                                                    | Its fixtures name paths that exist after the move.                                                                                                                                 |
| `intent/README.md`, `CONTRIBUTING.md`                                                            | Name the plugin's skill in place of `/sdlc`.                                                                                                                                       |

**Order of dependencies.** The source directory and the render script come first, because every later step reads them. The Claude Code adapter is proved with the command line before this repository stops carrying copies. The Cursor adapter is rendered from the same source.

## Policies

- **Brand:** rules 2 and 3. The plugin's name `sdlc`, given by the product owner in the intent, holds no organization name and appears in the command a person types. The two manifests are its declared source (requirement 4). Other files write it as a literal; see area of concern 1. Rule 5 does not arise: the spec invents no brand value.
- **Security:** chapters V13 and V15. No Level 1 requirement of V13 or V15 applies: `v5.0.0-13.4.1` is about a deployed application's source control metadata, and `v5.0.0-15.3.1` is about the fields an application returns. Rule 6 holds: the plugin and the settings hold no secret. No other chapter applies; the change has no web interface, session, token, or stored data.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person; requirement 4 keeps a person's name and email out of the manifests.
- **UX:** Does not apply. The change adds no screen, page, or form to a product; `setup-sdlc` asks its question in an agent session.

## Areas of concern

1. **The organization's name outside the manifests.** Brand policy, rule 3, and `.agents/rules/descriptive-naming.md`; owner: @joetakara. The name is in the marketplace name of requirement 6. **Proposal:** the marketplace name is the product owner's to choose.
2. **Where the model choices live** (requirements 14 and 15). Decision the files do not settle; owner: @joetakara. `setup-pstack` writes one file for a person, under that person's home directory. **Proposal:** one committed file for the project, `.agents/sdlc-models.md`, because the intent speaks of the budget the team has.
3. **The duplicate between the rules and the skill.** Decision the files do not settle; owner: @joetakara. The intent names `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md` as repeating the skill, and puts moving rules out of scope. **Proposal:** requirement 12: the rules stay the one place that says it, and the skill points to them.
4. **A person commits two of the changed files.** `.claude/settings.json` and `scripts/sync-agent-rules.ts` are in the constitution; owner: @joetakara. The plan names them as steps for a person.

## Open questions

- _How a playbook finds a project's own policy._ Answered by requirement 9: the project's file at `.agents/skills/<area>-policy/SKILL.md` wins, so a policy a project has already changed keeps its place and its code owner.
- _Where `setup-sdlc` writes the model choices._ Proposed in area of concern 2.
- _Which version the plugin runs._ Answered by requirement 8, from "without it the version is the commit" ([Claude Code: Plugin loading](https://code.claude.com/docs/en/plugins/loading.md)).
- _What `sdlc-help` and the eval cases read._ The plugin's own files: `sdlc-help` sits beside the playbooks in `plugins/sdlc/source/`, and the eval cases sit in the Claude Code adapter, where `claude plugin eval` reads them.
- _Whether an open skill format covers every agent tool._ Carried forward. `pstack/plugin.json` names a plugin manifest schema, `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`; it is not a skill format. The adapters of requirement 4 do not depend on the answer.
- _How the eval cases stay tool-neutral._ The cases are written for Claude Code's runner and sit in its adapter, so the source names no tool. Requirement 16 runs them with that runner; a runner for another tool, with its own cases, is carried forward.
- _Cursor adapter: how Cursor loads a plugin from a marketplace._ Carried forward. The `cursor/plugins` repository shows the manifest and the marketplace file.
- _Whether `claude -p "/sdlc:sdlc-mode …"` runs headless._ Carried forward as requirement 7; the plan proves it with a run before any copy is removed. A plugin enabled in project settings loads only in a folder the person has trusted, and "running with `-p` isn't enough" (same page).
- _Whether the short form `/sdlc` works._ Carried forward. Every file writes the full form.
- _Which earlier intents this replaces in part._ Carried forward. `lean-agent-setup`, `playbook-plays`, and `multi-agent-support` name copied skills; this spec changes none of them.
