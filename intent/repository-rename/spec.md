# Spec: Follow the repository rename to next-friday-create-app

From `intent/repository-rename/intent.md`. Status: done.

## Requirements

1. The package metadata names the renamed repository, so the next release can publish with provenance. npm requires that "your package's `repository.url` field in `package.json` must exactly match your GitHub repository" (npm docs: Trusted publishing for npm packages).
2. Every link and instruction in the repository that points at the old repository points at the new one.
3. The CLI's command changes from `create-friday-app` to `next-friday-create-app` with a `major` changeset, because users who installed the package globally or call the command by name in a script must run the new name (`CHANGELOG.md`, 6.0.0).
4. Release history stays as written: `CHANGELOG.md` and earlier release notes are not edited.

## Design

### Files that change

| File                                | Line    | Today                                                                                         | After                                                                              |
| :---------------------------------- | :------ | :-------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `package.json`                      | 11      | `"homepage": "https://github.com/next-friday/create-friday-app#readme"`                       | `"homepage": "https://github.com/next-friday/next-friday-create-app#readme"`       |
| `package.json`                      | 13      | `"url": "https://github.com/next-friday/create-friday-app/issues"`                            | `"url": "https://github.com/next-friday/next-friday-create-app/issues"`            |
| `package.json`                      | 17      | `"url": "git+https://github.com/next-friday/create-friday-app.git"`                           | `"url": "git+https://github.com/next-friday/next-friday-create-app.git"`           |
| `SECURITY.md`                       | 13      | `https://github.com/next-friday/create-friday-app/security/advisories/new`                    | `https://github.com/next-friday/next-friday-create-app/security/advisories/new`    |
| `.github/ISSUE_TEMPLATE/config.yml` | 4       | `https://github.com/next-friday/create-friday-app/discussions/categories/q-a`                 | `https://github.com/next-friday/next-friday-create-app/discussions/categories/q-a` |
| `.github/ISSUE_TEMPLATE/config.yml` | 7       | `.../create-friday-app/discussions/categories/ideas`                                          | `.../next-friday-create-app/discussions/categories/ideas`                          |
| `CONTRIBUTING.md`                   | 27 – 28 | `git clone https://github.com/next-friday/create-friday-app.git`, then `cd create-friday-app` | the same with `next-friday-create-app` in both lines                               |
| `CONTRIBUTING.md`                   | 91      | `add next-friday/create-friday-app with workflow release.yml and environment Release`         | `add next-friday/next-friday-create-app` with the same workflow and environment    |

### The CLI command and test folders

`git grep -n create-friday-app` on `main` at `c576e0c` also finds these. They name the CLI command or a temporary folder, and they change too: the command to `next-friday-create-app`, and the folder prefix to `create-app-test-`:

| File                                                                                                       | What it names                              |
| :--------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| `package.json`, line 27 (`"bin"`)                                                                          | The CLI command                            |
| `knip.json`, line 4 (`ignoreBinaries`)                                                                     | The CLI command                            |
| `.github/workflows/ci.yml`, lines 238 and 274                                                              | The CLI command in the consumer smoke test |
| `test/create.test.ts`:50, `test/project-name.test.ts`:9, `test/rename.test.ts`:21, `test/setup.test.ts`:10 | A temporary folder prefix in the tests     |

### Release and the npm trusted publisher

- The npm owner replaces the trusted publisher connection with `next-friday/next-friday-create-app`, workflow `release.yml`, and environment `Release`. A new connection expires unless its first publish succeeds within 2 days (npm docs: Trusted publishing for npm packages).
- The command rename carries a `major` changeset (released as 6.0.0, `CHANGELOG.md`), so the release that follows publishes with the corrected metadata.
- If no release publishes within those 2 days, the npm owner deletes the expired connection and creates it again just before the next release, as the intent says.

### Order of work

1. Change the files in both tables, and add a `major` changeset for the command rename.
2. Run `git grep -n -I "create-friday-app" -- . ':!pnpm-lock.yaml' ':!intent/' ':!CHANGELOG.md' ':!.changeset/'` and confirm that it finds nothing.
3. Run `pnpm verify`.

## Proof

- The `git grep` in step 2 finds nothing.
- `pnpm verify` passes, including `pnpm check:publint`, which reads `package.json`.
- After the next release, the npm package page links to `next-friday-create-app`, and the release job's provenance step succeeds.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills in `.agents/skills/` say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The change touches the security reporting link in `SECURITY.md`; the security policy owner, once named, should confirm the new link.
