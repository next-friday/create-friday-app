# next-friday-template-turborepo

Next Friday starter for a Turborepo workspace. `apps/app` is a Next.js site on port 3000. `apps/backoffice` is a Payload CMS on port 3001. The REST API is `/api` on the backoffice. GraphQL is disabled.

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

1. Install gitleaks and jq (see [CONTRIBUTING.md](CONTRIBUTING.md)). Make the first commit on `main` and push it. The Git hooks allow only this first commit and push on `main`; work on branches after that.

   ```sh
   git add --all
   git commit -m "chore(repo): start from template"
   git push --set-upstream origin main
   ```

2. Add your team as the owner of every file in `.github/CODEOWNERS`, and replace the owner placeholder in `.github/zizmor.yml`.
3. Replace the template's description and owner: `package.json#description`, `repository.url`, and `author`, and the `Next Friday Next.js template` text in `apps/app/app/layout.tsx`, `apps/app/app/page.tsx`, and their tests, and the `Next Friday Payload template` text in `apps/backoffice/src/app/(frontend)/layout.tsx`, `apps/backoffice/src/app/(frontend)/page.tsx`, and their tests. Change `license` from `UNLICENSED` if the project is open source.
4. In the repository settings:
   - **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**. Every workflow requests the extra permissions it needs.
   - **Advanced Security:** enable private vulnerability reporting, Dependabot alerts, Dependabot security updates, secret scanning, and push protection. `SECURITY.md` sends reporters to private vulnerability reporting.
   - **Cursor Bugbot:** enable the repository at [Bugbot](https://cursor.com/automations/from-cursor/bugbot). Bugbot reviews pull requests against the rules linked from `.cursor/BUGBOT.md`.
   - **Rules → Rulesets:** protect `main` with squash merges only, a linear history, no force pushes or deletion, and the required checks `All Checks` and `Validate pull request title`. Rulesets in a private repository need GitHub Pro, Team, or Enterprise; on GitHub Free, make the repository public or upgrade.
   - Create the `needs triage` label, which the issue forms apply: `gh label create "needs triage"`.

## Scripts

| Script                    | Purpose                                                                                          |
| :------------------------ | :----------------------------------------------------------------------------------------------- |
| `pnpm dev`                | Start the Next.js app on port 3000 and the Payload backoffice on port 3001                       |
| `pnpm build`              | Build both apps for production                                                                   |
| `pnpm start`              | Serve both standalone production builds after `pnpm build`                                       |
| `pnpm test`               | Run unit tests in both apps                                                                      |
| `pnpm test:e2e`           | Run Playwright end-to-end tests in both apps. The backoffice uses the database in `DATABASE_URL` |
| `pnpm generate:types`     | Regenerate `apps/backoffice/src/payload-types.ts` after a collection change                      |
| `pnpm generate:importmap` | Regenerate the admin import map after adding a custom component                                  |
| `pnpm migrate:create`     | Create a migration from collection changes, for example `pnpm migrate:create add-posts`          |
| `pnpm migrate`            | Apply pending migrations to the database in `DATABASE_URL`                                       |
| `pnpm check`              | Run the static checks and the unit tests for changed code (the `pre-push` hook)                  |
| `pnpm verify`             | Run the static checks and all unit tests with coverage                                           |

CI also runs the build, the end-to-end tests, the container image scans, and the security scans.

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

`.github/workflows/deploy.yml` deploys the `Dockerfile` Railway finds for one service and promotes one commit through `dev`, `uat`, and `prod`. `railway.json` sets the Railway health check to `/health`. Create one Railway service per app, with that service's Dockerfile path set to `apps/app/Dockerfile` or `apps/backoffice/Dockerfile`. The workflow stays off until you configure it:

1. In Railway, create a project with one service for each app, one PostgreSQL database for the backoffice, and the environments `dev`, `uat`, and `prod`. The workflow passes these names to `railway up --environment`. In each backoffice environment, set the service variables:
   - `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`;
   - `PAYLOAD_SECRET` to a separate long random string;
   - `APP_URL` to that environment's public `https://` URL.

   Create one project token per environment under **Project Settings → Tokens**. CI tests against PostgreSQL 17; change the image in `ci.yml` if the database runs another major version.

2. In GitHub, create the `dev`, `uat`, and `prod` environments under **Settings → Environments**, and add to each:
   - the `RAILWAY_TOKEN` secret: that environment's project token;
   - the `RAILWAY_SERVICE` variable: the service name;
   - the `APP_URL` variable: the public `https://` URL.

   Limit `prod` to the `main` branch and add required reviewers. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health`.

Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
