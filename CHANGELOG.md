# @next-friday/create-app

## 7.0.0

### Major Changes

- 478ee72: Generated projects no longer include the `git-workflow` and `script-driven-changes` agent skills, in `.agents/skills/`, `.claude/skills/`, or `.cursor/skills/`, or the links to them in `.cursor/BUGBOT.md`. Each stack's `AGENTS.md` has a new convention with the rules from `git-workflow` that no Git hook enforces: branch from the latest `origin/main` as `<type>/<short-description>`, open the pull request ready for review, drive it until it waits only on code owner approval, rebase and force-push with lease only your own branches, and leave the merge to a person. If a script or habit in your project calls either skill, use the `AGENTS.md` convention instead.
- 40b0775: Generated projects start work through one command, `/sdlc`, and no longer include the `write-intent` skill. `/sdlc` matches a request to a playbook in `.agents/skills/sdlc/playbooks/`: `question` answers without changing anything, and `plan` interviews the originator, drafts `intent/<change>/intent.md`, and waits for their yes before it commits or opens a pull request. A request for a later step, such as a spec or a deploy, is told that the step has no playbook yet. `/sdlc-help` explains the workflow and starts no work. Each stack's `AGENTS.md` gains a convention for replies a person can check, and tells the agent to answer a problem report with the `/sdlc` message that would start the work. If you ran `/write-intent`, send the same request with `/sdlc`.

## 6.0.2

### Patch Changes

- 9ce62fc: Generated projects now block agents from `prod`: `.agents/hooks/agent-production-gate.sh` stops `gh workflow run` and workflow dispatches with `environment=prod`, Railway CLI commands that name `prod` as their environment, release tag pushes (a `v<number>`, `tags/`, or `refs/tags/` ref, `--tags`, `--follow-tags`, or `--mirror`), and any command that mentions `push.followTags`, unless the agent was started with `RELEASE_APPROVAL` set. The hook used to look for a command containing both "deploy" and "production", so it never matched the `prod` environment. `SETUP.md` documents `RELEASE_APPROVAL`, and each stack's README asks for required reviewers on `prod` only, because `dev` deploys on every push to `main`.

## 6.0.1

### Patch Changes

- ecfaf2d: The CLI no longer follows a Git repository named by an inherited `GIT_DIR`, as Git sets when the CLI runs from a Git hook. It used to treat the new project as inside that repository and skip `git init`, and `pnpm install` set the Git hooks path in that repository's config. Both now act on the new project's own repository.

## 6.0.0

### Major Changes

- 6f20a84: The CLI's command `create-friday-app` is now `next-friday-create-app`, matching the repository name. `pnpm create @next-friday/app`, `npm init @next-friday/app`, and `npx @next-friday/create-app` work as before. If you installed the package globally or call the command by name in a script, run `next-friday-create-app` instead.

## 5.0.3

### Patch Changes

- 6fb83e6: Generated projects start agent work only when a person asks: the `write-intent` skill runs only through `/write-intent` and interviews the originator in rounds before it writes and commits the intent, `babysit-pr` drives a pull request to code owner review without merging it, and each stack's `AGENTS.md` lists when the agent stops.

## 5.0.2

### Patch Changes

- 74fe4ec: The generated `.husky/pre-push` hook's refusal for a deleted branch no longer guesses that the branch's pull request merged or closed, since the remote branch may have been deleted by hand. It says the branch no longer exists on the remote, how to continue on a new branch from the latest `main`, and that `git fetch --prune` followed by `git branch --unset-upstream` lets you reuse the name.

## 5.0.1

### Patch Changes

- fc7a388: The generated `.husky/pre-push` hook refuses a push that recreates a branch the remote deleted after its pull request merged or closed. The hook treats a branch as pushed before when `refs/remotes/<remote>/<branch>` exists or the branch upstream points at it, and the push of a new branch name still works.

## 5.0.0

### Major Changes

- 2f474f9: Generated projects no longer call the Claude API from GitHub Actions, so they need no workload identity federation or repository variables. The `Claude` and `Agent evals` workflows, the `Triage failed build` job in `ci.yml`, `evals/`, and `lessons/` are removed, and `SETUP.md` drops their steps. Claude Code Review still reviews pull requests from the Claude GitHub App.

## 4.0.1

### Patch Changes

- 47e7676: Generated Dockerfiles (`nodejs`, `nestjs`, `nextjs`, `payload`, and both `turborepo` apps) activate pnpm with `corepack enable`, which installs the version and sha512 hash in `package.json#packageManager`, instead of `npm install --global pnpm`. Their `node` base image is referenced by digest alone, and long `FROM` and `rm -rf` lines are split with backslash continuations.

## 4.0.0

### Major Changes

- 26a3bdd: Generated projects load fewer rules at session start: `git-workflow` and `script-driven-changes` are skills in `.agents/skills/`, and `constitution-changes`, `diagnostics-and-error-handling`, and `structured-logging` load only for matching files. Accepted risks in a tool's central file need an owner and a reason, and no expiry date.

