# next-friday-template-payload

Payload CMS application on Next.js and PostgreSQL. The API is REST at `/api`.

## Getting started

```sh
npm install --global pnpm
pnpm install
pnpm dev
```

The CLI created `.env` from `.env.example` and set `PAYLOAD_SECRET` to a random secret. Before `pnpm dev`, set in `.env`:

- `DATABASE_URL`: a PostgreSQL database.
- `APP_URL`: the URL you open the app at, such as `http://localhost:3000`.
- `PAYLOAD_SECRET`, only if you recreate `.env` from `.env.example`: generate one with `openssl rand -hex 32`.

Then open `http://localhost:3000/admin` to create the first user.

**Warning:** until the first user exists, anyone who can reach `/admin` can create it. Create the first user in each deployed environment right after its first deploy, before you share the URL.

In development, Payload applies collection changes to the database directly. In production, Payload applies the migrations in `src/migrations/` when it first initialises, which `/health` triggers, so the first health check after a deploy applies them and fails while the database is unreachable.

## After creating a project from this template

Follow [SETUP.md](SETUP.md) in order. It sets up the repository, the reviews, and the AI-native SDLC. In step 1, also replace the `Payload application` text in `src/app/(frontend)/layout.tsx`, `src/app/(frontend)/page.tsx`, and `src/app/(frontend)/page.test.ts`.

## Scripts

| Script                    | Purpose                                                                                                           |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                | Start the development server                                                                                      |
| `pnpm build`              | Build for production                                                                                              |
| `pnpm start`              | Serve the standalone production build after `pnpm build`. The build copies `.env`, so rebuild after you change it |
| `pnpm test`               | Run unit tests                                                                                                    |
| `pnpm test:e2e`           | Run Playwright end-to-end tests (`test/**/*.e2e.test.ts`) against the database in `DATABASE_URL`                  |
| `pnpm generate:types`     | Regenerate `src/payload-types.ts` after a collection change                                                       |
| `pnpm generate:importmap` | Regenerate the admin import map after adding a custom component                                                   |
| `pnpm migrate:create`     | Create a migration from collection changes, for example `pnpm migrate:create add-posts`                           |
| `pnpm migrate`            | Apply pending migrations to the database in `DATABASE_URL`                                                        |
| `pnpm check`              | Run the static checks, the unit tests for changed code, and the production build (the `pre-push` hook)            |
| `pnpm verify`             | Run the static checks, all unit tests with coverage, and the production build                                     |

`pnpm build` copies `.env` into `.next/standalone`, where every secret sits in plain text. Keep that folder out of images and archives.

CI also runs the build, the end-to-end tests, the container image scan, and the security scans, including CodeQL, dependency review, and OpenSSF Scorecard. CodeQL, dependency review, and Scorecard run on public repositories, and on private ones when the `CODE_SCANNING` repository variable is `true`.

## Container

The `Dockerfile` builds a standalone production image that runs as the `node` user for a container platform. The server listens on `PORT`, or 3000 when it is unset, and needs `DATABASE_URL`, `PAYLOAD_SECRET`, and `APP_URL`, the public URL that Payload accepts cookie-authenticated and cross-origin requests from.

```sh
docker build -t app .
docker run --publish 3000:3000 --env DATABASE_URL --env PAYLOAD_SECRET --env APP_URL app
```

Uploaded images, up to 10 MB each, are written to the container filesystem, which a redeploy discards. Add a Payload storage adapter, for example `@payloadcms/storage-s3`, before storing media in production.

The config sets no `email` adapter, so Payload writes every email, including password-reset links, to the server log. Set `email` in `src/payload.config.ts` before production.

On Vercel, deploy without the image; the Next.js preset takes precedence over the `Dockerfile`.

<!-- deploy:railway -->

## Deploy

`.github/workflows/deploy.yml` deploys the `Dockerfile` to Railway and promotes one commit through `dev`, `uat`, and `prod`. `railway.json` sets the Railway health check to `/health`. The workflow stays off until you configure it:

1. In Railway, create a project with one service for this repository, one PostgreSQL database, and the environments `dev`, `uat`, and `prod`. The workflow passes these names to `railway up --environment`. In each environment, set the service variables:
   - `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`;
   - `PAYLOAD_SECRET` to a separate long random string;
   - `APP_URL` to that environment's public `https://` URL.

   Create one project token per environment under **Project Settings → Tokens**. CI tests against PostgreSQL 17; change the image in `ci.yml` if the database runs another major version.

2. In GitHub, create the `dev`, `uat`, and `prod` environments under **Settings → Environments**, and add to each:
   - the `RAILWAY_TOKEN` secret: that environment's project token;
   - the `RAILWAY_SERVICE` variable: the service name;
   - the `APP_URL` variable: the public `https://` URL.

   Limit `dev`, `uat`, and `prod` to the `main` branch. Add the release managers as required reviewers on `prod` only; `dev` deploys on every push to `main`, so a reviewer there would hold each push. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health`.

<!-- deploy:end -->

<!-- deploy:none -->

## Deploy

The project has no deploy step yet. A deploy step needs:

- a workflow under `.github/workflows/` that deploys;
- the `prod` environment under **Settings → Environments**, with the release managers as its required reviewers;
- the image the `Dockerfile` builds.

<!-- deploy:end -->

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
