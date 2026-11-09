# Plan: Follow the repository rename to create-next-friday-app

From `intent/repository-rename/spec.md` (accepted 2026-11-09 by the merge of pull request #63). Status: draft.

## Files that change

| File                                | Lines   | Change                                                                                                  |
| :---------------------------------- | :------ | :------------------------------------------------------------------------------------------------------ |
| `package.json`                      | 11      | `homepage` names `next-friday/create-next-friday-app`                                                   |
| `package.json`                      | 13      | `bugs.url` names `next-friday/create-next-friday-app`                                                   |
| `package.json`                      | 17      | `repository.url` is `git+https://github.com/next-friday/create-next-friday-app.git`                     |
| `SECURITY.md`                       | 13      | The private vulnerability reporting link names the new repository                                       |
| `.github/ISSUE_TEMPLATE/config.yml` | 4, 7    | Both Discussions links name the new repository                                                          |
| `CONTRIBUTING.md`                   | 27 – 28 | `git clone https://github.com/next-friday/create-next-friday-app.git`, then `cd create-next-friday-app` |
| `CONTRIBUTING.md`                   | 91      | The trusted publisher is `next-friday/create-next-friday-app`; workflow and environment unchanged       |

No other file changes. The lines that name the CLI command or a temporary test folder keep `create-friday-app`, as the spec's second table lists.

## Order of work

1. Start a branch from `main`.
2. Replace `next-friday/create-friday-app` with `next-friday/create-next-friday-app` on the lines above, and `cd create-friday-app` with `cd create-next-friday-app` on `CONTRIBUTING.md` line 28. These are nine lines in four files, so edit them by hand; `script-driven-changes` applies to a change across more than a few files.
3. Run `git grep -n -I "create-friday-app" -- . ':!pnpm-lock.yaml' ':!intent/'` and compare with the spec's second table.
4. Run `pnpm verify`.
5. Commit as `chore(repo): follow rename to create-next-friday-app` (`commitlint` accepts it) with no changeset (spec, "Release and the npm trusted publisher"), and open the pull request.

## Tests that prove it

- No test reads `homepage`, `bugs`, or `repository` (`grep -rn "repository\|homepage\|bugs" test/` finds only unrelated test names), and the change alters no CLI behavior. The defect a test would catch, a line still naming the old repository, is what the `git grep` in step 3 catches, so no test is added (`deterministic-testing`: "Tests stay unchanged when no proposed case survives admission").
- Step 3 lists only `package.json:27`, `knip.json:4`, `.github/workflows/ci.yml:238,274`, `test/create.test.ts:50`, `test/project-name.test.ts:9`, `test/rename.test.ts:21`, and `test/setup.test.ts:10`.
- `pnpm verify` passes. It ends with `pnpm check:publint` (`package.json` line 58), which reads the edited `package.json`.
- After the next release, the release job's provenance step succeeds and the npm page links to `create-next-friday-app`. This needs a release, so it is not part of the pull request's checks.

## Risks

- If `lean-agent-setup` lands first, it deletes `CONTRIBUTING.md` lines 88, 90, and 92 and line 91 moves. Find it by its text, `add next-friday/create-friday-app`, not by its number.
- The new npm trusted publisher connection expires on 2026-11-11 unless a release publishes before then. This change carries no changeset, so merging it does not release. The spec's open question stays with the product owner.
