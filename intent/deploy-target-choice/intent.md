# Intent: Ask where the project deploys

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

- A template is a starter: it holds what every project uses under company rules. Where a project deploys is not known when the project is generated, and the CLI does not ask. It asks for the project name and the stack only (`src/create.ts:334`, `src/create.ts:352`).
- Every generated project still gets the files of one host, Railway: `templates/base/.github/workflows/deploy.yml`, `templates/base/railway.json`, `templates/base/runbooks/rollback-deploy.md`, and the `deploy-dev` job in each stack's `ci.yml`. A project that deploys elsewhere removes them by hand; each stack's `README.md` says "Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere" (`templates/nestjs/README.md:59`).
- The production gate knows one host. `templates/base/.agents/hooks/agent-production-gate.sh:47` blocks the `railway` command against `prod`. A project on another host has no such block for its own deploy command, and nothing says so when the project is generated.
- Every project builds, smoke tests, and scans a container image on each pull request (the `image` job, `templates/nestjs/.github/workflows/ci.yml:113`). A project on a host that builds from source does not use the image, and a failure in that job still fails its pull request.

## Proposed outcome

- The CLI asks where the project deploys, after the stack. The choices are Railway and "not decided yet". An argument gives the answer without the prompt.
- A project generated with Railway holds what a project holds today: the deploy workflow, `railway.json`, the rollback runbook, the `deploy-dev` job, and the README's deploy section.
- A project generated with "not decided yet" holds none of those files and no text that names Railway. Its README says that the project has no deploy step yet and how to add one.
- Every project keeps its `Dockerfile` and `.dockerignore`, because the image runs on any host that runs containers. The `image` job runs by default; a repository variable turns it off, and `SETUP.md` names the variable.
- The production gate blocks a deploy to `prod` and a release tag push in every project. The part that reads the `railway` command is in a project only when it was generated with Railway.
- The existing arguments, the name prompt, and the stack prompt work as they do today.
- Out of scope:
  - A choice that sets up another host, such as Vercel.
  - Deploy tools for the agent over MCP.
  - Changing a project that was generated earlier.
  - The repository's own deploy and release workflows.

## Affected users and systems

- A person who runs `pnpm create @next-friday/app`: one more prompt, or one more argument.
- A team that deploys on Railway: the same files as today, when it chooses Railway.
- A team that deploys elsewhere: no file to remove after generation.
- Scripts that run the CLI without a terminal, such as this repository's Template and Consumer Smoke jobs.
- `src/` (the prompt, the argument, and what is copied), `templates/` of the five stacks in `src/stacks.ts`, each stack's `README.md` and `ci.yml`, `templates/base/SETUP.md`, and the production gate hook.
- `@next-friday/create-app` on npm: the change needs a `minor` version.

## Constraints

- A CLI argument, a prompt, or a stack name that exists today is not removed or renamed (`AGENTS.md`, convention 2).
- The hook, the workflows, and the settings under `templates/` are in the constitution: a person commits them.
- After the change, a project of each stack passes `pnpm verify` for each choice (`AGENTS.md`, "Every stack").
- A stack replaces a `base` file only when it needs different content; `turborepo` replaces `deploy.yml` today (`AGENTS.md`, convention 3).

## Open questions

1. The argument's name and values. **Proposal:** `--deploy railway|none`.
2. What a run without a terminal and without the argument does. **Proposal:** it generates "not decided yet", so no host is chosen for a person who did not choose. Today such a run gets the Railway files.
3. The name of the variable that turns the `image` job off, and its default. **Proposal:** the job runs unless `CONTAINER_IMAGE` is `false`.
4. Whether the prompt is asked for every stack. **Proposal:** yes, the five stacks answer the same question.
5. Whether "not decided yet" keeps the rollback runbook as a template with no host command. **Proposal:** no; it ships with Railway only.
