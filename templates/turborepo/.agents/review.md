# Review instructions

## Passes

Run three passes and tag each finding with its pass:

- Bugs: logic errors, broken edge cases, subtle regressions
- Security: injection risks, authentication gaps, PII in logs
- Compliance: the change matches spec.md, plan.md and the design principles that the policies in force state, each the project's own `.agents/skills/<area>-policy/SKILL.md` or else the `sdlc` plugin's default; flag a plan.md that has no `Accepted by:` line and a change that makes `AGENTS.md` outdated

## What Important means here

Reserve Important for findings that would break behavior, leak data or breach a policy. Style and naming are nits.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Do not report

Generated files and anything CI already enforces: `pnpm-lock.yaml`, `apps/backoffice/src/app/(payload)/**`, `apps/backoffice/src/migrations/**`, and `apps/backoffice/src/payload-types.ts`.
