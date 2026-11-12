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
mkdir -p "$(dirname 'src/version.ts')"
cat > 'src/version.ts' << 'EOF'
export function parseVersion(input: string): string {
  const parts = input.split(".");
  const major = parts[0];
  const minor = parts.length === 3 ? parts[1] : Number(parts[2]);
  const patch = parts[2] ?? "0";

  return `${major}.${minor}.${patch}`;
}
EOF
mkdir -p "$(dirname 'test/version.test.ts')"
cat > 'test/version.test.ts' << 'EOF'
import {expect, it} from "vitest";
import {parseVersion} from "../src/version.ts";

it("keeps a three-part version", () => {
  expect(parseVersion("1.2.3")).toBe("1.2.3");
});
EOF
git add -A
git commit -q -m "fix: add parseVersion"
