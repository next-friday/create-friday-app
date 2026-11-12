# Spec: Ship the SDLC playbook as the `friday` plugin

From `intent/sdlc-plugin/intent.md`. Status: accepted.

Request: "/sdlc intent/sdlc-plugin/intent.md". Skills at `90c2ed0`.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. The plugin's source is one directory, `plugins/friday/source/`. It holds the skills `sdlc` with every playbook, `sdlc-help`, `setup-sdlc`, and the four policy skills; the `verifier` subagent; the eval cases; and the scripts `check-plan.ts`, `check-bands.ts`, and `measure-loop.ts`.
2. No file under `plugins/friday/` imports, links to, or copies a file of this repository outside `plugins/friday/`. `pnpm plugin:check` fails when one does.
3. No file under `plugins/friday/source/` names a model or a vendor's agent tool. `pnpm plugin:check` fails when a name from `plugins/friday/adapters/vendor-names.json` appears there.
4. `pnpm plugin:sync` renders the source into one adapter for each tool, `plugins/friday/adapters/claude-code/` and `plugins/friday/adapters/cursor/`. Each adapter holds the rendered skills and subagent and that tool's manifest, `.claude-plugin/plugin.json` or `.cursor-plugin/plugin.json`, with `"name": "friday"` and no person's name or email. `pnpm plugin:check` fails when an adapter is stale, and `pnpm verify` runs it.
5. Adding a tool adds one directory under `plugins/friday/adapters/` and one entry in the render script. It changes no file under `plugins/friday/source/`.
6. The repository root holds one marketplace file for each tool, `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`. Each lists the plugin `friday` and points to that tool's adapter. **Proposal:** the marketplace is named `next-friday`, so a project enables `friday@next-friday`.
7. In a project generated for Claude Code with the plugin installed, `/friday:sdlc <request>` runs the loop, and `claude -p "/friday:sdlc <request>"` runs it without a terminal session.
8. The manifests carry no `version` field, and the project's marketplace entry sets `"autoUpdate": true`, so a merged change to a playbook reaches a project after a session starts, with no release of the CLI.
9. A generated project holds no copy of what the plugin holds: no `sdlc`, `sdlc-help`, or policy skill under `.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`; no `verifier` subagent; no `.agents/skill-evals/`; and none of the three scripts of requirement 1.
10. A generated project's `.claude/settings.json` names the marketplace under `extraKnownMarketplaces`, with the source `{"source": "github", "repo": "next-friday/next-friday-create-app"}`, and enables the plugin under `enabledPlugins`.
11. A project that has its own policy keeps it at `.agents/skills/<area>-policy/SKILL.md`. The `design`, `build`, and `review` playbooks read that file when it exists, and the plugin's default otherwise.
12. The plugin's playbooks carry the text of these five conventions, and name no `AGENTS.md` convention by its heading: **Start from the accepted spec, in plan mode**; **Start a bug fix with a failing test**; **Do not start work a person did not ask for**; **Branch from the latest `origin/main`, and open the pull request ready for review**; **Write replies a person can check**.
13. `AGENTS.md`, in the root and in each stack, holds none of the five conventions of requirement 12. One convention names the plugin's `sdlc` skill as the way work runs. The root keeps the sentence of its branch convention that is a fact about this repository: its skills and playbooks decide over a skill from another checkout.
14. The plugin's skills name `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md` by path where they rely on them, and restate neither.
15. Every step marked **Gate** in a playbook today is in the plugin's playbook word for word, except that `.agents/skills/sdlc/playbooks/<file>` is written `playbooks/<file>` and `/sdlc` is written `/friday:sdlc`.
16. No file in a generated project names a path under `.agents/skills/sdlc/`.
17. The `setup-sdlc` skill, run in a project:
    1. Asks for a budget in one question and writes the model for each role to `.agents/sdlc-models.md`, chosen from the models the session offers. **Proposal:** the four choices are those of `setup-pstack` (`unlimited`, `large`, `medium`, `small`), and the roles are build, review, verify, and evals.
    2. Reads `SETUP.md` and reports, for each step, whether it is done.
    3. Does the steps an agent can do, and lists the steps a person does outside the repository.
    4. Gives the same result when it is run again with the same answers.
