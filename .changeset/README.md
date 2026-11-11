# Changesets

Add a changeset only for a change that a person would notice when they run the CLI or run a command in the project it generated.

## Changes that need no changeset

- Agent instructions, whether added, removed, or reworded: skills, playbooks, rules, and `AGENTS.md`.
- Scripts and checks that exist to check agent instructions or agent gates, such as `pnpm human-gates:check`.
- Comments, documentation, and the templates for issues and pull requests.
- CI and tooling of this repository.

## Add a changeset

From the repository root:

```sh
pnpm changeset
```

Check pending `.changeset/*.md` files first. When one already covers the same piece of work, edit it; do not add a second one.

## Choose a release type

- Use `patch` for a fix to a defect a person meets when they run the CLI or the generated project.
- Use `minor` for something a person can use for their own application that was not there before, such as a CLI option, a stack, or a command in the generated project that builds, tests, or deploys their code. Any other change to a template file that is not listed above is `minor` at most.

- Use `major` only when a CLI argument, a prompt, or a stack is removed or renamed, so that a command that ran before no longer runs. A change to what a template contains is never `major`.

Before you add a `major` changeset, stop and tell the product owner the version it produces and why: ask in the session, or in the pull request's description when no one is in the session. Add it only after they agree.

## One release for one piece of work

A piece of work is one `intent/<change>/` folder, or one request from the product owner when there is no intent. A fix that stands alone is its own piece of work.

When a piece of work is split over several pull requests, only the pull request that completes it carries a changeset, and that changeset describes the whole. Each earlier pull request says in its description that a later pull request carries the changeset. Before you plan work as more than one pull request, tell the product owner how many releases the plan produces and which versions.

## Write release notes

Write each entry so it stands on its own:

- Name the affected CLI behavior directly.
- Include arguments, prompts, or generated files when they matter.
- Include migration guidance for breaking changes.
- Do not rely on an issue, pull request, or commit link to explain the change.
