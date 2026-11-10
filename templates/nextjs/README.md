# next-friday-template-nextjs

Next Friday starter for Next.js applications.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Next Friday Next.js template` text in `app/layout.tsx`, `app/page.tsx`, and their tests.

## Scripts

| Script          | Purpose                                                                                                           |
| :-------------- | :---------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`      | Start the development server                                                                                      |
| `pnpm build`    | Build for production                                                                                              |
| `pnpm start`    | Serve the standalone production build after `pnpm build`. The build copies `.env`, so rebuild after you change it |
| `pnpm test`     | Run unit tests                                                                                                    |
| `pnpm test:e2e` | Run Playwright end-to-end tests (`test/**/*.e2e.test.ts`)                                                         |
| `pnpm check`    | Run the static checks, the unit tests for changed code, and the production build (the `pre-push` hook)            |
| `pnpm verify`   | Run the static checks, all unit tests with coverage, and the production build                                     |

CI also runs the build, the end-to-end tests, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

## Container

The `Dockerfile` builds a standalone production image that runs as the `node` user, for platforms such as Railway. The server listens on `PORT`, or 3000 when it is unset.

```sh
docker build -t app .
docker run --publish 3000:3000 app
```

On Vercel, deploy without the image; the Next.js preset takes precedence over the `Dockerfile`.

## Deploy

`.github/workflows/deploy.yml` deploys the `Dockerfile` to Railway and promotes one commit through `dev`, `uat`, and `prod`. `railway.json` sets the Railway health check to `/health`. The workflow stays off until you configure it:

1. In Railway, create a project with one service for this repository and the environments `dev`, `uat`, and `prod`. The workflow passes these names to `railway up --environment`. Create one project token per environment under **Project Settings → Tokens**.
2. In GitHub, create the `dev`, `uat`, and `prod` environments under **Settings → Environments**, and add to each:
   - the `RAILWAY_TOKEN` secret: that environment's project token;
   - the `RAILWAY_SERVICE` variable: the service name;
   - the `APP_URL` variable: the public `https://` URL.

   Limit `dev`, `uat`, and `prod` to the `main` branch. Add the release managers as required reviewers on `prod` only; `dev` deploys on every push to `main`, so a reviewer there would hold each push. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health`.

Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
