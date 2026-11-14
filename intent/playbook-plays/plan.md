# Plan: playbook plays that do not wait for monorepo apps

Accepted by: @joetakara.

## Files that change

- `templates/nextjs/AGENTS.md`, `templates/payload/AGENTS.md`, `templates/turborepo/AGENTS.md` (changed): after a change to a page, open it with the `playwright` MCP server, take a screenshot, and compare it with the mock.
- `plugins/sdlc/source/skills/sdlc-status/SKILL.md` (new): `/sdlc:sdlc-status` lists each change that is not done, its stage, its pull requests, and who acts next.
- `plugins/sdlc/source/hooks/sdlc-status.sh` and `sdlc-status.cases.json` (new), `plugins/sdlc/adapters/hooks.json` (changed): the same list from the files alone when a session starts.
- `scripts/sync-plugin.ts` (changed): a hook case may expect the exact output of a hook that adds context.
- `plugins/sdlc/README.md` (changed): the session-start hook.
- `plugins/sdlc/adapters/` and `templates/base/plugins/sdlc/` (rendered).
- `CONTRIBUTING.md` (changed): the rollback of a release.
- `templates/base/.github/workflows/plugin-evals.yml` (changed, committed by a person): a nightly run.
- `.github/workflows/release.yml` and `.github/zizmor.yml` (changed, committed by a person): a `rollback` job that points `latest` to an earlier version.
- `.changeset/<name>.md` (new): `minor`.

## Order of work

1. The patches for the files a person commits, in one issue, with their YAML parsed. Check: the person's commit matches them; actionlint and zizmor run in CI.
2. The `AGENTS.md` lines. Check: `pnpm verify` in a generated project of each stack with each deploy target.
3. The status hook and skill. Check: `pnpm plugin:check` runs the hook's cases.
4. `CONTRIBUTING.md`, the changeset, one push, and one pull request.

## Risks

- The session-start hook adds text to every session; it prints nothing when every change is done or `jq` is missing, and it never blocks.
- The rollback job needs npm 11.21.0 or later and **Allow npm dist-tag** on the trusted publisher (npm documentation, "Managing dist-tags with trusted publishing").
- Not built here, because they need `intent/monorepo-apps/spec.md`: the loop guide in `apps/docs`, `prod` from a `v*` tag, the templates' `rollback.yml`, and promotion read from Railway's history. Requirements 10 and 14 stay open for them.
- Departure: the status skill is named `sdlc-status`, beside the plugin's other `sdlc-*` skills, in place of the spec's `loop-status`.

## Proof

- 2–4, 8, 9, 11–13: built before this plan, or replaced by the `sdlc` plugin; the audit for pull request #234 found each in the tree.
- 1, 5: not checked by that audit and not changed by this plan.
- 6: the line in the three `AGENTS.md` files.
- 7: the `schedule` in `plugin-evals.yml`, linted by CI.
- 10: in the root, the `rollback` job in `release.yml` and the procedure in `CONTRIBUTING.md`; the templates' part waits for monorepo apps.
- 14: `pnpm plugin:check` runs `sdlc-status.cases.json` for the reminder, and `/sdlc:sdlc-status` is the status skill; the loop guide waits for monorepo apps.
