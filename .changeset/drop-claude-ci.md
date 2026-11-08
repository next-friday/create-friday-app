---
"@next-friday/create-app": major
---

Generated projects no longer call the Claude API from GitHub Actions, so they need no workload identity federation or repository variables. The `Claude` and `Agent evals` workflows, the `Triage failed build` job in `ci.yml`, `evals/`, and `lessons/` are removed, and `SETUP.md` drops their steps. Claude Code Review still reviews pull requests from the Claude GitHub App.
