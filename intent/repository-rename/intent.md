# Intent: Follow the repository rename to create-next-friday-app

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

The repository was renamed from `next-friday/create-friday-app` to `next-friday/create-next-friday-app`, but files and settings still name the old repository. GitHub redirects web links, so most of them still open, but the npm release depends on the exact name.

| Still names the old repository                                           | Where                                              | Risk                                                                                                                                                                                                                                                                                                                 |
| :----------------------------------------------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repository.url`, `homepage`, and `bugs.url`                             | `package.json`, lines 11, 13, and 17               | The next release fails to publish: to publish from GitHub with provenance, "your package's `repository.url` field in `package.json` must exactly match your GitHub repository" (npm docs: Trusted publishing for npm packages; Generating provenance statements). The package's npm page also links to the old name. |
| Private vulnerability reporting link                                     | `SECURITY.md`, line 13                             | Reporters rely on a redirect.                                                                                                                                                                                                                                                                                        |
| Discussions links in the issue chooser                                   | `.github/ISSUE_TEMPLATE/config.yml`, lines 4 and 7 | Users rely on a redirect.                                                                                                                                                                                                                                                                                            |
| Clone command, the folder it creates, and trusted publisher instructions | `CONTRIBUTING.md`, lines 27, 28, and 91            | Contributors copy the old name.                                                                                                                                                                                                                                                                                      |

## Proposed outcome

- The next release publishes to npm with provenance, from the renamed repository, once `repository.url` names it. npm does not let a trusted publisher connection change: "Existing trusted publisher connections cannot be changed… delete the connection and create a new one", and a new connection expires unless its first publish succeeds within 2 days (npm docs: Trusted publishing for npm packages). The connection names workflow `release.yml` and environment `Release`, which the release job uses (`.github/workflows/release.yml`, line 98). The npm owner replaced the connection with `next-friday/create-next-friday-app` on 2026-11-09, so it expires unless a release publishes by 2026-11-11; after that, the owner deletes it and creates it again just before the next release. Release 5.0.0 was the last one built under the old name: its provenance names `https://github.com/next-friday/create-friday-app`.
- No file in this repository names the old repository by its URL or slug, except release history. The CLI's command name `create-friday-app` (`package.json`, line 27), which `knip.json` and the CI smoke tests also use, is not the repository name and stays, because changing it would break the CLI for its users (`AGENTS.md`, convention 3).

## Affected users and systems

- The npm package `@next-friday/create-app` and its release workflow.
- Contributors, security reporters, and users who follow links from the repository or npm.

## Constraints

- Release history stays as it was written.
