#!/usr/bin/env bash
set -euo pipefail
git init -q -b main
git config user.name "Eval Author"
git config user.email "eval@example.invalid"
mkdir -p .github src/health
cat > AGENTS.md << 'AGENTS'
# Agent guide

## Verifying your work

- Test: `pnpm test`
- Lint: `pnpm lint:check`
AGENTS
cat > .github/pull_request_template.md << 'TEMPLATE'
## What changed and why

## Checks
TEMPLATE
cat > package.json << 'PACKAGE'
{
  "name": "eval-service",
  "private": true,
  "scripts": {
    "start:dev": "nest start --watch"
  }
}
PACKAGE
cat > src/health/health.controller.ts << 'CONTROLLER'
import {Controller, Get} from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {status: "ok"};
  }
}
CONTROLLER
git add -A
git commit -q -m "chore: add service"
remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git push -q origin --all
