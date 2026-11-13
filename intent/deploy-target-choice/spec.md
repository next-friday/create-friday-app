# Spec: Choose where the project deploys

From `intent/deploy-target-choice/intent.md`. Status: draft.

Request: the product owner merged the intent's pull request, https://github.com/next-friday/next-friday-create-app/pull/184.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. The CLI takes the argument `--deploy <target>`. The targets are `railway` and `none`. **Proposal:** these are the argument's name and values.
2. A run without `--deploy` generates the project with the target `none`, with or without a terminal. The CLI shows no prompt for the deploy target.
3. `--deploy` with any other value stops the run before a file is written. The message names the value and lists the targets, as the message for an unknown `--stack` does (`src/arguments.ts:69`).
4. `--help` lists `--deploy` with its targets and says that `none` is the default.
5. The arguments `name`, `--stack`, `--skip-git`, `--skip-install`, `--version`, and `--help`, the name prompt, and the stack prompt behave as they do today.
6. A project generated with `--deploy railway` holds, for each of the five stacks, what a project of that stack holds today:
   1. `.github/workflows/deploy.yml`, `railway.json`, and `runbooks/rollback-deploy.md`;
   2. the `deploy-dev` job in `.github/workflows/ci.yml`;
   3. the README's deploy section;
   4. the Railway check of `.agents/hooks/agent-production-gate.sh` and its cases in `scripts/check-agent-gates.ts`;
   5. `railway.json` in the `globalDependencies` of `turbo.json`, in the `turborepo` stack.
7. A project generated with the target `none` holds none of the files of requirement 6.1 and no `deploy-dev` job. `grep -ri railway` over its files, outside `node_modules`, finds nothing.
8. The README of a project generated with `none` has a deploy section that says the project has no deploy step yet, and what a deploy step needs: a workflow under `.github/workflows/`, the `prod` environment with its required reviewers, and the image the `Dockerfile` builds.
9. Every project holds the `Dockerfile` files and the `.dockerignore` that its stack holds today, whichever target was chosen.
10. The `image` job of each stack's `ci.yml` runs unless the repository variable `CONTAINER_IMAGE` is `false`. **Proposal:** this is the variable's name, and an unset variable runs the job. With the variable `false`, the `ci` job that gathers the results still passes, and `SETUP.md` names the variable beside `CODE_SCANNING`.
11. In every project, the production gate blocks a workflow dispatch whose environment is `prod` and a release tag push. `scripts/check-agent-gates.ts` in a project of each target passes with that project's hook.
12. `AGENTS.md` and `SETUP.md` in a generated project describe the production gate that project holds: the sentence about the Railway command, and the sentence about the `DEPLOY_ENABLED` variable in `SETUP.md`, are there only with `railway`.
13. `pnpm verify` passes in a generated project of each of the five stacks for each of the two targets.
14. The file path the CLI builds for the target's template files comes from the validated target, never from the raw argument.
15. The CLI's messages and the generated files use one name, "deploy target", for this choice.
16. The pull request that builds this adds a `minor` changeset for `@next-friday/create-app`.

## Design

**Proposal:** a deploy target is a template layer for whole files, and marked sections for text inside a shared file.

- `src/deploy-targets.ts` (new): the list of targets and `isDeployTarget`, shaped as `src/stacks.ts` is.
- `src/arguments.ts`: parses `--deploy`, rejects an unknown value, returns `deploy` in `CliOptions` with the default `none`, and lists it in `usage`.
- `templates/deploy-railway/base/` (new): `.github/workflows/deploy.yml`, `railway.json`, and `runbooks/rollback-deploy.md`, moved from `templates/base/`.
- `templates/deploy-railway/turborepo/` (new): `.github/workflows/deploy.yml`, moved from `templates/turborepo/`, and the stack's `turbo.json` with `railway.json` in `globalDependencies`. `templates/turborepo/turbo.json` loses that entry.
- `src/create.ts`, `copyTemplate`: copies `base`, then the stack, then, for a target other than `none`, `deploy-<target>/base` and `deploy-<target>/<stack>` when it exists. It then resolves the marked sections.
- `src/deploy-sections.ts` (new): in each copied text file, keeps the lines between a marker for the chosen target and its end marker, removes the lines between a marker for another target and its end marker, and removes every marker line. **Proposal:** a marker is a comment line in the file's own syntax that holds `deploy:<target>` and its end `deploy:end`.
- Files that gain marked sections: each stack's `README.md` (the deploy section for `railway`, the section of requirement 8 for `none`, and the sentences that name Railway), each stack's `AGENTS.md` (the production gate sentence), each stack's `.github/workflows/ci.yml` (the `deploy-dev` job), `templates/base/SETUP.md`, `templates/base/.agents/hooks/agent-production-gate.sh` (the Railway pattern and its check), and `templates/base/scripts/check-agent-gates.ts` (the Railway cases).
- Each `Dockerfile` comment that lists platforms names no host, so the file is the same for both targets.
- Each stack's `ci.yml`: the `image` job's condition gains `vars.CONTAINER_IMAGE != 'false'`.
- `test/arguments.test.ts` and `test/create.test.ts`: the argument's default, its rejection, and the files of each target.
- The root `.github/workflows/ci.yml`, Template job: generates and verifies each stack with each target.
- The hook, the workflows, and `check-agent-gates.ts` are in the constitution: a person commits them from a patch.

## Policies

- **Brand:** rule 4, as requirement 15. The change shows no other brand value.
- **Security:** `v5.0.0-2.2.1`, as requirement 3: the argument is checked against the list of targets. `v5.0.0-5.3.2`, as requirement 14. Rule 6: the README names the `RAILWAY_TOKEN` secret and holds no value, as it does today. Chapters V2 and V5 hold no other Level 1 requirement that applies to a command-line argument and a local file copy.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- **UX:** Does not apply. The change adds no screen and no prompt; its one message is plain text in the terminal, and requirement 3 makes it say what is wrong and what to pass.

## Areas of concern

1. No policy. `AGENTS.md` says to check a template by generating a project so that "edited files copy back as they are" (`AGENTS.md:18`). A file with marked sections no longer copies back as it is, because the CLI removes the markers. The convention needs a sentence for those files, or the design needs another way to hold the text of a target.
2. No policy. A team that runs `--stack <stack>` today gets the Railway files; after this change it gets none until it adds `--deploy railway`. The intent accepts this and calls the release `minor`; `.changeset/README.md` reserves `major` for "a command that ran before no longer runs", and this command still runs.
3. No policy. Requirement 13 doubles the Template job of this repository's CI from five projects to ten.
4. No policy. With `railway` and `CONTAINER_IMAGE` set to `false`, the `deploy-dev` job needs the skipped `image` job and does not run. The spec leaves that as it is: a project that deploys the image keeps the job that builds it.

## Open questions

1. The argument's name and values: answered as requirement 1, a proposal.
2. The name of the variable that turns the `image` job off, and its default: answered as requirement 10, a proposal.
3. Whether the argument applies to every stack: yes, requirements 6 and 13. Each of the five stacks holds a deploy section, a `deploy-dev` job, and a `Dockerfile` today.
4. Whether `none` keeps the rollback runbook as a template with no host command: no, requirement 7. `runbooks/rollback-deploy.md` ships with `railway` only.
