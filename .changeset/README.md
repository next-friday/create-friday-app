# Changesets

## What a version covers

The npm package holds `dist/` (built from `src/`), `templates/`, `package.json`, `README.md`, and `LICENSE`. A person who runs the CLI gets every file under the stack's template, agent instructions included.

The version number follows [Semantic Versioning](https://semver.org/). The public API it describes is:

- the command name, the CLI arguments, the prompts, and the stack names;
- the Node.js versions the CLI runs on (`engines` in the root `package.json`).

The files under `templates/` are what the CLI produces. `src/create.ts` copies them into the new project once, so a later version changes no project that already exists. A template change is therefore `patch` or `minor`, never `major`.

## Which pull requests need a changeset

- A pull request adds a changeset when it changes a file under `src/` or `templates/`, or one of these `package.json` fields: `bin`, `dependencies`, `engines`, `exports`, `files`, `name`, `optionalDependencies`, `peerDependencies`, `type`.
- A pull request that changes none of those adds none. This repository's own agent instructions, scripts, tests, and CI are not in the package. `README.md` and `LICENSE` are, and a change to them goes out with the next version.
- A pull request that Dependabot opens adds none, whatever it changes. A maintainer who wants it released on its own adds a `patch` changeset to that pull request; otherwise it goes out with the next version.
- This repository does not use empty changesets (`changeset --empty`): a pull request that publishes nothing adds no file.

`pnpm changesets:check` fails a branch that changes something published without a changeset, adds a changeset without changing something published, or declares `major` without a change to the public API. It runs in `pnpm verify`, which the pre-push hook and the release job run. It does not judge `patch` against `minor`; the reviewer does.

## Add a changeset

From the repository root:

```sh
pnpm changeset
```

Each pull request that needs one adds its own. Changesets stack: a pull request with separate changes adds one for each, and editing one that is already pending on `main` counts as adding one.

## Choose a release type

- `patch`: a fix or a rewording that adds nothing. Examples: a defect in the CLI; a corrected playbook, hook, or workflow in a template; an updated dependency.
- `minor`: something that was not there before and breaks nothing. Examples: a CLI option; a stack; a new playbook, script, or command in the generated project; a CLI argument marked as deprecated.
- `major`: a command that ran before no longer runs. That is a removed or renamed CLI argument, prompt, stack, or command name, or a higher minimum Node.js version for the CLI.

Before you add a `major` changeset, stop and tell the product owner the version it produces and why: ask in the session, or in the pull request's description when no one is in the session. Add it only after they agree.

## When a version is released

1. Changesets collect on `main`. The release workflow keeps one release pull request open; it holds every pending changeset and one version number, the highest type among them.
2. A maintainer merges the release pull request when the work that belongs in the version is on `main`, not after each pull request. Leaving it open releases nothing.
3. The workflow then stages the version on npm, and a maintainer approves it there. `CONTRIBUTING.md` describes these steps.

## Write release notes

Write each entry so it stands on its own:

- Say what changed and why, and what a person does differently because of it.
- Name the affected CLI behavior or generated file directly.
- Include migration guidance for a breaking change.
- Do not rely on an issue, pull request, or commit link to explain the change.
