---
"@next-friday/create-app": minor
---

Generated projects get back the playbook plays removed in 5.0.0: the `Agent evals` and `Claude` workflows, the `Triage failed build` job in `ci.yml`, `evals/`, and `lessons/`. They call the Claude API with the `ANTHROPIC_API_KEY` secret instead of workload identity federation. `scripts/deploy-rollback.sh` rolls `uat` or `prod` back to the previous successful commit, and `agent-production-gate.sh` now blocks the template's own production deploys and rollbacks until `RELEASE_APPROVAL` is set.
