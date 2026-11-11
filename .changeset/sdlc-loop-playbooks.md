---
"@next-friday/create-app": minor
---

Generated projects gain the rest of the `/sdlc` loop. `/sdlc` now routes to a `maintain` playbook, which writes an `intent.md` from a finding, and a `deploy` playbook, which stops at the production gate. `pnpm intent:check` checks an `intent.md` and runs in `pnpm verify` and CI. A plan records who accepted it and a spec records the request that started it. New files: `SECURITY.md`, `lessons/README.md`, and a documentation issue form.