18. When `.agents/sdlc-models.md` names a model for the verify role, the `sdlc` skill starts the `verifier` subagent on that model. An eval case shows it.
19. `SETUP.md` in a generated project gives the command a contributor runs once to install the plugin, the message Claude Code prints when it is missing, and how soon a project takes a plugin change (`v5.0.0-15.1.1`). Requirement 8 keeps each project inside that time (`v5.0.0-15.2.1`).
20. `pnpm plan:check`, `pnpm bands:check`, and `pnpm loop:measure` run in a generated project on a machine and in CI where no agent tool's plugin is installed.
21. The eval cases run with `claude plugin eval`, which scores the plugin against a run with no plugin ([Claude Code: Test plugins with evals](https://code.claude.com/docs/en/plugin-evals.md)). No script of this repository runs them, and `run-agent-evals.ts` is deleted.
22. The two workflows of a generated project that send `/sdlc`, `control-band.yml` and `spec-on-intent-merge.yml`, send the plugin's `sdlc` skill.
23. This repository uses the plugin from its own tree: its skills, subagent, eval cases, and the three scripts exist once, under `plugins/friday/`.
24. `.github/CODEOWNERS` in the root names an owner for `/plugins/friday/`, for the `sdlc` skill inside it, and for each policy skill inside it.
25. The release notes give the steps an agent follows to move a project that was generated earlier.
26. A changeset describes what a generated project no longer holds and what it gains.
27. A reply of the `sdlc` skill gives the full URL of each pull request, issue, branch, workflow run, and file on the host that it names. Its **Status** line gives the URL of the page where the person acts next. The product owner decided this.

## Design

Risk: higher. The change replaces how every generated project receives the instructions its agents follow, and a merged change to the plugin reaches every project without a release.

**Layout.**

```text
plugins/friday/
  source/
    skills/sdlc/SKILL.md, playbooks/*.md
    skills/sdlc-help/SKILL.md
    skills/setup-sdlc/SKILL.md
    skills/<area>-policy/SKILL.md
    agents/verifier.md, agents.json
    evals/<skill>/<case>/
    scripts/check-plan.ts, check-bands.ts, measure-loop.ts
  adapters/
    vendor-names.json
    claude-code/.claude-plugin/plugin.json, skills/, agents/, evals/
    cursor/.cursor-plugin/plugin.json, skills/, agents/
.claude-plugin/marketplace.json
.cursor-plugin/marketplace.json
```

The `cursor/plugins` repository ships `pstack` the same way: its root holds `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json`, the Cursor copy is `pstack/` with `.cursor-plugin/plugin.json`, and the Claude Code copy is `harness/pstack/claude-code/` with `.claude-plugin/plugin.json`.

Moving the plugin to a repository of its own moves `plugins/friday/` and the two marketplace files.

**What the plugin reads in a project.** `intent/`, `bands.yaml`, `SETUP.md`, `AGENTS.md`, `.agents/rules/agent-owned-work.md`, `.agents/rules/evidence-before-claims.md`, `.agents/skills/<area>-policy/SKILL.md`, and `.agents/sdlc-models.md`. It reads them where the project keeps them, and holds no copy.

**What stays in a project.** `AGENTS.md`, the rules, the hooks, the agent settings, `intent/`, `bands.yaml`, `SETUP.md`, the runbooks, `.agents/review.md`, and a policy the project overrides.

**Files that change.**

| File                                                                                                                    | Afterwards                                                                                                                                                                                                              |
| :---------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/`, `.agents/agents/`, `.agents/agents.json`, `.agents/skill-evals/`, in the root and `templates/base/`  | Hold nothing the plugin holds. The files move to `plugins/friday/source/`.                                                                                                                                              |
| `.claude/skills/`, `.claude/agents/`, `.cursor/skills/`, `.cursor/agents/`, in the root and `templates/base/`           | The rendered copies of the moved skills and subagent are removed.                                                                                                                                                       |
| `scripts/sync-plugin.ts` (new)                                                                                          | Renders `plugins/friday/source/` into the two adapters. With `--check` it fails on a stale adapter and runs the checks of requirements 2 and 3.                                                                         |
| `scripts/sync-agent-rules.ts`, root and `templates/base/`                                                               | Renders rules, `review.md`, and `mcp.json`, and a project's own policy skill. A person commits this file.                                                                                                               |
| The playbooks under `plugins/friday/source/skills/sdlc/`                                                                | Carry the five conventions of requirement 12, and read a project's policy file before the plugin's default.                                                                                                             |
| `scripts/run-agent-evals.ts`, root and `templates/base/`                                                                | Deleted. `claude plugin eval` runs the cases in `plugins/friday/adapters/claude-code/evals/`.                                                                                                                           |
| `.claude/settings.json`, root and `templates/base/`                                                                     | Gain `extraKnownMarketplaces` and `enabledPlugins`. The root names its own tree as the marketplace. A person commits this file.                                                                                         |
| `AGENTS.md`, root and each stack                                                                                        | Lose the five conventions; gain the one convention of requirement 13. The sections that remain state commands, checks, architecture, and corrections for that repository.                                               |
| `templates/base/SETUP.md`                                                                                               | Gains the install step and the update rule of requirement 19, and names `/friday:setup-sdlc`. Its `CODEOWNERS` example drops the line for `/.agents/skills/sdlc/`.                                                      |
| `templates/base/.github/workflows/control-band.yml`, `spec-on-intent-merge.yml`                                         | Send the plugin's `sdlc` skill.                                                                                                                                                                                         |
| `package.json`, root and each stack; `knip.json`, root and each stack                                                   | The three script entries run the plugin's scripts, and `evals:run` runs `claude plugin eval` in the root and is removed from each stack, as area of concern 1 settles; the root gains `plugin:sync` and `plugin:check`. |
| `.github/CODEOWNERS`, root                                                                                              | The lines for `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` become lines for `/plugins/friday/`.                                                                                                          |
| `.agents/review.md`, in the root, `templates/base/`, `templates/payload/`, `templates/turborepo/`, and each `REVIEW.md` | Name the policies in force, the project's own or the plugin's default, in place of "the four policies in `.agents/skills/`".                                                                                            |
| `scripts/check-changesets.ts`                                                                                           | Its fixtures name paths that exist after the move.                                                                                                                                                                      |
| `intent/README.md`, `templates/base/intent/README.md`, `CONTRIBUTING.md`                                                | Name the plugin's skill in place of `/sdlc`.                                                                                                                                                                            |

**Order of dependencies.** The source directory and the render script come first, because every later step reads them. The Claude Code adapter is proved with the command line before generated projects stop carrying copies. The Cursor adapter is rendered from the same source.

## Policies

- **Brand:** rules 2 and 3. The plugin's name is the organization's name, given by the product owner in the intent, and it appears in the command a person types. The two manifests are its declared source (requirement 4). Other files write it as a literal; see area of concern 3. Rule 5 does not arise: the spec invents no brand value.
- **Security:** chapter V15, Secure Coding and Architecture. `v5.0.0-15.1.1` and `v5.0.0-15.2.1` are requirement 19: the plugin is a component every project takes from another repository. No other Level 1 requirement of V13 or V15 applies: `v5.0.0-13.4.1` is about a deployed application's source control metadata, and `v5.0.0-15.3.1` is about the fields an application returns. Rule 6 holds: the plugin and the settings hold no secret. No other chapter applies; the change has no web interface, session, token, or stored data.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person; requirement 4 keeps a person's name and email out of the manifests.
- **UX:** Does not apply. The change adds no screen, page, or form to a product; `setup-sdlc` asks its question in an agent session.

## Areas of concern

1. **How the three commands run where no plugin is installed** (requirement 20). Decision the files do not settle; owner: @joetakara. CI of a generated project runs `pnpm plan:check` and `pnpm bands:check`, and CI has no plugin. **Proposal:** `plugins/friday/` is also published as an npm package that carries the four scripts and the eval cases, and each project lists it as a development dependency, so the scripts have one source and a fixed version in CI. Publishing to the public registry costs nothing; it adds a second package to the release, and the package is a third-party component of each project under `v5.0.0-15.1.1`, `v5.0.0-15.2.1`, and `dependency-security.md`. The other choices are to keep a copy of the scripts in each project, or to have CI check out this repository at a commit.
2. **Which release carries the change.** Decision the files do not settle; owner: @joetakara. The intent says the plugin ships in 9.2.0 with pull request #140; `main` is at 9.2.0 and holds #140. **Proposal:** the plugin ships in the next minor release, and requirement 25 covers projects generated from 9.2.0.
3. **The organization's name outside the manifests.** Brand policy, rule 3, and `.agents/rules/descriptive-naming.md`; owner: @joetakara. The name is in the path `plugins/friday/`, in the marketplace name of requirement 6, and in the command `/friday:sdlc` that a generated project's `AGENTS.md`, `SETUP.md`, and workflows write. **Proposal:** the product owner's decision on the plugin's name covers the path and the command, and the spec records it here; the marketplace name is the product owner's to choose.
4. **A merged plugin change reaches every project at once** (requirement 8). Security policy, `v5.0.0-15.2.1`; owner: @joetakara. A wrong playbook reaches every project before any of them tests it. **Proposal:** keep requirement 8, because the intent asks for a fix that needs no release, and have this repository's CI run the eval cases against the plugin on every pull request that changes it.
5. **Where the model choices live** (requirements 17 and 18). Decision the files do not settle; owner: @joetakara. `setup-pstack` writes one file for a person, under that person's home directory. **Proposal:** one committed file for the project, `.agents/sdlc-models.md`, because the intent speaks of the budget the team has.
6. **The duplicate between the rules and the skill.** Decision the files do not settle; owner: @joetakara. The intent names `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md` as repeating the skill, and puts moving rules out of scope. **Proposal:** requirement 14: the rules stay the one place that says it, and the skill points to them.
7. **A person commits two of the changed files.** `.claude/settings.json` and `scripts/sync-agent-rules.ts` are in the constitution; owner: @joetakara. The plan names them as steps for a person.

## Open questions

- _How a playbook finds a project's own policy._ Answered by requirement 11: the project's file at `.agents/skills/<area>-policy/SKILL.md` wins, so a policy a project has already changed keeps its place and its code owner.
- _Where `setup-sdlc` writes the model choices._ Proposed in area of concern 5.
- _Which version each project runs._ Answered by requirement 8, from "without it the version is the commit" ([Claude Code: Plugin loading](https://code.claude.com/docs/en/plugins/loading.md)).
- _What `sdlc-help` and the eval cases read._ The plugin's own files: both sit beside the playbooks in `plugins/friday/source/`. `claude plugin eval` reads the cases from the Claude Code adapter.
- _Whether an open skill format covers every agent tool._ Carried forward. `pstack/plugin.json` names a plugin manifest schema, `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`; it is not a skill format. The adapters of requirement 4 do not depend on the answer.
- _How the eval cases stay tool-neutral._ The cases in the source name no tool. Requirement 21 runs them with Claude Code's runner; a runner for another tool is carried forward.
- _Cursor adapter: how a project enables a plugin for its team._ Carried forward. The `cursor/plugins` repository shows the manifest and the marketplace file.
- _Whether `claude -p "/friday:sdlc …"` runs headless._ Carried forward as requirement 7; the plan proves it with a run before any copy is removed. A plugin enabled in project settings loads only in a folder the person has trusted, and "running with `-p` isn't enough" (same page), so the run in CI is part of that proof.
- _Whether the short form `/sdlc` works._ Carried forward. Every file writes the full form.
- _Whether a contributor without the plugin gets a clear message._ Answered by requirement 19: Claude Code prints `Plugin "<name>" is enabled in project settings but isn't installed here` (same page), and `SETUP.md` gives the command that fixes it.
- _How a workflow installs the plugin in CI._ New. Requirement 22 needs it.
- _How many repositories use the stack._ Carried forward; no file says.
- _Which earlier intents this replaces in part._ Carried forward. `lean-agent-setup`, `playbook-plays`, and `multi-agent-support` name copied skills; this spec changes none of them.
