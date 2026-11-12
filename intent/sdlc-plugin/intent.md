# Intent: Ship the SDLC playbook as the `sdlc` plugin

Author: Joe Takara (Developer Productivity). Status: accepted.

## Problem

- The same instruction lives in three places. In the root, `AGENTS.md` conventions 7 to 11, `.agents/rules/agent-owned-work.md` and `.agents/rules/evidence-before-claims.md`, and `.agents/skills/sdlc/` each say when work starts, where it stops for a person, and how a reply is written. A change to one copy leaves the others behind.
- A new team member has no single step that says whether a project is ready for the loop, and nothing sets which model each role uses for the budget the team has.
- The skills are written for two agent tools by name. A team that uses another tool or another model cannot use them as they are.

## Proposed outcome

- One plugin named `sdlc` holds everything that implements the SDLC playbook. A person runs the loop with the plugin's `sdlc-mode` skill.
- The plugin's content is tool-neutral. Its skills, playbooks, eval cases, and scripts name no vendor's agent tool, so any agent tool that can load a skill can run them.
- What one agent tool needs to load the plugin, such as its manifest, its command name, and its settings keys, is a thin adapter kept beside the content. The first adapters are for the tools the company uses today, Claude Code and Cursor; another tool is added by adding an adapter, with no change to the content.
- The plugin holds: the `sdlc-mode` skill and every playbook, `sdlc-help`, `setup-sdlc`, the verifier subagent, the eval cases, and the scripts behind `plan:check`, `bands:check`, `loop:measure`, and `evals:run`.
- The plugin holds the default brand, security, compliance, and UX policies. A project that has its own policy keeps a file of the same name, and the playbooks use the project's file instead of the default.
- `AGENTS.md`, in the root, states only facts about this repository and points to the plugin's `sdlc-mode` skill for how work runs; the conventions that repeat a playbook are removed.
- The plugin's `setup-sdlc` skill does three things, and can be run again at any time:
  1. Asks for a budget in one question and sets the model for each role from the models the session offers, as `setup-pstack` does (`cursor/plugins`, `pstack/skills/setup-pstack/SKILL.md`).
  2. Reads the project's `SETUP.md` and reports which steps are done and which are not.
  3. Does the steps an agent can do, and names the steps a person does outside the repository.
- Out of scope:
  - Moving the plugin to another repository.
  - Moving rules, hooks, or agent settings into the plugin.
  - Listing the plugin in a public marketplace.
  - The `monorepo-apps` change.
  - Changing generated projects to use the plugin.

## Affected users and systems

- Every engineer and agent that works in this repository, whichever agent tool and model they use.
- Policy owners, who change the default policies in the plugin and a project's own policy in that project.
- This repository: `.agents/skills/`, `.agents/skill-evals/`, the verifier subagent, the four scripts, `scripts/sync-agent-rules.ts`, `AGENTS.md`, the agent settings, CI, and the intents that name `/sdlc` or the copied skills.
- Pull request #140, whose skills, eval cases, and scripts move into the plugin.

## Constraints

- The plugin lives in this repository, in one directory that reads no file outside itself, so the directory can move to a repository of its own, or to a public marketplace, later without a change to its contents.
- No file in the plugin's content depends on one vendor's agent tool. A file that only one tool reads lives in that tool's adapter.
- The plugin is named `sdlc`; the product owner decided this name.
- No running cost: the plugin's source is this git repository, and nothing the plugin adds calls a model unless a person runs it or a project turns a workflow on.
- Rules, hooks, and agent settings stay under each project's code owners, and a person commits a change to them.
- The human gates stay as they are.
- What the Claude Code adapter has to work with, from its documentation:
  - A plugin skill is run as `/sdlc:sdlc-mode`: "plugin skills are namespaced as `/plugin-name:skill-name`" ([Claude Code: Skills](https://code.claude.com/docs/en/skills.md)).
  - Only the plugin directory is copied: "Files outside the plugin directory aren't copied" ([Claude Code: Plugin loading](https://code.claude.com/docs/en/plugins/loading.md)).

## Open questions

- Whether an open skill format covers every agent tool the company may use, and what each tool needs as an adapter.
- How the eval cases and `evals:run` stay tool-neutral when running a case needs one tool's command line.
- How a playbook in the plugin finds a project's own policy file before it falls back to the plugin's default.
- Where `setup-sdlc` writes the model choices so that each tool reads them.
- Cursor adapter: the plugin format, and how Cursor loads a plugin from a marketplace. The source so far is the `cursor/plugins` repository.
- Claude Code adapter: whether `claude -p "/sdlc:sdlc-mode …"` runs a plugin skill headless; the documentation says user-invoked skills work in `-p` and installed plugins load, but does not state the two together. `evals:run` depends on it.
- Which version the plugin runs: in Claude Code the plugin's `version` field "pins the plugin to that version until you change it" ([Claude Code: Plugin manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference.md)), and without it the version is the commit. The spec decides which.
- What `sdlc-help` and the eval cases read when the project holds no copy of the playbooks.
- Which of the existing intents that require copied skills (`lean-agent-setup`, `playbook-plays`, `multi-agent-support`) this intent replaces in part.
