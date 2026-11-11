# Changesets

The package publishes `dist/` (built from `src/`) and `templates/`. A person who runs the CLI gets every file under `templates/`, agent instructions included.

## Which pull requests need a changeset

- A pull request that changes a file under `src/` or `templates/` adds a changeset. `pnpm changesets:check` fails without one.
- A pull request that changes nothing under `src/` or `templates/` adds none: this repository's own agent instructions, scripts, tests, documentation, and CI are not published.
- A dependency update that Dependabot opens needs none. It is published with the next version.

## Add a changeset

From the repository root:

```sh
pnpm changeset
```

A pull request with separate changes of different types adds one changeset for each. Editing a changeset that is already pending on `main` counts as adding one.

## Choose a release type

- Use `patch` for a fix or a rewording: a defect in the CLI, or in a template file such as a playbook, a hook, or a workflow.
- Use `minor` for something that was not there before: a CLI option, a stack, or a new playbook, script, or command in the generated project.
- Use `major` only when a CLI argument, a prompt, or a stack is removed or renamed, so that a command that ran before no longer runs. A change to what a template contains is never `major`.

Before you add a `major` changeset, stop and tell the product owner the version it produces and why: ask in the session, or in the pull request's description when no one is in the session. Add it only after they agree.

## When a version is released

Changesets collect on `main`. The release workflow keeps one release pull request open that holds all of them, and the version is the highest type among them. Merging that pull request publishes one version. A maintainer merges it when the work that belongs in the version is on `main`, not after each pull request.

## Write release notes

Write each entry so it stands on its own:

- Name the affected CLI behavior or generated file directly.
- Include arguments, prompts, or generated files when they matter.
- Include migration guidance for breaking changes.
- Do not rely on an issue, pull request, or commit link to explain the change.
