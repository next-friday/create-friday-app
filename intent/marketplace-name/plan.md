# Plan: Name the marketplace `next-friday-plugins` (fix)

Accepted by: @joetakara.

The defect: the marketplace that lists the `friday` plugin is named `next-friday`, the organization's name alone. The product owner decided the name `next-friday-plugins`. It follows `cursor/plugins`, whose marketplace is `cursor-plugins` and whose plugin installs as `pstack@cursor-plugins` (`pstack/README.md`, under "install"). The plugin keeps the name `friday`, and its key becomes `friday@next-friday-plugins`.

## Files that change

| File                                                                 | Change  | Afterwards                                                                                                                            |
| :------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json` | changed | `"name": "next-friday-plugins"`. A person commits these files.                                                                        |
| `.claude/settings.json`                                              | changed | `extraKnownMarketplaces` names `next-friday-plugins`, and `enabledPlugins` enables `friday@next-friday-plugins`. A person commits it. |
| `plugins/friday/README.md`                                           | changed | Names the marketplace and the plugin's key as above.                                                                                  |
| `intent/sdlc-plugin/spec.md`, `intent/sdlc-plugin/plan.md`           | changed | Name the marketplace and the plugin's key as above.                                                                                   |

## Order of work

1. Change the text in `plugins/friday/README.md` and the two files under `intent/sdlc-plugin/`. Check: `pnpm verify` exits 0.
2. A person commits the two marketplace files and `.claude/settings.json` in one commit, from an issue that carries the exact text. Check: `pnpm plugin:check` exits 0, and `claude plugin validate .` passes.
3. Check: `git grep -n "friday@next-friday\b"` finds nothing, and `pnpm verify` exits 0.

## Risks

- The riskiest step is 2: `pnpm plugin:check` compares the name in `.claude-plugin/marketplace.json` with `.claude/settings.json`, so the three files change in one commit.
- The change publishes nothing: it touches no file under `src/` or `templates/` and no `package.json`, and adds no changeset.
- Option not taken: the name `friday`. A person cannot hold two marketplaces of one name ([Claude Code: Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)), and the key would read `friday@friday`.

## Proof

- `pnpm verify`: exits 0 after step 1 and after step 2.
- `claude plugin validate .`: passes after step 2.
- `git grep -n "friday@next-friday\b"`: no line after step 2.
