# @next-friday/create-app

## 2.0.0

### Major Changes

- 35623d0: Generate `payload` projects with GraphQL disabled, on `graphql` 17.0.2.

  `graphql` 17 breaks every Payload GraphQL request that uses variables, so generated `payload` projects set `graphQL: {disable: true}` and no longer include the `/api/graphql` and `/api/graphql-playground` routes. The REST API and the admin panel are unchanged. `graphql` stays installed because Payload requires it as a peer dependency.

  Migration: use the REST API. To use GraphQL, pin `graphql` to `16.14.2`, remove `graphQL: {disable: true}`, and restore both routes from a Payload template.

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
