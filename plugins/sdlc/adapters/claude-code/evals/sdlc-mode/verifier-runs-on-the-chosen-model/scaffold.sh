#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
cat > AGENTS.md << 'AGENTS'
# Agent guide

## Verifying your work

- Test: `pnpm test`
AGENTS
mkdir -p .agents
cat > .agents/sdlc-models.md << 'MODELS'
# SDLC models

budget: large (xhigh)
build: sonnet xhigh
review: sonnet xhigh
verify: opus xhigh
evals: haiku xhigh
MODELS
git add -A
git commit -q -m "chore: add project"
