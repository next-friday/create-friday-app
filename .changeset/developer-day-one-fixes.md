---
"@next-friday/create-app": minor
---

Generated projects gain a short path for fixing a defect. When a request is a defect in behaviour that already exists, `/sdlc` follows the new playbook `.agents/skills/sdlc/playbooks/fix.md`: it reproduces the defect as a failing test, makes the test pass, runs the checks, and opens a pull request. A change that adds behaviour, a dependency, a schema, or a public interface goes through intent, spec, and plan as before.

Every generated project gets `pnpm setup:check`. It names each file that still holds template text: `.github/CODEOWNERS`, `SECURITY.md`, and `.github/zizmor.yml`. `SETUP.md` step 2 tells you when to run it, and `/sdlc` tells you what it reports.

`pnpm depcruise` reads TypeScript 7 sources through the SWC parser: every stack gains the `@swc/core` dev dependency and `"parser": "swc"` in `.dependency-cruiser.json`.

The review instructions in `.agents/review.md` and `REVIEW.md` name the generated files to skip, such as `src/payload-types.ts` and `src/migrations/`. For a change classed as higher risk, the product owner consults a tech lead before accepting the spec. Each stack's `AGENTS.md` carries the rules on issues, on what belongs in the repository, and on sourced requirements.
