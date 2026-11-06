# Review rules

- Require root-cause fixes. Flag new suppression directives, skipped tests, `as any`, and lint rules turned off in `eslint.config.ts`.
- Preserve CLI arguments, prompts, stack ids, and the generated project layout. Flag a breaking change, as defined in `.changeset/README.md`, that has no major changeset.
- Require tests in `test/` to exercise observable CLI behavior. Flag tests that assert implementation shape alone.
- Keep runtime dependencies to what the shipped CLI needs; repository tooling belongs in `devDependencies`.
- Each stack is `templates/base` plus `templates/<stack>`. Keep a file in `base` only when every stack uses it with the same content. A stack may replace that file when its content must differ. Current replacements are `templates/nextjs/knip.json`, `templates/turborepo/knip.json`, `templates/turborepo/pnpm-workspace.yaml`, `templates/turborepo/.github/dependabot.yml`, `templates/turborepo/.github/labeler.yml`, and `templates/turborepo/.github/workflows/deploy.yml`. Flag a `.gitignore` not stored as `_gitignore` and a committed `pnpm-lock.yaml` under `templates/`.
- Every stack ships `fast-check` for the projects it generates, even when the stack's own tests do not import it yet; such a stack lists it in `ignoreDependencies` in its `knip.json`.
- Skip generated Payload files: `templates/payload/src/app/(payload)/**`, `templates/payload/src/migrations/**`, `templates/payload/src/payload-types.ts`, and the same three paths under `templates/turborepo/apps/backoffice/`.

Review pull requests against this repository's agent rules:

- [Agent guide](../AGENTS.md)
- [Owned Checks](../.agents/rules/automation-owned-checks.md)
- [Required Comments](../.agents/rules/code-comments.md)
- [Codebase Hygiene](../.agents/rules/codebase-hygiene.md)
- [Current State](../.agents/rules/current-state-authority.md)
- [Demand-Driven Configuration](../.agents/rules/demand-driven-configuration.md)
- [Dependencies](../.agents/rules/dependency-security.md)
- [Descriptive Naming](../.agents/rules/descriptive-naming.md)
- [Test Admission](../.agents/rules/deterministic-testing.md)
- [Diagnostics](../.agents/rules/diagnostics-and-error-handling.md)
- [Git Workflow](../.agents/rules/git-workflow.md)
- [Findings](../.agents/rules/no-suppression.md)
- [Scripts](../.agents/rules/script-driven-changes.md)
- [Sibling Style](../.agents/rules/single-author-style.md)
- [TypeScript-First](../.agents/rules/typescript-first.md)
