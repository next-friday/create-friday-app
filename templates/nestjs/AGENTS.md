# Agent guide

NestJS service on pnpm. Source lives in `src/`, end-to-end tests in `test/`.

- Follow the rules in `.agents/rules/`; `.agents/rules.json` gives each rule's scope. Claude Code and Cursor load them automatically.
- Rule files, agent hooks, and agent settings are company policy: propose a change to the user, who edits them.
- Put unit tests next to the code as `*.test.ts`; put end-to-end tests in `test/` as `*.e2e.test.ts`.
- Read configuration from environment variables and fail when one is missing; document each variable in `.env.example`.
