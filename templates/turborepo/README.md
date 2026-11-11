# next-friday-template-turborepo

Next Friday starter for a Turborepo workspace. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on port 3001. The backoffice API is REST at `/api`.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

The CLI created `.env` from `.env.example` and set `PAYLOAD_SECRET` to a random secret. Before `pnpm dev`, set in `.env`:

- `DATABASE_URL`: a PostgreSQL database.
- `APP_URL`: the URL you open the backoffice at, such as `http://localhost:3001`.
- `PAYLOAD_SECRET`, only if you recreate `.env` from `.env.example`: generate one with `openssl rand -hex 32`.

Then open `http://localhost:3000` for the site and `http://localhost:3001/admin` to create the first user.

**Warning:** until the first user exists, anyone who can reach the backoffice `/admin` can create it. Create the first user in each deployed environment right after its first deploy, before you share the URL.

In development, Payload applies collection changes to the database directly. In production, the server applies the migrations in `apps/backoffice/src/migrations/` when it starts.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Next Friday Next.js template` text in `apps/app/app/layout.tsx`, `apps/app/app/page.tsx`, and their tests, and the `Next Friday Payload template` text in `apps/backoffice/src/app/(frontend)/layout.tsx`, `apps/backoffice/src/app/(frontend)/page.tsx`, and their tests.

## Scripts

| Script                    | Purpose                                                                                                |
| :------------------------ | :----------------------------------------------------------------------------------------------------- |
| `pnpm dev`                | Start the Next.js app on port 3000 and the Payload backoffice on port 3001                             |
| `pnpm build`              | Build both apps for production                                                                         |
| `pnpm start`              | Serve both standalone production builds after `pnpm build`                                             |
| `pnpm test`               | Run unit tests in both apps                                                                            |
| `pnpm test:e2e`           | Run Playwright end-to-end tests in both apps. The backoffice uses the database in `DATABASE_URL`       |
| `pnpm generate:types`     | Regenerate `apps/backoffice/src/payload-types.ts` after a collection change                            |
| `pnpm generate:importmap` | Regenerate the admin import map after adding a custom component                                        |
| `pnpm migrate:create`     | Create a migration from collection changes, for example `pnpm migrate:create add-posts`                |
| `pnpm migrate`            | Apply pending migrations to the database in `DATABASE_URL`                                             |
| `pnpm check`              | Run the static checks, the unit tests for changed code, and the production build (the `pre-push` hook) |
| `pnpm verify`             | Run the static checks, all unit tests with coverage, and the production build                          |

CI also runs the build, the end-to-end tests, the container image scans, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`. Pull requests run Turborepo with `--affected` against the base branch, so only packages that changed are typed, tested, built, and scanned. Pushes to `main` and the weekly schedule still run every app. Patch coverage runs only for apps that produced a coverage file.

To reuse task output across CI runs, create a Vercel team, add the repository variable `TURBO_TEAM`, and follow [Turborepo on GitHub Actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) to allow OIDC. The workflow exchanges GitHub OIDC for a short-lived Remote Cache token. If OIDC is unavailable, set the `TURBO_TOKEN` secret instead. Leave both unset to run without a Remote Cache.

## Container

Each app has a Dockerfile. Build both from the workspace root. The images run as the `node` user. The app listens on `PORT`, or 3000 when it is unset. The backoffice listens on `PORT`, or 3000 when it is unset, and needs `DATABASE_URL`, `PAYLOAD_SECRET`, and `APP_URL`.

```sh
docker build --file apps/app/Dockerfile --tag app .
docker build --file apps/backoffice/Dockerfile --tag backoffice .
docker run --publish 3000:3000 app
docker run --publish 3001:3001 --env PORT=3001 --env DATABASE_URL --env PAYLOAD_SECRET --env APP_URL backoffice
```

Uploaded images, up to 10 MB each, are written to the backoffice container filesystem, which a redeploy discards. Add a Payload storage adapter, for example `@payloadcms/storage-s3`, before storing media in production.

On Vercel, deploy an app without its image. The Next.js preset takes precedence over the Dockerfile.

## Deploy

`.github/workflows/deploy.yml` deploys both apps and promotes one commit through `dev`, `uat`, and `prod`. `railway.json` sets the Railway health check to `/health`. Create one Railway service per app, with that service's Dockerfile path set to `apps/app/Dockerfile` or `apps/backoffice/Dockerfile`. The workflow stays off until you configure it:

1. In Railway, create a project with one service for each app, one PostgreSQL database for the backoffice, and the environments `dev`, `uat`, and `prod`. The workflow passes these names to `railway up --environment`. In each backoffice environment, set the service variables:
   - `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`;
   - `PAYLOAD_SECRET` to a separate long random string;
   - `APP_URL` to that environment's public backoffice `https://` URL.

   Create one project token per environment under **Project Settings → Tokens**. CI tests against PostgreSQL 17; change the image in `ci.yml` if the database runs another major version.

2. In GitHub, create the `dev`, `uat`, and `prod` environments under **Settings → Environments**, and add to each:
   - the `RAILWAY_TOKEN` secret: that environment's project token;
   - the `RAILWAY_SERVICE_APP` variable: the Next.js service name;
   - the `RAILWAY_SERVICE_BACKOFFICE` variable: the Payload service name;
   - the `APP_URL` variable: the public Next.js `https://` URL;
   - the `BACKOFFICE_URL` variable: the public backoffice `https://` URL.

   Limit `dev`, `uat`, and `prod` to the `main` branch. Add the release managers as required reviewers on `prod` only; `dev` deploys on every push to `main`, so a reviewer there would hold each push. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`. The workflow compares the commit with the last GitHub deployment to that environment and runs `railway up` only for services whose packages changed. A promotion through `uat` or `prod` uses the same comparison against the commit last deployed there, so several commits still ship every changed service. The first deploy to an environment ships both services.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health` on each service it uploaded.

Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere.

## Mobile app

The template does not ship an Expo app. Add one under `apps/mobile` when you need it:

1. Create the app from the workspace root with `pnpm create expo-app@latest apps/mobile`, then add `packages/*` workspace packages as you share code. Keep `eas.json` and `credentials.json` inside `apps/mobile` and run the EAS CLI from that directory ([Expo: Build with monorepos](https://docs.expo.dev/build-reference/build-with-monorepos/)).
2. Use `@expo/fingerprint` with `expo-github-action/fingerprint` so a pull request requests a native build only when the native layer changed ([Expo fingerprint](https://docs.expo.dev/versions/latest/sdk/fingerprint/)).
3. Keep a single `react-native` version in the workspace. Duplicate React Native versions in one monorepo are not supported ([Expo: Monorepos](https://docs.expo.dev/guides/monorepos/)).

EAS Build and Submit replace Railway for that app. CI `--affected` already includes `apps/*` and `packages/*`, so an Expo app is skipped when it did not change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
