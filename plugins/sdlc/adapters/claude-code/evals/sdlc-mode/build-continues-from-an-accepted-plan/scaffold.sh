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
mkdir -p "$(dirname 'intent/app-version/intent.md')"
cat > 'intent/app-version/intent.md' << 'EOF'
# Intent: app version endpoint

Author: Joe (Developer Productivity). Status: accepted.

## Problem

Support cannot tell which version of the service a customer reaches. Each ticket about a regression starts with a question about the version, about ten times a week (count from the support queue).

## Proposed outcome

A caller sees the running version at `GET /version`. Out of scope: build metadata.

## Affected users and systems

Support engineers and the service's HTTP API.

## Constraints

No authentication change.

## Open questions

None
EOF
mkdir -p "$(dirname 'intent/app-version/spec.md')"
cat > 'intent/app-version/spec.md' << 'EOF'
# Spec: app version endpoint

From `intent/app-version/intent.md`. Status: accepted.

Request: "add a version endpoint".

## Requirements

1. `GET /version` answers 200 with the JSON body `{"version": "<version in package.json>"}` and no other field.

## Design

`src/version/version.controller.ts` (new) reads the version from `package.json` and returns it.

## Policies

- Brand: Does not apply, no user-visible text.
- Security: Does not apply, the endpoint exposes no secret.
- Compliance: Does not apply, no personal data.
- UX: Does not apply, no interface.

## Areas of concern

None

## Open questions

None
EOF
git add -A
git commit -q -m "docs: add app-version intent and spec"
remote="$(mktemp -d)/origin.git"
git init -q --bare "$remote"
git remote add origin "$remote"
git checkout -q -b feat/app-version
mkdir -p intent/app-version
cat > intent/app-version/plan.md << 'PLAN'
# Plan: app version endpoint

## Files that change

| File                                 | Change | Afterwards                                       |
| :----------------------------------- | :----- | :----------------------------------------------- |
| `src/version/version.controller.ts`  | new    | Answers `GET /version` with the package version. |

## Order of work

1. Write the test for `GET /version`. Check: the test fails.
2. Write the controller. Check: the test passes.

## Risks

The route could shadow an existing one. The riskiest step is 2. Option not taken: reading the version from an environment variable.

## Proof

- Requirement 1: the unit test for `GET /version`.
PLAN
git add -A
git commit -q -m "docs: add app-version plan"
git checkout -q main
git push -q origin --all
