# @next-friday/sdlc

The checks behind the Next Friday SDLC loop. A project that runs the loop installs this package as a development dependency, so its checks run where no agent tool is installed, such as CI.

| Command             | Checks                                                                                           |
| :------------------ | :----------------------------------------------------------------------------------------------- |
| `sdlc-plan-check`   | Each `intent/<change>/plan.md` against the plan template and its `spec.md`.                      |
| `sdlc-bands-check`  | `bands.yaml` against the rules for control bands.                                                |
| `sdlc-loop-measure` | For each `intent/<change>` folder, the days from intent to spec and the commits after each step. |

Run a command from the project root. Each one runs its self-tests first and exits 1 on a problem or a self-test failure.

The `friday` plugin lives in the same directory as this package: `source/` holds the skills, the subagent, the eval cases, and these scripts, and `adapters/` holds the render for each agent tool.
