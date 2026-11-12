# Roll back a deployment

Returns production to the commit it ran before the current one.

**Who runs it:** a release manager. It is a production action: the `prod` environment's required reviewers approve the run, and an agent reports the command but never runs it.

## Command

```sh
gh workflow run deploy.yml --ref main --field environment=prod --field commit_sha=<previous commit SHA>
```

`.github/workflows/deploy.yml` accepts any commit that is on `main`, has a successful CI run on `main`, and has a successful deployment to `uat`. A commit that ran in production before meets all three. The workflow checks out that commit, deploys it with `railway up`, and waits for `/health`.

Find the previous commit SHA in the deploy workflow's run history: the second most recent successful run titled `Deploy <SHA> to prod`.

```sh
gh run list --workflow deploy.yml --branch main --status success --json displayTitle --jq '[.[] | select(.displayTitle | endswith(" to prod"))][1].displayTitle | split(" ")[1]'
```

## Rehearse

Run the same command with `environment=uat` and the commit SHA that `uat` ran before its current one, then check that `/health` answers on the `uat` URL. The `uat` run needs a successful `dev` deployment of that commit. Rehearse after each change to `deploy.yml`, and on a regular schedule.

## After the rollback

Check that `/health` answers on the production URL, then open an intent for the fault that caused the rollback.
