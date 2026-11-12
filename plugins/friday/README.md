# friday plugin

The `friday` plugin runs the software development loop: a skill that matches a request to a playbook and takes it to the next human gate, a help skill, a verifier subagent, and the default policies.

## What the plugin holds

| Path                          | Holds                                                                                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `source/`                     | The skills, the subagent's text, and the scripts behind `plan:check`, `bands:check`, and `loop:measure`.                       |
| `adapters/`                   | The render of `source/` for each agent tool, and `agents.json` with each tool's subagent fields. `pnpm plugin:sync` writes it. |
| `adapters/claude-code/evals/` | The eval cases, authored there.                                                                                                |

## Enable it in a project

This repository registers the plugin in `.claude/settings.json` as a local `directory` marketplace named `next-friday` and enables `friday@next-friday`, so a session here loads it once the folder is trusted. A project in another checkout adds the marketplace and enables the plugin the same way.

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
