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
mkdir -p "$HOME/.claude/rules"
cat > "$HOME/.claude/rules/sdlc-models.md" << 'MODELS'
# SDLC models

budget: large (xhigh)
main: sonnet xhigh
explore: opus xhigh
advise: haiku low
MODELS
git add -A
git commit -q -m "chore: add project"