## 3.0.0

### Major Changes

- 67ebf66: Generated projects follow Anthropic's AI-native SDLC Playbook in Claude Code and Cursor: `SETUP.md` replaces the setup steps in `README.md`; `intent/`, `lessons/`, `evals/`, `bands.yaml`, skills, a `verifier` subagent, and a review policy are written once in the project and in `.agents/`, and `pnpm rules:sync` renders them for each tool; sessions start in plan mode; new hooks format edits, block test edits during a bug fix, and gate production deploys; CI triages failed builds; `@claude` fixes review comments.

  Migration: generate a new project with the same stack, copy the new files, and follow its `SETUP.md`.

## 2.1.9

### Patch Changes

- 5bf1bfa: Generated Node.js, NestJS, Next.js, and Payload projects format `*.sh` files on commit, as Turborepo projects already do.

## 2.1.8

### Patch Changes

- c1d9f41: Generated projects deploy only from `main`, promote to `prod` only from runs on `main`, format `*.sh` files on commit in every stack, run the shell gate for every Claude Code shell tool. The turborepo CI no longer expands step outputs inside `run:`.

## 2.1.7

### Patch Changes

- 0a8567e: Each generated project's `AGENTS.md` lists the commands to run, including a single test, explains how the stack's code fits together, and names the stack's known pitfalls. The Turborepo guide points agents to the Next.js docs inside each app instead of the workspace root.

## 2.1.6

### Patch Changes

- 4353d52: Generated projects include Evidence, Platform and Library First, Logging, Constitution Changes, and Agent-Owned Work rules. The Dependencies rule accepts a maintained library that replaces custom code.

## 2.1.5

### Patch Changes

- c6f6604: Generated projects include a Descriptive Naming rule. Agents give paths and identifiers names that say what they hold, keep organization names out of them, and do not copy a sibling name that breaks the rule.

## 2.1.4

### Patch Changes

- 98aed8f: Generated projects include a Codebase Hygiene rule. Agents change existing code instead of accumulating new code, and git keeps the history.

## 2.1.3

### Patch Changes

- 8691e3b: Generated projects include `CLAUDE.md`, which imports `AGENTS.md`, so Claude Code loads the same agent guide as Cursor.

## 2.1.2

### Patch Changes

- d1b9a9f: This repository and generated projects run GitHub Dependency Review, CodeQL, and OpenSSF Scorecard. Generated projects also upload zizmor results to code scanning and pin TruffleHog with the CLI repository.
- acc8fa7: Generated projects run the production build from `pnpm check` and `pnpm verify`, so the `pre-push` hook matches the CLI gate.

## 2.1.1

### Patch Changes

- 29ee3af: Generated `turborepo` projects run affected Turborepo tasks on pull requests, cache eligible tasks, deploy only Railway services whose packages changed, and document how to add an Expo app under `apps/mobile`.

## 2.1.0

### Minor Changes

- a6617be: Add a `turborepo` stack. Generated projects are a pnpm workspace with a Next.js app in `apps/app` and a Payload backoffice in `apps/backoffice`. `pnpm dev` starts the app on port 3000 and the backoffice on port 3001. The backoffice API is REST at `/api`. The company checks, hooks, and CI match the other templates. Deploy to Railway updates both services on the same commit.

### Patch Changes

- a6617be: Generated `payload` projects serve the REST API at `/api`.

## 2.0.0

### Major Changes

- 35623d0: Generated `payload` projects serve the REST API. The admin panel is unchanged.

  Migration: call the REST API at `/api`.

## 1.0.0

### Major Changes

- e4018ec: Generate `nestjs` projects on TypeScript 7.0.2 and `@next-friday/eslint-config-friday` 5.1.0.

  The Nest CLI needs the TypeScript compiler API, which TypeScript 7.0 does not ship, so generated `nestjs` projects no longer use it. `@nestjs/cli`, `@nestjs/schematics`, and `nest-cli.json` are gone. `pnpm build` now runs `tsc -p tsconfig.build.json`, and `pnpm start`, `pnpm start:dev`, and `pnpm start:debug` compile with `tsc` and run `dist/main` with `node`. The scripts keep their names and `.env` handling.

  Migration: `nest generate` is no longer available in generated `nestjs` projects. Add modules, controllers, and services by hand.

## 0.1.0

### Minor Changes

- f909f4c: First release of `pnpm create @next-friday/app`.

  - Asks for a project name and a stack: Node.js, NestJS, Next.js, or Payload.
  - Copies the stack's bundled template, renames the project, and writes `.env` from `.env.example`.
  - Runs `git init --initial-branch=main` and `pnpm install`.
  - `<name>` and `--stack` skip the prompts, and `.` uses the current directory.
  - `--skip-git` and `--skip-install` skip the Git and install steps.
