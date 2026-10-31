# Review rules

- Require root-cause fixes. Flag new `@ts-ignore`, `@ts-expect-error`, `as any`, skipped tests, `eslint-disable` directives, and lint rules turned off in `eslint.config.ts`.
- Preserve CLI arguments, prompts, stack ids, and the generated project layout. Flag a breaking change, as defined in `.changeset/README.md`, that has no major changeset.
- Require tests in `test/` to exercise observable CLI behavior. Flag tests that assert implementation shape alone.
- Keep runtime dependencies to what the shipped CLI needs; repository tooling belongs in `devDependencies`.
- Each stack is `templates/base` plus `templates/<stack>`. Keep a file in `base` only when every stack uses it with the same content. A stack may replace that file when its content must differ. Current replacements are `templates/nextjs/knip.json`, `templates/turborepo/knip.json`, `templates/turborepo/pnpm-workspace.yaml`, `templates/turborepo/.github/dependabot.yml`, `templates/turborepo/.github/labeler.yml`, and `templates/turborepo/.github/workflows/deploy.yml`. Flag a `.gitignore` not stored as `_gitignore` and a committed `pnpm-lock.yaml` under `templates/`.
- Every stack ships `fast-check` for the projects it generates, even when the stack's own tests do not import it yet; such a stack lists it in `ignoreDependencies` in its `knip.json`.
- Skip generated Payload files: `templates/payload/src/app/(payload)/**`, `templates/payload/src/migrations/**`, `templates/payload/src/payload-types.ts`, and the same three paths under `templates/turborepo/apps/backoffice/`.
