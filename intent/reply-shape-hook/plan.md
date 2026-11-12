# Plan: A hook checks the reply shape of the sdlc-mode skill (fix)

Accepted by: @joetakara.

The defect: a reply of the `sdlc-mode` skill sometimes breaks the reply shape that requirement 10 of `intent/sdlc-plugin/spec.md` carries into the playbooks and requirement 19 states. It names a pull request by number, such as "pull request #42", it ends without the **Status** line or without `Next: <URL>` on it, and it writes a path from the machine's root, such as `/tmp/<scratch directory>/home/cwd`, where the skill says to write paths from the project root. The eval case `reply-gives-full-urls` on the small model, without the hook, shows two of these: 2 of 30 runs fail `reply-has-no-bare-number` and 2 of 30 fail `status-line-gives-the-pull-request-url`.

The cause: the reply shape is prose, and a small model follows prose only part of the time. A script can check each part of it, so the product owner decided that such a rule is enforced by a hook and a POSIX `sh` script, kept in the plugin in the tool's native plugin layout. This change is the first such hook, for Claude Code only.

## Files that change

| File                                                           | Change  | Afterwards                                                                                                                                                                                                                                                                      |
| :------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugins/sdlc/source/hooks/check-reply-shape.sh`               | added   | Reads the hook input with `jq` and, for a reply whose first line starts with `**Request:**`, blocks it once with one reason when it names a pull request or an issue by number, lacks a last `**Status:**` line or its `Next: <URL>`, or holds a machine path.                  |
| `plugins/sdlc/source/hooks/check-reply-shape.cases.json`       | added   | The cases `pnpm plugin:check` runs against the script: the input and the expected `pass` or `block`.                                                                                                                                                                            |
| `plugins/sdlc/adapters/hooks.json`                             | added   | Names, for each tool, the event and the script. Only `claude-code`, with `Stop` and `check-reply-shape.sh`.                                                                                                                                                                     |
| `plugins/sdlc/adapters/claude-code/hooks/hooks.json`           | added   | Rendered by `pnpm plugin:sync`: the `Stop` hook in the shape the plugin docs require, which runs the script through `sh` from `${CLAUDE_PLUGIN_ROOT}`.                                                                                                                          |
| `plugins/sdlc/adapters/claude-code/hooks/check-reply-shape.sh` | added   | Rendered by `pnpm plugin:sync`: a copy of the source script.                                                                                                                                                                                                                    |
| `scripts/sync-plugin.ts`                                       | changed | Renders the hook config and script, reports a stale or orphan hook file, runs `sh -n` and the case table on each source hook script, checks `source/hooks/` for tool names, and has self-tests for the case runner and the render. The Cursor adapter renders as it did before. |
| `plugins/sdlc/README.md`                                       | changed | Says the plugin ships the hook, what it checks, and that it needs `jq`.                                                                                                                                                                                                         |

## Order of work

1. Run the eval case `reply-gives-full-urls` on the small model without the hook. Check: the count of runs that pass and of each failed grader.
2. Write the script, the case table, and `hooks.json`, and extend `scripts/sync-plugin.ts`. Check: `pnpm plugin:sync` then `pnpm plugin:check` exit 0, and each of these makes `pnpm plugin:check` exit 1: an edit to the rendered script, a flipped expected value in the case table, a tool name in the source script.
3. Check: `claude plugin validate plugins/sdlc/adapters/claude-code` passes.
4. Run the same case with the hook on the small model and on the mid-size model, and the other `no-shell` cases once. Check: each reason the hook gave names a real fault, and the other cases still pass.
5. Check: `pnpm verify` exits 0.

## Risks

- The hook runs on every reply of a session that enables the plugin, not only on a reply of the skill. It acts only when the first non-blank line starts with `**Request:**`, and it does nothing when the input says the session is already continuing from a stop hook, so it blocks a reply at most once.
- It needs `jq`. Without `jq` on the `PATH` it exits 0 and checks nothing, so the shape then rests on the skill's prose alone.
- A blocked reply costs one more turn, and the reason is in English, which can pull the retry out of the person's language. The reason therefore ends by asking for the reply in the language it is written in, and the eval case grades the language of the reply, so its count shows it.
- The checks are patterns, not a parser. "issue 3 of the list" is not a fault, while "issue 3 of acme/shop" is; a reply with a URL on its **Request** line and no page to open next passes only when its **Status** line says "no next page".
- `intent/sdlc-plugin/intent.md` lists moving hooks into the plugin as out of scope. The product owner decided that the plugin holds its SDLC hooks, and this change adds one for Claude Code only.
- The change publishes nothing: it touches no file under `src/` or `templates/`, no publish field of `package.json`, and adds no changeset.
- Option not taken: a rule in `SKILL.md` that repeats the checks. The skill is not edited.

## Proof

- `pnpm plugin:check`: runs 39 cases of the script and 20 self-tests, exits 0; each of the three edits in step 2 makes it exit 1.
- `claude plugin eval plugins/sdlc/adapters/claude-code --case reply-gives-full-urls --scaffold --allow-tools Write Edit --ablation none --model <model> --runs <n>`: on the small model, 24 of 30 runs pass without the hook and 29 of 30 with it; the one failure with the hook is `reply-has-no-bare-number`, and those without it are 2 each of `reply-is-in-thai`, `reply-has-no-bare-number`, and `status-line-gives-the-pull-request-url`. On the mid-size model, 10 of 10 runs pass with the hook.
- `claude plugin eval plugins/sdlc/adapters/claude-code --tag no-shell --runs 3` on the small model: 10 of 12 runs pass; the two failures are `reply-is-in-thai` in `reply-gives-full-urls` and `02-the-reply-does-not-redo-the-done-step` in `second-run-changes-nothing`.
- `pnpm verify`: exits 0.
