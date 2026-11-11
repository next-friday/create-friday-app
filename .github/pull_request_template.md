<!-- Use `<type>(<scope>): <subject>` for the pull request title. `.github/workflows/validate-pr-title.yml` lists the allowed types. `.changeset/README.md` says whether the change needs a changeset; a major one needs the product owner's agreement first. -->

## Description

<!-- Describe what changed and why. -->

## Related issue

<!-- Write `Closes #123` only for an issue that already exists; otherwise write `None`. Do not open an issue only to get a number. -->

## Contributor checklist

- [ ] The change follows `CONTRIBUTING.md`.
- [ ] CLI arguments, prompts, and stack names are unchanged, or the changeset declares the change breaking.
- [ ] Tests cover any changed observable contract.

## Verification

<!-- List the checks you ran and their results. Note checks left to Git hooks or CI. -->

## Release intent and changeset

<!-- Select one option. -->

- [ ] This pull request changes a file under `src/` or `templates/`, and adds a changeset of the type `.changeset/README.md` gives.
- [ ] No changeset: nothing under `src/` or `templates/` changed.
