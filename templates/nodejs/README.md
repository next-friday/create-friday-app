# next-friday-template-nodejs

Next Friday starter for Node.js HTTP services without a framework.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm start:dev
```

The server listens on the port set by `PORT` in `.env`, which the CLI created from `.env.example`.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC.

## Scripts

| Script            | Purpose                                                                                           |
| :---------------- | :------------------------------------------------------------------------------------------------ |
| `pnpm start:dev`  | Start in watch mode from `src/main.ts`; loads `.env` when present                                 |
| `pnpm build`      | Compile to `dist/`                                                                                |
| `pnpm start`      | Run `dist/main.js`; loads `.env` when present                                                     |
| `pnpm start:prod` | Run `dist/main.js`; the environment sets `PORT`                                                   |
| `pnpm test`       | Run tests (`src/**/*.test.ts`)                                                                    |
| `pnpm check`      | Run the static checks, the tests for changed code, and the production build (the `pre-push` hook) |
| `pnpm verify`     | Run the static checks, all tests with coverage, and the production build                          |

CI also runs the build, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

## Container

The `Dockerfile` builds a production image that runs as the `node` user. The platform must set `PORT`; Railway sets it automatically.

```sh
docker build -t app .
docker run --env PORT=3000 --publish 3000:3000 app
```

## Deploy

`.github/workflows/deploy.yml` deploys the `Dockerfile` to Railway and promotes one commit through `dev`, `uat`, and `prod`. `railway.json` sets the Railway health check to `/health`. The workflow stays off until you configure it:

1. In Railway, create a project with one service for this repository and the environments `dev`, `uat`, and `prod`. The workflow passes these names to `railway up --environment`. Create one project token per environment under **Project Settings → Tokens**.
2. In GitHub, create the `dev`, `uat`, and `prod` environments under **Settings → Environments**, and add to each:
   - the `RAILWAY_TOKEN` secret: that environment's project token;
   - the `RAILWAY_SERVICE` variable: the service name;
   - the `APP_URL` variable: the public `https://` URL.

   Limit `dev`, `uat`, and `prod` to the `main` branch and add required reviewers. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health`.

Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
