---
"@next-friday/create-app": minor
---

A generated project holds the `sdlc` plugin's eval cases under `plugins/sdlc/claude-code/evals/`, and `SETUP.md` step 8 describes the `Plugin evals` workflow, which runs them on a pull request that changes the plugin or `.agents/` once `CLAUDE_CI_ENABLED` is `true`, with the pass threshold and cost ceiling in the repository variables `EVAL_PASS_THRESHOLD` and `EVAL_MAX_COST_USD`.
