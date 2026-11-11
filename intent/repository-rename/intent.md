# Intent: Follow the repository rename to next-friday-create-app

Author: Joe Takara (Developer Productivity). Status: accepted.

Updated after the repository became `next-friday/next-friday-create-app` and pull request #95 renamed the CLI command to match (2026-11-11). The first acceptance covered only the repository links.

## Problem

The repository was renamed from `next-friday/create-friday-app` to `next-friday/next-friday-create-app`, but files and settings still name the old repository. GitHub redirects web links, so most of them still open, but the npm release depends on the exact name.

| Still names the old repository                                           | Where                                              | Risk                                                                                                                                                                                                                                                                                                                 |
| :----------------------------------------------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repository.url`, `homepage`, and `bugs.url`                             | `package.json`, lines 11, 13, and 17               | The next release fails to publish: to publish from GitHub with provenance, "your package's `repository.url` field in `package.json` must exactly match your GitHub repository" (npm docs: Trusted publishing for npm packages; Generating provenance statements). The package's npm page also links to the old name. |
| Private vulnerability reporting link                                     | `SECURITY.md`, line 13                             | Reporters rely on a redirect.                                                                                                                                                                                                                                                                                        |
| Discussions links in the issue chooser                                   | `.github/ISSUE_TEMPLATE/config.yml`, lines 4 and 7 | Users rely on a redirect.                                                                                                                                                                                                                                                                                            |
| Clone command, the folder it creates, and trusted publisher instructions | `CONTRIBUTING.md`, lines 27, 28, and 91            | Contributors copy the old name.                                                                                                                                                                                                                                                                                      |

## Proposed outcome

- The next release publishes to npm with provenance, from the renamed repository, once `repository.url` names it. npm does not let a trusted publisher connection change: "Existing trusted publisher connections cannot be changed… delete the connection and create a new one", and a new connection expires unless its first publish succeeds within 2 days (npm docs: Trusted publishing for npm packages). The connection names workflow `release.yml` and environment `Release`, which the release job uses (`.github/workflows/release.yml`, line 98). The npm owner replaces the connection with `next-friday/next-friday-create-app`. A connection that expires before a release publishes is deleted and created again just before the next release. Release 5.0.0 was the last one built under the old name: its provenance names `https://github.com/next-friday/create-friday-app`. 6.0.0 is the first release whose `repository.url` names `next-friday/next-friday-create-app`.
- No file in this repository names the old repository by its URL or slug, except release history. The CLI's command changes from `create-friday-app` to `next-friday-create-app` with a `major` changeset, because users who installed the package globally or call the command by name in a script must run the new name (`CHANGELOG.md`, 6.0.0).

## Affected users and systems

- The npm package `@next-friday/create-app` and its release workflow.
- Contributors, security reporters, and users who follow links from the repository or npm.

## Constraints

- Release history stays as it was written.
