# Review instructions

## Passes

Run three passes and tag each finding with its pass:

- Bugs: logic errors, broken edge cases, subtle regressions
- Security: injection risks, authentication gaps, PII in logs
- Compliance: the change matches spec.md, plan.md and our design principles; flag a plan.md that has no `Accepted by:` line

## What Important means here

Reserve Important for findings that would break behavior, leak data or breach a policy. Style and naming are nits.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Do not report

Generated files and anything CI already enforces: `templates/payload/src/app/(payload)/**`, `templates/payload/src/migrations/**`, `templates/payload/src/payload-types.ts`, `templates/turborepo/apps/backoffice/src/app/(payload)/**`, `templates/turborepo/apps/backoffice/src/migrations/**`, and `templates/turborepo/apps/backoffice/src/payload-types.ts`.
