# Agent guide

Node.js HTTP service on pnpm, without a framework. Source lives in `src/`.

- Follow the rules in `.agents/rules/`; `.agents/rules.json` gives each rule's scope. Claude Code and Cursor load them automatically.
- Rule files, agent hooks, and agent settings are company policy: propose a change to the user, who edits them.
- Put tests next to the code as `*.test.ts`.
- Read configuration from environment variables and fail when one is missing; document each variable in `.env.example`.
