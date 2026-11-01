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

1. Install gitleaks and jq (see [CONTRIBUTING.md](CONTRIBUTING.md)). Make the first commit on `main` and push it. The Git hooks allow only this first commit and push on `main`; work on branches after that.

   ```sh
   git add --all
   git commit -m "chore(repo): start from template"
   git push --set-upstream origin main
   ```

2. Add your team as the owner of every file in `.github/CODEOWNERS`, and replace the owner placeholder in `.github/zizmor.yml`.
3. Replace the template's description and owner: `package.json#description`, `repository.url`, and `author`. Change `license` from `UNLICENSED` if the project is open source.
4. In the repository settings:
   - **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**. Every workflow requests the extra permissions it needs.
   - **Advanced Security:** enable private vulnerability reporting, Dependabot alerts, Dependabot security updates, secret scanning, and push protection. `SECURITY.md` sends reporters to private vulnerability reporting.
   - **Cursor Bugbot:** enable the repository at [Bugbot](https://cursor.com/automations/from-cursor/bugbot). Bugbot reviews pull requests against the rules linked from `.cursor/BUGBOT.md`.
   - **Rules → Rulesets:** protect `main` with squash merges only, a linear history, no force pushes or deletion, and the required checks `All Checks` and `Validate pull request title`. Rulesets in a private repository need GitHub Pro, Team, or Enterprise; on GitHub Free, make the repository public or upgrade.
   - Create the `needs triage` label, which the issue forms apply: `gh label create "needs triage"`.

## Scripts

| Script            | Purpose                                                                    |
| :---------------- | :------------------------------------------------------------------------- |
| `pnpm start:dev`  | Start in watch mode from `src/main.ts`; loads `.env` when present          |
| `pnpm build`      | Compile to `dist/`                                                         |
| `pnpm start`      | Run `dist/main.js`; loads `.env` when present                              |
| `pnpm start:prod` | Run `dist/main.js`; the environment sets `PORT`                            |
| `pnpm test`       | Run tests (`src/**/*.test.ts`)                                             |
| `pnpm check`      | Run the static checks and the tests for changed code (the `pre-push` hook) |
| `pnpm verify`     | Run the static checks and all tests with coverage                          |

CI also runs the build, the container image scan, and the security scans.

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

   Limit `prod` to the `main` branch and add required reviewers. Environment secrets and variables in a private repository need GitHub Pro, Team, or Enterprise; required reviewers in a private repository need GitHub Enterprise.

3. Set the repository variable `DEPLOY_ENABLED` to `true`. Each push to `main` that passes CI then deploys to `dev`.
4. Promote with **Actions → Deploy → Run workflow**, giving the environment and the full commit SHA. The workflow requires a successful CI run on `main` for that commit and a successful deployment to the previous environment, then waits for `/health`.

Remove the workflow, `railway.json`, and the `deploy-dev` job in `ci.yml` if the project deploys elsewhere.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
