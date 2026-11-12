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
git checkout -q -b docs/dark-mode-intent
mkdir -p "$(dirname 'intent/dark-mode/intent.md')"
cat > 'intent/dark-mode/intent.md' << 'EOF'
# Intent: dark mode

Author: Joe (Developer Productivity). Status: draft.

## Problem

Users who work at night find the white interface tiring.

## Proposed outcome

A dark theme that follows the system setting.

## Affected users and systems

All users of the interface.

## Constraints

None

## Open questions

None
EOF
git add -A
git commit -q -m "docs: add dark-mode intent"
git checkout -q main
remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git push -q origin --all
