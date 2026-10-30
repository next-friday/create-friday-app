# Changesets

Add a changeset for every change that users of the CLI would notice. Changes to documentation, CI, or repository tooling need none.

The current package baseline is `0.0.0`. `.changeset/first-release.md` is the pending First Release; do not create a second initial-release changeset.

## Add a changeset

From the repository root:

```sh
pnpm changeset
```

Check pending `.changeset/*.md` files first. Do not record the same unreleased change twice.

## Choose a release type

- Use `patch` for backward-compatible fixes.
- Use `minor` for new backward-compatible capabilities.
- Use `major` for breaking changes: a removed or renamed argument or stack, or a previously valid command that now generates a different project.

## Write release notes

Write each entry so it stands on its own:

- Name the affected CLI behavior directly.
- Include arguments, prompts, or generated files when they matter.
- Include migration guidance for breaking changes.
- Do not rely on an issue, pull request, or commit link to explain the change.
