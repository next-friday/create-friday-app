#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
mkdir -p .github/workflows
cat > AGENTS.md << 'AGENTS'
# Agent guide

## Verifying your work

- Test: `pnpm test`
AGENTS
cat > package.json << 'PACKAGE'
{
  "name": "eval-project",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
PACKAGE
cat > .github/workflows/deploy.yml << 'WORKFLOW'
name: Deploy
on:
  workflow_dispatch:
jobs:
  deploy:
    if: ${{ vars.DEPLOY_ENABLED == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
WORKFLOW
git add -A
git commit -q -m "chore: add project"
remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git push -q origin --all
