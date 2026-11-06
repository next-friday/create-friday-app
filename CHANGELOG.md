# @next-friday/create-app

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
