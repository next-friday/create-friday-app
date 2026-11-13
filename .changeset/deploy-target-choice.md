---
"@next-friday/create-app": minor
---

The CLI takes `--deploy railway|none`, the deploy target. The default is `none`: a new project holds the `Dockerfile` and no deploy workflow, no `railway.json`, no rollback runbook, and no `deploy-dev` job, and its README says what a deploy step needs. Pass `--deploy railway` for the files a project got before. Set the repository variable `CONTAINER_IMAGE` to `false` to skip the CI job that builds and scans the container image.
