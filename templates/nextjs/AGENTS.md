# Agent guide

Next.js App Router application on pnpm. Routes live in `app/`.

- Follow the rules in `.agents/rules/`; `.agents/rules.json` gives each rule's scope. Claude Code and Cursor load them automatically.
- Rule files, agent hooks, and agent settings are company policy: propose a change to the user, who edits them.
- Put unit tests next to the code as `*.test.ts`; put Playwright end-to-end tests in `test/` as `*.e2e.test.ts`. Component tests need a DOM test environment, which is not set up yet; ask the user before adding one.
- Read configuration from environment variables and fail when one is missing; document each variable in `.env.example`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
