# Plan: Follow the repository rename to next-friday-create-app

From `intent/repository-rename/intent.md` and `intent/repository-rename/spec.md` (both accepted).

Engineer: Joe Takara, who accepts this plan in a plan-mode session (playbook page 19, steps 1–6; page 20, "the plan is logged … along with who accepted it").

## Context

The GitHub repository was renamed from `next-friday/create-friday-app` to `next-friday/next-friday-create-app`. npm trusted publishing requires `repository.url` to "exactly match your GitHub repository", and the npm owner already replaced the trusted publisher connection, which expires unless a release publishes within 2 days (spec, **Release and the npm trusted publisher**). Links in the repository still point at the old name.

## Files that change

`git grep -n -I "create-friday-app" origin/main -- . ':!pnpm-lock.yaml' ':!intent/'` at `dfac1fc` returns exactly the lines the spec lists, so the spec's tables still hold.

| File                                | Lines      | Change                                                              |
| :---------------------------------- | :--------- | :------------------------------------------------------------------ |
| `package.json`                      | 11, 13, 17 | `homepage`, `bugs.url`, `repository.url` → `next-friday-create-app` |
| `SECURITY.md`                       | 13         | Advisory link → new repository                                      |
| `.github/ISSUE_TEMPLATE/config.yml` | 4, 7       | Discussion links → new repository                                   |
| `CONTRIBUTING.md`                   | 27–28, 91  | Clone URL and `cd` folder; trusted publisher repository name        |

The CLI command and the test folders also change: `package.json` line 27 (`bin`), `knip.json` line 4, and `.github/workflows/ci.yml` lines 238 and 274 to `next-friday-create-app`, and the `mkdtempSync` prefixes in `test/create.test.ts`, `test/project-name.test.ts`, `test/rename.test.ts`, and `test/setup.test.ts` to `create-app-test-`. A `major` changeset declares the command rename.

## Order of work

1. Wait for pull request #66 (the `ci` spec) to merge, then restart `claude/stoic-hawking-j5qfk3` from `origin/main`, so this change is its own pull request.
2. Replace the old names in the files above with one `sed` over those files only, and add the `major` changeset.
3. Commit this plan as `intent/repository-rename/plan.md` together with the change (page 20, step 5).
4. Run the checks in **Verification**, open the pull request, and drive it until it is green and waiting only on code owner approval (page 38).

## Verification

- `git grep -n -I "create-friday-app" -- . ':!pnpm-lock.yaml' ':!intent/' ':!CHANGELOG.md' ':!.changeset/'` finds nothing.
- `pnpm verify` passes locally (build, `test:coverage`, `lint:check`, and `check:publint`, which reads `package.json`); paste its output in the pull request.
- CI passes on the pull request.
- After the next release, the npm package page links to `next-friday-create-app` and the release job's provenance step succeeds (spec, **Proof**; outside this pull request).

## Risks

- **The npm connection can expire before a release.** The `major` changeset opens the version pull request, but nothing publishes until it merges. If no release publishes within 2 days of the new connection, the npm owner deletes the expired connection and creates it again before the next release (spec, **Release and the npm trusted publisher**).
- **Old links keep working only while GitHub redirects them.** This change removes the dependence on the redirect.
