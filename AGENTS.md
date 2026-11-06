# Agent guide

CLI that generates Next Friday projects. Source lives in `src/`. Tests live in `test/`. Each stack is `templates/base` plus `templates/<stack>`.

- Follow the rules in `.agents/rules/`. `.agents/rules.json` gives each rule's scope. Claude Code and Cursor load them.
- Edit source under `src/`, tests under `test/`, and templates under `templates/`.
- `templates/` is the consumer kit. Root rules and hooks are this repository's own copies. Do not link the two trees together.
- Preserve CLI arguments, prompts, and the generated project layout unless the change declares a breaking contract.
- Treat `dist/` as generated output.
- `base` holds files every stack uses with the same content. A stack directory holds files whose content differs. No path exists in both.
- After changing a template, generate a project and run that project's `pnpm verify`.
