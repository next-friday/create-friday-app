#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
mkdir -p .github
cat > AGENTS.md << 'EOF'
# Agent guide

## Verifying your work

- Test: `pnpm test`
- Lint: `pnpm lint:check`
EOF
cat > .github/pull_request_template.md << 'EOF'
## What changed and why

## Checks
EOF
cat > package.json << 'EOF'
{
  "name": "eval-project",
  "private": true,
  "scripts": {
    "verify": "pnpm lint:check && pnpm knip && pnpm test"
  }
}
EOF
cat > knip.json << 'EOF'
{
  "ignore": ["templates/**"]
}
EOF
git add -A
git commit -q -m "chore: add project"
