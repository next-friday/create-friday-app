<!-- Use `<type>(<scope>): <subject>` for the pull request title. `.github/workflows/validate-pr-title.yml` lists the allowed types. For a breaking change as defined in `.changeset/README.md`, record a major release in the changeset. -->

## Description

<!-- Describe what changed and why. -->

## Related issue

<!-- Link a related issue (for example, `Closes #123`) or write `None`. -->

## Contributor checklist

- [ ] The change follows `CONTRIBUTING.md`.
- [ ] CLI arguments, prompts, and the generated project layout are unchanged, or the changeset declares the change breaking.
- [ ] Tests cover any changed observable contract.

## Verification

<!-- List the checks you ran and their results. Note checks left to Git hooks or CI. -->

## Release intent and changeset

<!-- Select one option. -->

- [ ] A package release is required, and a pending or new `.changeset/*.md` entry covers it.
- [ ] The package change has no release impact, so no changeset is required.
- [ ] Only documentation, CI, or repository tooling changed, so no changeset is required.
