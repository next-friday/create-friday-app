# Review instructions

## Passes

Run three passes and tag each finding with its pass:

- Bugs: logic errors, broken edge cases, subtle regressions
- Security: injection risks, authentication gaps, PII in logs
- Compliance: the change matches spec.md, plan.md and the four policies in `.agents/skills/`; flag a plan.md that has no `Accepted by:` line and a change that makes `AGENTS.md` outdated

## What Important means here

Reserve Important for findings that would break behavior, leak data or breach a policy. Style and naming are nits.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Do not report

Generated files, such as `src/payload-types.ts` and `src/migrations/` where the project has them, and anything CI already enforces.
