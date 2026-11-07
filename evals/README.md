# Agent evals

Each eval is one real task from recent work with its accepted outcome, written as `evals/<name>.json`: the prompt, plus the check that defines an acceptable result.

```json
{
  "prompt": "<the task, as a person would ask it>",
  "check": "<a shell command that exits 0 when the result is acceptable, for example: pnpm test>"
}
```

- Collect 20 to 50 real tasks from recent work.
- `.github/workflows/agent-evals.yml` runs the suite every night, and on every pull request that changes `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `.agents/`, `.claude/`, `.cursor/`, or `evals/`. `evals/check.sh` checks one eval's result.
- Set the repository variable `EVALS_MIN_PASS_RATE`, from 0 to 100. When the pass rate falls below it, the `Agent evals` check fails and the pull request cannot merge.
- Each production incident gets an eval, written by the team that owned the incident, and it stays in the suite.
