---
paths:
  - ".agents/rules/**"
  - ".agents/rules.json"
  - ".agents/hooks/**"
  - ".claude/settings.json"
  - ".claude/rules/**"
  - ".cursor/rules/**"
  - ".cursor/hooks/**"
  - ".cursor/hooks.json"
  - "scripts/sync-agent-rules.ts"
  - "scripts/check-agent-gates.ts"
  - ".husky/**"
  - ".commitlintrc.json"
  - "prettier.config.ts"
  - "eslint.config.ts"
  - ".lintstagedrc.json"
  - ".gitleaks.toml"
---

# Constitution Changes

The constitution is the set of files that agent settings deny to agents: rules, hooks, lint, format, and commit configuration, and the agent settings themselves. It is company policy.

A developer changes the constitution through a dedicated issue, never inside a feature pull request. When a task needs a constitution change, propose it to the user, reference that issue, and wait for it to merge before the task depends on it.
