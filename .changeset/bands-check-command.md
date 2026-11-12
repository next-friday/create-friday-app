---
"@next-friday/create-app": minor
---

Every generated project gets `pnpm bands:check <file>`. It reads `bands.yaml` and a JSON file `{"baseline": [...], "recent": [...]}`, applies the Western Electric rules to the metric, and prints one JSON line with the tier, its action, tools, and routes. A `2sigma` or `3sigma` result goes to `/sdlc` as a finding. With no argument it runs its self-tests, and `pnpm verify` runs them. Each stack gains the `yaml` dev dependency.
