# @next-friday/create-app

Create a Next Friday project with the company's tooling, Git hooks, CI, and agent rules already in place.

```sh
pnpm create @next-friday/app
```

Answer the prompts for a project name and a stack. To skip the prompts, pass both:

```sh
pnpm create @next-friday/app my-api --stack nestjs
```

Without a terminal, as in CI or an agent, the name and `--stack` are required. Pass `.` as the name to create the project in the current directory, for example in a fresh clone.

## Stacks

| `--stack`   | Starts with                                                       |
| :---------- | :---------------------------------------------------------------- |
| `nodejs`    | A TypeScript HTTP server on `node:http` with a `/health` endpoint |
| `nestjs`    | A NestJS app with a Terminus `/health` endpoint                   |
| `nextjs`    | A Next.js App Router app with React and Tailwind CSS              |
| `payload`   | Payload CMS on Next.js with PostgreSQL                            |
| `turborepo` | A Turborepo workspace with a Next.js app and a Payload backoffice |

Every stack is built from [`templates/base`](templates/base), which holds the shared company setup, plus its own directory under [`templates/`](templates), which holds the stack-specific files.

## What every project includes

- **Code quality:** TypeScript, ESLint and Prettier with the Next Friday configs, Vitest with coverage, fast-check, Knip, dependency-cruiser, editorconfig-checker, and sort-package-json.
- **Git hooks:** Husky runs gitleaks and lint-staged before each commit, commitlint on each message, and `pnpm check` before each push. Commits and pushes to `main` are blocked after the first one.
- **CI:** GitHub Actions run the static checks, tests with patch coverage, the build, end-to-end tests for Next.js and Payload, a container build and vulnerability scan, Semgrep, OSV-Scanner, gitleaks, TruffleHog, zizmor, and pull request title validation. Dependabot keeps dependencies current.
- **Deployment:** a `Dockerfile` that runs as the `node` user, and a Railway workflow that promotes one commit through `dev`, `uat`, and `prod`.
- **Agent rules:** shared rules in `.agents/rules`, with hooks that enforce them in Claude Code and Cursor, and a Cursor Bugbot configuration.

## Requirements

- Node.js 24.22.1, the version in the generated `.nvmrc`. The CLI itself runs on the range in [`package.json#engines`](package.json).
- pnpm: `npm install --global pnpm`. The generated project pins its pnpm version in `package.json#packageManager`.
- Git 2.28 or later.
- gitleaks 8.19 or later and jq, which the generated project's Git hooks need for the first commit.

## Options

```text
pnpm create @next-friday/app [name] [--stack nodejs|nestjs|nextjs|payload|turborepo]
```

| Option           | Description                                                                   |
| :--------------- | :---------------------------------------------------------------------------- |
| `name`           | Project directory and package name. Asked when left out.                      |
| `--stack`        | `nodejs`, `nestjs`, `nextjs`, `payload`, or `turborepo`. Asked when left out. |
| `--skip-git`     | Do not run `git init`.                                                        |
| `--skip-install` | Do not run `pnpm install`.                                                    |
| `-v, --version`  | Print the version.                                                            |
| `-h, --help`     | Print the usage.                                                              |

The name must:

- use lowercase letters, digits, `.`, `_`, or `-`, and start with a letter or digit;
- not end in `.`, and not be `node_modules`, `favicon.ico`, or a name that Windows reserves, such as `con`;
- point to a directory that does not exist or is empty, apart from `.git`.

## What the CLI does

1. Copies the template into the project directory and replaces the template's package name with the project name.
2. Writes `.env` from `.env.example`. For Payload, it sets `PAYLOAD_SECRET` to a random secret.
3. Runs `git init --initial-branch=main`, unless the directory is already in a Git repository.
4. Runs `pnpm install`, which also installs the Git hooks.
5. Prints the next steps, for example:

   ```sh
   cd my-api
   pnpm start:dev
   ```

   The development script is `pnpm dev` for Next.js and Payload, and `pnpm start:dev` for Node.js and NestJS.

Then follow **After creating a project from this template** in the project's `README.md` to make the first commit and set up the repository.

## Troubleshooting

- **`pnpm install` fails:** the CLI keeps the project and exits with 1. Fix the printed error, such as a Node.js version outside the project's `package.json#engines`, then run `pnpm install` in the project.
- **`--skip-git`:** run `git init --initial-branch=main` before `pnpm install`, so the install can set up the Git hooks.
- **`--skip-install`:** the Git hooks are not set up until you run `pnpm install`.
- **Cancelling:** Ctrl+C exits with 130. During the copy, it also removes the partly copied project.
- **Payload:** set `DATABASE_URL` in `.env` to a PostgreSQL database before you start the app.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
