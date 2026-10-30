# @next-friday/create-app

## 0.1.0

### Minor Changes

- f909f4c: First release of `pnpm create @next-friday/app`.

  - Asks for a project name and a stack: Node.js, NestJS, Next.js, or Payload.
  - Copies the stack's bundled template, renames the project, and writes `.env` from `.env.example`.
  - Runs `git init --initial-branch=main` and `pnpm install`.
  - `<name>` and `--stack` skip the prompts, and `.` uses the current directory.
  - `--skip-git` and `--skip-install` skip the Git and install steps.
