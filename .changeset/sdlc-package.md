---
"@next-friday/sdlc": minor
---

Add `@next-friday/sdlc`, the npm package that carries the checks of the SDLC loop. It installs three commands: `sdlc-plan-check` checks each `intent/<change>/plan.md` against the plan template and the `spec.md` beside it, `sdlc-bands-check` checks `bands.yaml`, and `sdlc-loop-measure` prints the days and commits each change took from intent to plan. A project adds the package as a development dependency, so these checks run in CI and on a machine where no agent tool is installed.
