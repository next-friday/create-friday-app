# Review instructions

## Passes

Run three passes and tag each finding with its pass:

- Bugs: logic errors, broken edge cases, subtle regressions
- Security: injection risks, authentication gaps, PII in logs
- Compliance: the change matches spec.md, plan.md and the design principles that the four policies in force state, each the project's `.agents/skills/<area>-policy/SKILL.md` or the plugin's default; flag a plan.md that has no `Accepted by:` line and a change that makes `AGENTS.md` outdated

## What Important means here

Reserve Important for findings that would break behavior, leak data or breach a policy. Style and naming are nits.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Checks by what the change touches

| When the change touches…                                       | Check                                                                                                                                                                                                                                                                           |
| :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `templates/`                                                   | A project generated for each stack in `src/stacks.ts` passes its `pnpm verify`.                                                                                                                                                                                                 |
| A changeset, a new package, or `.github/workflows/release.yml` | The pull request names the package and the version that reach npm, and `pnpm exec changeset publish-plan` agrees.                                                                                                                                                               |
| A rename or a move                                             | A search for the old name finds it only where the change means to keep it.                                                                                                                                                                                                      |
| An intent, a spec, or a plan                                   | Each requirement number and step number that a sentence cites names the requirement or step the sentence describes, and nothing the request did not ask to remove is gone.                                                                                                      |
| A skill or a playbook                                          | The rendered adapters match the source (`pnpm plugin:check`), every eval case loads, and no grader was changed to pass.                                                                                                                                                         |
| A reported eval result                                         | It counts every run of the final text.                                                                                                                                                                                                                                          |
| Every change                                                   | No file of the constitution is touched (`.agents/rules/constitution-changes.md` defines it; the `deny` list in `.claude/settings.json` names its files), files hold no history, date, or limitation, and the pull request closes each issue it resolves with `Closes #<issue>`. |

## This repository

- Require root-cause fixes. Flag new suppression directives, skipped tests, `as any`, and lint rules turned off in `eslint.config.ts`.
- Preserve CLI arguments, prompts, and stack ids. Flag a breaking change, as defined in `.changeset/README.md`, that has no major changeset, and a major changeset for a change that is not breaking by that definition.
- Require tests in `test/` to exercise observable CLI behavior. Flag tests that assert implementation shape alone.
- Keep runtime dependencies to what the shipped CLI needs; repository tooling belongs in `devDependencies`.
- Each stack is `templates/base` plus `templates/<stack>`. Keep a file in `base` only when every stack uses it with the same content. A stack may replace that file when its content must differ. Flag a `.gitignore` not stored as `_gitignore` and a committed `pnpm-lock.yaml` under `templates/`.

## Do not report

Generated files and anything CI already enforces: `templates/payload/src/app/(payload)/**`, `templates/payload/src/migrations/**`, `templates/payload/src/payload-types.ts`, `templates/turborepo/apps/backoffice/src/app/(payload)/**`, `templates/turborepo/apps/backoffice/src/migrations/**`, and `templates/turborepo/apps/backoffice/src/payload-types.ts`.
