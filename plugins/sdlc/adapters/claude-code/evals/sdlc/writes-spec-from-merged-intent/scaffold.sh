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
mkdir -p "$(dirname 'intent/csv-export/intent.md')"
cat > 'intent/csv-export/intent.md' << 'EOF'
# Intent: csv export

Author: Joe (Developer Productivity). Status: accepted.

## Problem

The accounting team of 12 copies the report table into Excel by hand at every month end, about 20 minutes each (figure from the accounting lead).

## Proposed outcome

One button downloads the open report as a CSV file. Out of scope: PDF and Excel export.

## Affected users and systems

The accounting team and the report page.

## Constraints

Report access rights do not change.

## Open questions

None
EOF
git add -A
git commit -q -m "docs: add csv-export intent"
