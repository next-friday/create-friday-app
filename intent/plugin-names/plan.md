# Plan: Name the plugin `sdlc` and its marketplace `next-friday-plugins` (fix)

Accepted by: @joetakara.

The defect: the plugin and its marketplace do not carry the names the product owner decided, so a person types the wrong command and enables the wrong key. The product owner decided the plugin name `sdlc` and the marketplace name `next-friday-plugins`. The names follow `cursor/plugins`: the organization `cursor` maps to `next-friday`, the plugin `pstack` maps to `sdlc`, the marketplace is `cursor-plugins`, and the plugin installs as `pstack@cursor-plugins` (`pstack/README.md`, under "install"). Afterwards the plugin lives in `plugins/sdlc/`, its commands are `/sdlc:sdlc` and `/sdlc:sdlc-help`, and its key is `sdlc@next-friday-plugins`. Every skill keeps its name.

## Files that change

| File                                                                                                                                                                | Change  | Afterwards                                                                                                                       |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/friday/`                                                                                                                                                   | moved   | `plugins/sdlc/`, with its source, adapters, eval cases, and README. Part A.                                                      |
| `scripts/sync-plugin.ts`, `package.json`, `scripts/check-changesets.ts`, `.github/CODEOWNERS`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json` | changed | Every path reads `plugins/sdlc`. Part A.                                                                                         |
| `AGENTS.md`, `CONTRIBUTING.md`, `intent/README.md`, `intent/sdlc-plugin/`, the plugin's README, skills, and eval cases                                              | changed | Commands read `/sdlc:sdlc`, and prose names the `sdlc` plugin. Part A.                                                           |
| `scripts/sync-plugin.ts`                                                                                                                                            | changed | The plugin name constant is `sdlc`. Part B, a person.                                                                            |
| `plugins/sdlc/adapters/claude-code/.claude-plugin/plugin.json`, `plugins/sdlc/adapters/cursor/.cursor-plugin/plugin.json`                                           | changed | `"name": "sdlc"`, rendered by `pnpm plugin:sync`. Part B, a person.                                                              |
| `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`                                                                                                | changed | The marketplace `"name": "next-friday-plugins"` and the plugin entry `"name": "sdlc"`. Part B, a person.                         |
| `.claude/settings.json`                                                                                                                                             | changed | `extraKnownMarketplaces` names `next-friday-plugins`, and `enabledPlugins` enables `sdlc@next-friday-plugins`. Part B, a person. |

## Order of work

1. The agent does Part A: move the plugin folder, update every path, command, and prose name, and render the adapters. Check: `pnpm verify` exits 0 with the plugin and marketplace names unchanged.
2. A person does Part B in one commit, from an issue that carries the exact text of the six files. Check: `pnpm plugin:sync` changes nothing further, `pnpm verify` exits 0, and `claude plugin validate .` passes.
3. Check: a search for the old plugin name as a bare word, outside `templates/`, `CHANGELOG.md`, and `pnpm-lock.yaml`, finds only the import identifier of the organization's lint package in `eslint.config.ts` and the name of the code-standards repository in two intent files.

## Risks

- The riskiest step is 2: `pnpm plugin:check` compares the plugin name and the marketplace name in the repository with `.claude/settings.json`, so the six files change in one commit.
- `.github/workflows/release.yml` names `plugins/friday/CHANGELOG.md`; it is a guarded file that a person changes.
- The change publishes nothing: it touches no file under `src/` or `templates/`, no publish field of `package.json`, and adds no changeset.
- Option not taken: the plugin name `next-friday`. The command would repeat the organization in `/next-friday:sdlc`, and `.agents/rules/descriptive-naming.md` forbids an organization name in an identifier.

## Proof

- `pnpm verify`: exits 0 after step 1 and after step 2.
- `claude plugin validate plugins/sdlc/adapters/claude-code` and `claude plugin validate .`: pass after step 2.
- The search for the old plugin name as a bare word: no line after step 2 except those listed in step 3.
