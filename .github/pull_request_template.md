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

- [ ] This pull request completes a piece of work that needs a release, and a pending or new `.changeset/*.md` entry covers the whole.
- [ ] No changeset: a later pull request of the same piece of work carries it.
- [ ] No changeset: only agent instructions, comments, documentation, CI, or repository tooling changed.
