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
12. The plugin's skills name no file under a project's `.agents/rules/`; each states the rule it relies on.
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
20. A project generated from any stack holds the plugin itself: `plugins/sdlc/claude-code/` and `plugins/sdlc/cursor/`, which are the rendered adapter trees of this repository, `plugins/sdlc/adapters/claude-code/` without its `evals/` and `plugins/sdlc/adapters/cursor/`, byte for byte; and a root `.claude-plugin/marketplace.json` that names the marketplace `next-friday-plugins` and lists `sdlc` with the relative source `./plugins/sdlc/claude-code`. **Proposal:** these paths and this marketplace name. The name is the one of requirement 6, so the key is `sdlc@next-friday-plugins` in both places, and a project that wants updates changes one source entry.
21. These files live under `templates/base/` and `pnpm plugin:sync` renders them from `plugins/sdlc/source/`. `pnpm plugin:check` fails when one differs from its source. Convention 4 of `AGENTS.md`, "Do not link the root and `templates/` trees", gains one exception: the plugin copy under `templates/base/plugins/sdlc/` and `templates/base/.claude-plugin/` is rendered from the plugin source.
22. The template's `.claude/settings.json` gains `extraKnownMarketplaces` with the entry `next-friday-plugins`, source `directory`, path `.`, and `enabledPlugins` with `sdlc@next-friday-plugins: true`, as this repository's own `.claude/settings.json` has. It rests on [Claude Code: Plugins for an organization](https://code.claude.com/docs/en/plugins/org): "Setting `enabledPlugins` in the repository doesn't install the plugin. … Contributors don't need the install when a local `directory` or `file` marketplace lists the plugin with a relative-path `source`." The same page says: "The `extraKnownMarketplaces` entries apply only in a folder the contributor has trusted". A person commits this file, which is in the constitution.
23. The template's `.cursor/hooks.json` gains a `workspaceOpen` hook whose script prints `{"pluginPaths": ["<project>/plugins/sdlc/cursor"]}`, with `<project>` taken from `CURSOR_PROJECT_DIR`. It rests on [Cursor: Hooks](https://cursor.com/docs/hooks), section `workspaceOpen`: the output field `pluginPaths` holds "Absolute paths to plugin directories to load for the current workspace.", and the hook "Fires once when Cursor opens a workspace and again on every workspace folder change." A marketplace source does not serve Cursor users, because [Cursor: Plugins](https://cursor.com/docs/plugins) says: "Plugins are distributed as Git repositories and submitted through the Cursor team." **Proposal:** the script is `.cursor/hooks/load-project-plugins.sh`. A person commits the hook and its script, which are in the constitution. Cursor loading is not verified in a real Cursor: a person tries it once before the pull request is merged.
24. A generated project holds no copy of what the plugin holds. The template loses: the skills under `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` (45 files); the `verifier` subagent in three trees for each of the five stacks (15 files) and `.agents/agents.json`; the eval cases `.agents/skill-evals/` (146 files); `scripts/run-agent-evals.ts`; the `evals:run` script of each stack; and `.github/workflows/agent-evals.yml`. A person commits the deletion of the workflow, which is in the constitution. **Proposal:** the eval runner and its workflow leave generated projects. The eval cases test the plugin and stay with the plugin in this repository.
25. Each stack's verifier text differs only by how the app starts. **Proposal:** that start instruction moves into the stack's `AGENTS.md`, under `## Verifying your work`, and the plugin's `verifier` subagent, which runs the checks the project's agent instructions name, serves every stack.
26. A generated project keeps `scripts/check-plan.ts`, `scripts/check-bands.ts`, and `scripts/measure-loop.ts`, because `verify`, the pre-push hook, and CI call them by a repository path. `pnpm plugin:sync` renders them from the plugin's source scripts, and `pnpm plugin:check` fails when one differs from its source script.
27. Every `/sdlc` and `/sdlc-help` in the templates is written `/sdlc:sdlc-mode` and `/sdlc:sdlc-help`, and no template file names a path into a deleted skill folder. This covers each stack's `AGENTS.md`, `SETUP.md`, `intent/README.md`, `.agents/review.md` with its rendered `REVIEW.md` in `base`, `payload`, and `turborepo`, and each stack's `CONTRIBUTING.md`. `SETUP.md` says how a team replaces a default policy: a project file `.agents/skills/<area>-policy/SKILL.md` wins over the plugin's default, as requirement 9 says, and its `CODEOWNERS` lines follow.
28. The workflows `spec-on-intent-merge.yml` and `control-band.yml` send `/sdlc:sdlc-mode …` and load the plugin from `plugins/sdlc/claude-code` for the run. **Proposal:** each `claude-code-action` step passes `--plugin-dir plugins/sdlc/claude-code` in `claude_args`, because a CI folder is not a trusted folder and the `extraKnownMarketplaces` entries "apply only in a folder the contributor has trusted" (requirement 22). A person commits the workflows, which are in the constitution.
29. `templates/base/scripts/sync-agent-rules.ts` renders no subagent: its `SubagentConfig` type, `renderSubagent`, the loop that uses it, and the subagent entries of its orphan list are removed, because nothing renders a subagent after requirement 24. It still renders a project's own policy skill. A person commits this file, which is in the constitution.
30. A changeset marks `@next-friday/create-app` `minor` (9.2.x to 9.3.0). Its note tells the owner of a project generated earlier that the project keeps working as it is, and that to move, the owner copies the plugin folders and the settings entries and deletes the old skill copies.
31. The whole is verified: a project generated from each of the five stacks passes `pnpm verify`; `actionlint` and `zizmor` pass on the workflows, as the Template job of the root CI runs them; `git grep -n -E '/sdlc(-help)?\b' templates` finds only the new names; in a generated project `claude plugin validate plugins/sdlc/claude-code` passes and a session lists `/sdlc:sdlc-mode`.

## Design

Risk: higher. The change replaces how this repository and every generated project receive the instructions their agents follow.

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

A generated project holds the two adapter trees without a source or evals, and one marketplace file:

```text
plugins/sdlc/claude-code/.claude-plugin/plugin.json, skills/, agents/, hooks/
plugins/sdlc/cursor/.cursor-plugin/plugin.json, skills/, agents/, hooks/
.claude-plugin/marketplace.json
.cursor/hooks/load-project-plugins.sh
scripts/check-plan.ts, check-bands.ts, measure-loop.ts
```

In Claude Code the project's `.claude/settings.json` registers the project folder as a local `directory` marketplace and enables `sdlc@next-friday-plugins`, so nothing is installed. In Cursor the `workspaceOpen` hook hands the plugin folder to Cursor when it opens the workspace.

**What the plugin reads in a project.** `intent/`, `bands.yaml`, `SETUP.md`, the project's agent instructions, `.agents/skills/<area>-policy/SKILL.md`, and `.agents/sdlc-models.md`. It reads them where the project keeps them, and holds no copy.

**Files that change.**

| File                                                                                                                                                                                                            | Afterwards                                                                                                                                                                         |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/skills/`, `.agents/agents/`, `.agents/agents.json`, `.agents/skill-evals/`, in the root                                                                                                                | Hold nothing the plugin holds. The skills, the subagent's text, and the scripts move to `plugins/sdlc/source/`; the eval cases and `agents.json` move to `plugins/sdlc/adapters/`. |
| `.claude/skills/`, `.claude/agents/`, `.cursor/skills/`, `.cursor/agents/`, in the root                                                                                                                         | The rendered copies of the moved skills and subagent are removed.                                                                                                                  |
| `scripts/sync-plugin.ts` (new)                                                                                                                                                                                  | Renders `plugins/sdlc/source/` into the two adapters. With `--check` it fails on a stale adapter and runs the checks of requirements 2 and 3.                                      |
| `scripts/sync-agent-rules.ts`, root                                                                                                                                                                             | Renders rules, `review.md`, and `mcp.json`, and a project's own policy skill. A person commits this file.                                                                          |
| The playbooks under `plugins/sdlc/source/skills/sdlc-mode/`                                                                                                                                                     | Carry the five conventions of requirement 10, and read a project's policy file before the plugin's default.                                                                        |
| `scripts/run-agent-evals.ts`, root                                                                                                                                                                              | Deleted. `claude plugin eval` runs the cases in `plugins/sdlc/adapters/claude-code/evals/`.                                                                                        |
| `.claude/settings.json`, root                                                                                                                                                                                   | Gain `extraKnownMarketplaces` and `enabledPlugins`. The root names its own tree as the marketplace. A person commits this file.                                                    |
| `AGENTS.md`, root                                                                                                                                                                                               | Lose the five conventions; gain the one convention of requirement 11. The sections that remain state commands, checks, architecture, and corrections for this repository.          |
| `package.json`, root                                                                                                                                                                                            | The three script entries run the plugin's scripts and `evals:run` runs `claude plugin eval`; the root gains `plugin:sync` and `plugin:check`.                                      |
| `.github/CODEOWNERS`, root                                                                                                                                                                                      | The lines for `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` become lines for `/plugins/sdlc/`.                                                                       |
| `.agents/review.md` and `REVIEW.md`, in the root                                                                                                                                                                | Name the policies in force, the project's own or the plugin's default, in place of "the four policies in `.agents/skills/`".                                                       |
| `scripts/check-changesets.ts`                                                                                                                                                                                   | Its fixtures name paths that exist after the move.                                                                                                                                 |
| `intent/README.md`, `CONTRIBUTING.md`                                                                                                                                                                           | Name the plugin's skill in place of `/sdlc`.                                                                                                                                       |
| `templates/base/plugins/sdlc/claude-code/`, `templates/base/plugins/sdlc/cursor/`, `templates/base/.claude-plugin/marketplace.json` (new)                                                                       | The plugin itself, rendered by `pnpm plugin:sync` from `plugins/sdlc/source/`, and the marketplace file that lists it.                                                             |
| `templates/base/.claude/settings.json`; `templates/base/.cursor/hooks.json`, `templates/base/.cursor/hooks/load-project-plugins.sh` (new)                                                                       | The settings gain the two keys of requirement 22. The hook file gains `workspaceOpen`, and the script prints the plugin path. A person commits these files.                        |
| `templates/base/.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `.agents/skill-evals/`, `.agents/agents.json`; each stack's `.agents/agents/`, `.claude/agents/`, `.cursor/agents/`                     | Deleted.                                                                                                                                                                           |
| `templates/base/scripts/run-agent-evals.ts`, `templates/base/.github/workflows/agent-evals.yml`; the `evals:run` entry of each stack's `package.json`                                                           | Deleted. A person commits the deletion of the workflow.                                                                                                                            |
| `templates/base/scripts/check-plan.ts`, `check-bands.ts`, `measure-loop.ts`                                                                                                                                     | Equal to the plugin's source scripts.                                                                                                                                              |
| `templates/base/scripts/sync-agent-rules.ts`                                                                                                                                                                    | Loses the subagent rendering. A person commits this file.                                                                                                                          |
| `templates/base/.github/workflows/spec-on-intent-merge.yml`, `control-band.yml`                                                                                                                                 | Send `/sdlc:sdlc-mode` and load the plugin with `--plugin-dir`. A person commits these files.                                                                                      |
| Each stack's `AGENTS.md` and `CONTRIBUTING.md`; `templates/base/SETUP.md`, `intent/README.md`, `.agents/review.md` with `REVIEW.md`, and the copies of `review.md` and `REVIEW.md` in `payload` and `turborepo` | Name `/sdlc:sdlc-mode` and the plugin's folders. Each `AGENTS.md` gains its start instruction for the verifier; `SETUP.md` gains the policy override step.                         |
| `scripts/sync-plugin.ts`, `AGENTS.md`, root                                                                                                                                                                     | `plugin:sync` and `plugin:check` cover the template copy and its three scripts. Convention 4 gains its exception.                                                                  |
| `.changeset/` (new file)                                                                                                                                                                                        | The `minor` changeset of requirement 30.                                                                                                                                           |

**Order of dependencies.** The source directory and the render script come first, because every later step reads them. The Claude Code adapter is proved with the command line before this repository stops carrying copies. The Cursor adapter is rendered from the same source. The template copy comes last, because it is rendered from the finished source and adapters, and the plugin's own setup and its model choice (requirements 14 and 15) are in the copy a project receives.

## Policies

- **Brand:** rules 2 and 3. The plugin's name `sdlc`, given by the product owner in the intent, holds no organization name and appears in the command a person types. The two manifests are its declared source (requirement 4). Other files write it as a literal; see area of concern 1. Rule 5 does not arise: the spec invents no brand value.
- **Security:** chapters V13 and V15. No Level 1 requirement of V13 or V15 applies: `v5.0.0-13.4.1` is about a deployed application's source control metadata, and `v5.0.0-15.3.1` is about the fields an application returns. Rule 6 holds: the plugin and the settings hold no secret. No other chapter applies; the change has no web interface, session, token, or stored data.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person; requirement 4 keeps a person's name and email out of the manifests.
- **UX:** Does not apply. The change adds no screen, page, or form to a product; `setup-sdlc` asks its question in an agent session.

## Areas of concern

1. **The organization's name outside the manifests.** Brand policy, rule 3, and `.agents/rules/descriptive-naming.md`; owner: @joetakara. The name is in the marketplace name of requirement 6, and again in the marketplace file and the settings of a generated project (requirements 20 and 22). **Proposal:** the marketplace name is the product owner's to choose.
2. **Where the model choices live** (requirements 14 and 15). Decision the files do not settle; owner: @joetakara. `setup-pstack` writes one file for a person, under that person's home directory. **Proposal:** one committed file for the project, `.agents/sdlc-models.md`, because the intent speaks of the budget the team has.
3. **The duplicate between the rules and the skill.** Decision the files do not settle; owner: @joetakara. The intent names `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md` as repeating the skill, and puts moving rules out of scope. **Proposal:** requirement 12: the skill states the rule it relies on and names no rule file, so the plugin runs in a project that has no such file.
4. **A person commits two of the changed files.** `.claude/settings.json` and `scripts/sync-agent-rules.ts` are in the constitution; owner: @joetakara. The plan names them as steps for a person.
5. **Paths and marketplace name in a generated project** (requirement 20). Decision the files do not settle; owner: @joetakara. **Proposal:** `plugins/sdlc/claude-code/`, `plugins/sdlc/cursor/`, and the name `next-friday-plugins`, which is also the key the official marketplace uses (`sdlc@next-friday-plugins`), so a project that wants later plugin versions changes one source entry and nothing else.
6. **How Cursor loads the plugin** (requirement 23). Decision the files do not settle; owner: @joetakara. **Proposal:** the script name `.cursor/hooks/load-project-plugins.sh`. The `workspaceOpen` hook is not verified in a real Cursor; a person tries it once before the pull request is merged.
7. **Eval runner and workflow leave generated projects** (requirement 24). Decision the files do not settle; owner: @joetakara. **Proposal:** remove `run-agent-evals.ts`, `evals:run`, and `agent-evals.yml`, because the eval cases test the plugin and stay with the plugin in this repository.
8. **Where the verifier's start instruction lives** (requirement 25). Decision the files do not settle; owner: @joetakara. **Proposal:** the stack's `AGENTS.md`, under `## Verifying your work`, so one `verifier` subagent serves every stack.
9. **How a workflow loads the plugin** (requirement 28). Decision the files do not settle; owner: @joetakara. **Proposal:** `--plugin-dir plugins/sdlc/claude-code` in `claude_args`, because a CI folder is not a trusted folder. The plan proves it with a run.
10. **A person commits the constitution files of the template** (requirements 22, 23, 24, 28, 29). Owner: @joetakara. They are `templates/base/.claude/settings.json`, `templates/base/.cursor/hooks.json` and its script, `spec-on-intent-merge.yml`, `control-band.yml`, the deletion of `agent-evals.yml`, and `templates/base/scripts/sync-agent-rules.ts`. The plan names them as steps for a person.

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
- _How a generated project takes a later plugin version._ Answered by requirement 20: it does not by itself. The copy is the version. A project that wants updates changes the source entry of its marketplace.
- _Whether Cursor loads the plugin from `pluginPaths`._ Carried forward as requirement 23; a person tries it in Cursor once before the pull request is merged.
- _Whether a CI run loads the plugin with `--plugin-dir`._ Carried forward as requirement 28; the plan proves it with a `claude -p` run in a generated project.
