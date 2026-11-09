# Intent: Ship the company's optional agent extras as a plugin

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- The agent kit is the rules, skills, subagents, hooks, and scripts that guide Claude Code and Cursor. This repository keeps two copies of it by hand: one in the root and one in `templates/base/`. 78 files in the two copies are identical.
- Nothing keeps the two copies in step except people. Today they differ only where they must: for example, the root's `scripts/sync-agent-rules.ts` has five more lines (84–88) because the root's `tsconfig.json` sets `noUncheckedIndexedAccess` and the templates' do not.
- The CLI copies the kit into a project once, when it generates the project. A later fix to a rule, skill, or hook never reaches the client projects that already exist.
- The playbook distributes this kind of kit through a plugin:
  - Page 25, step 3: put the skill in the repository, "or distribute it organization-wide through a plugin".
  - Page 43: every skill, agent, hook, and MCP server "arrived through the organization's approved plugin marketplace".
- Both agents support plugins, with limits:
  - A Claude Code plugin holds skills, subagents, hooks, and MCP servers, and updates come from its marketplace. It does not hold rules or `AGENTS.md` ([Claude Code: Plugins](https://code.claude.com/docs/en/plugins)).
  - A plugin cannot carry permissions: from a plugin's `settings.json`, "Only two keys take effect … `agent` and `subagentStatusLine`; every other key is dropped" ([Claude Code: Plugin components](https://code.claude.com/docs/en/plugins/components)).
  - A cloud session does not load a plugin that a repository enables: "Plugins and marketplaces declared in your repo's `.claude/settings.json`" are listed as not loaded, while the repository's own `.claude/settings.json` hooks and permission rules, `.claude/rules/`, and `.claude/skills/` are ([Claude Code: Cloud environments](https://code.claude.com/docs/en/cloud-environments)).
  - Each person installs the plugin on their own machine, and auto-update is "Off by default" for a company's own marketplace ([Claude Code: Install plugins](https://code.claude.com/docs/en/plugins/install)).
  - Cursor installs rules from a plugin published through a marketplace ([Cursor: Rules](https://cursor.com/docs/rules)), in its own `.cursor-plugin/` format ([Cursor: Plugins](https://cursor.com/docs/plugins)).

## Proposed outcome

- Everything that guards or constrains the agent stays committed in each project's repository, because a cloud session loads only what the repository holds: the hooks, the permissions in `.claude/settings.json`, the rules, and the skills every task needs.
- A company plugin, through the company's own marketplace, carries the four policy skills, which page 25 says to "distribute … organization-wide through a plugin", and only other pieces whose absence lets no one skip a check. Projects that use Cursor get the same extras in Cursor's plugin format.
- An existing project gets a fix to a plugin extra by updating the plugin; turning on auto-update for the company marketplace is part of setup.
- This repository keeps no second hand-made copy of the kit.
- A fix to the kit that stays in each repository reaches existing projects the way template tools do it: each generated project records the template and version it came from, and an update applies the newer template's changes, as Copier's `copier update` does from `.copier-answers.yml` ([Copier: Updating a project](https://github.com/copier-org/copier/blob/master/docs/updating.md)).
- The company's marketplace lives in this repository, beside the templates. Claude Code accepts a marketplace in a folder of an existing repository, including a private one ([Claude Code: Create a marketplace](https://code.claude.com/docs/en/plugins/create-marketplace)).
- CI checks the company marketplace with Claude Code's own `claude plugin validate`, which checks the JSON, the required fields, the names, and each plugin's manifest ([Claude Code: Create a marketplace](https://code.claude.com/docs/en/plugins/create-marketplace)). Anthropic's own marketplace runs four checks (`anthropics/claude-plugins-official`) because it accepts plugins from outside; the company marketplace does not.

## Affected users and systems

- Every engineer and agent session in every generated project, and in this repository.
- `templates/base/` (`.agents/`, `.claude/`, `.cursor/`, `scripts/`), the root's copies of the same folders, and `SETUP.md`.

## Constraints

- CI and code owner review stay the boundary; the agent still cannot weaken the checks on its own work (page 32).
- Every agent feature used is checked against that agent's official documentation before it is relied on.
- The kit that stays in the repository follows `intent/multi-agent-support/intent.md`.
- A generated project must still pass its own `pnpm verify`.
- Cursor installs a company marketplace only on its Teams plan (one marketplace) or Enterprise plan ([Cursor: Plugins](https://cursor.com/docs/plugins)).
