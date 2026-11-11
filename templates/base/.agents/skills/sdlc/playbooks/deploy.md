# Deploy phase: take a merged change to the production gate

The agent may act up to the production gate and cannot pass it.

1. Find the commit: the full SHA on the default branch that the request names, or the latest commit there. Read its CI run. When a check failed or is still running, say which one in two lines and stop.
2. Read how this project deploys: the deploy section of `README.md` and `.github/workflows/deploy.yml`. When the project has no deploy workflow, or deploying is switched off, say so in two lines and stop.
3. Report where the commit is. For each environment, in the order the project promotes them, say whether this commit is deployed there, and give the deployment's link or the command output that shows it.
4. Promote the commit to an environment before production only when the request asks for that environment. Do it the way `README.md` says, one environment at a time, and read the health check after each. When a deployment fails, stop: report the failing step and its log, and promote no further.
5. **Gate: the release manager authorizes production.** Never start a production deployment, run a command that names the production environment, or push a release tag. Report the commit's SHA, the environments it has passed, the checks' results, and the exact action the release manager takes to promote it. Then wait.

**Next:** `.agents/skills/sdlc/playbooks/maintain.md`; a job or a person; when monitoring or a ticket reports a finding in production.
