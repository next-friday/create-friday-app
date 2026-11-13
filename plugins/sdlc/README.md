# sdlc plugin

The `sdlc` plugin runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a verifier subagent, and the default policies.

## What the plugin holds

| Path                          | Holds                                                                                                                                                        |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/`                     | The skills, the subagent's text, the hook scripts with their case tables, and the scripts behind `plan:check`, `bands:check`, and `loop:measure`.            |
| `adapters/`                   | The render of `source/` for each agent tool, with `agents.json` for each tool's subagent fields and `hooks.json` for its hook. `pnpm plugin:sync` writes it. |
| `adapters/claude-code/evals/` | The eval cases, authored there.                                                                                                                              |

## Hook

The plugin ships `check-reply-shape.sh`, a POSIX `sh` script that reads the hook input with `jq`, as a `Stop` hook for Claude Code and as a pair of hooks for Cursor. It checks only a reply whose first line starts with `**Request:**`, and it blocks that reply once, with a reason that asks for the whole reply again, when the reply:

- names a pull request or an issue by number outside a URL, a fenced block, and a code span that holds more than the bare number;
- does not end with a line that starts with `**Status:**`;
- has a URL on its **Request** line, and a **Status** line that neither ends with `Next: <URL>` nor says "no next page".

Cursor's `stop` hook gets no reply text, so the Cursor adapter runs the script twice, from `hooks/hooks.json`:

- `afterAgentResponse` runs `check-reply-shape.sh save`, which writes the reply text to a file named after the conversation under `${TMPDIR:-/tmp}/sdlc-reply-shape/` and prints nothing;
- `stop` runs `check-reply-shape.sh followup` with `loop_limit` 1. It reads that file and deletes it, and after a completed run with `loop_count` 0 it runs the same checks, and prints a `followup_message` with the same reason, which Cursor sends as the next message. Cursor therefore sends at most one follow-up.

The hook needs `jq` on the `PATH` and does nothing without it. `pnpm plugin:check` runs the hook against the cases in `source/hooks/check-reply-shape.cases.json`.

## Use it in this repository

This repository registers the plugin in `.claude/settings.json` as a local `directory` marketplace named `next-friday-plugins` and enables `sdlc@next-friday-plugins`, so a session here loads it once the folder is trusted.

## Checks

Run each from the repository root. Each one runs its self-tests first and exits 1 on a problem or a self-test failure.

| Command             | Checks                                                                                           |
| :------------------ | :----------------------------------------------------------------------------------------------- |
| `pnpm plan:check`   | Each `intent/<change>/plan.md` against the plan template and its `spec.md`.                      |
| `pnpm bands:check`  | `bands.yaml` against the rules for control bands.                                                |
| `pnpm loop:measure` | For each `intent/<change>` folder, the days from intent to spec and the commits after each step. |
| `pnpm plugin:check` | The adapters against `source/`.                                                                  |

## Eval cases

The cases run with `claude plugin eval`. A case's tag says which command runs it:

| Command                | Cases                | Tools granted                                                                                                                          |
| :--------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm evals:run`       | tagged `no-shell`    | `Write` and `Edit`.                                                                                                                    |
| `pnpm evals:run:write` | tagged `needs-write` | `Write`, `Edit`, and `Bash`. `claude plugin eval` runs `Bash` only under an OS sandbox, which on Linux needs `bubblewrap` and `socat`. |

A grader that requires no file, commit, or branch passes whatever the skill says unless its case may use the tool it forbids, so each case runs under the command that grants that tool.
