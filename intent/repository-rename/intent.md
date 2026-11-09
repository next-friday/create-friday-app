# Intent: Follow the repository rename to create-next-friday-app

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

The repository was renamed from `next-friday/create-friday-app` to `next-friday/create-next-friday-app`, but files and settings still name the old repository. GitHub redirects web links, so most of them still open, but the npm release depends on the exact name.

| Still names the old repository                                                      | Where                                                  | Risk                                                                                                                                                          |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| npm trusted publisher, set up as `next-friday/create-friday-app` with `release.yml` | npmjs.com package settings; `CONTRIBUTING.md`, line 91 | The next publish may fail, because the workflow's OIDC token now names the new repository. Unverified: a person must check the package settings on npmjs.com. |
| `repository.url`, `homepage`, and `bugs.url`                                        | `package.json`, lines 11, 13, and 17                   | The package's npm page links to the old name, and npm provenance compares `repository.url` with the repository that built the package.                        |
| Private vulnerability reporting link                                                | `SECURITY.md`, line 13                                 | Reporters rely on a redirect.                                                                                                                                 |
| Discussions links in the issue chooser                                              | `.github/ISSUE_TEMPLATE/config.yml`, lines 4 and 7     | Users rely on a redirect.                                                                                                                                     |
| Clone command, the folder it creates, and trusted publisher instructions            | `CONTRIBUTING.md`, lines 27, 28, and 91                | Contributors copy the old name.                                                                                                                               |

## Proposed outcome

- The next release publishes to npm with provenance, from the renamed repository. Before it, an npm owner checks the trusted publisher on npmjs.com, which still names the old repository if it was set up for release 5.0.0 (its provenance names `https://github.com/next-friday/create-friday-app`), and changes it to `next-friday/create-next-friday-app`.
- No file in this repository names the old repository by its URL or slug, except release history. The CLI's command name `create-friday-app` (`package.json`, line 27), which `knip.json` and the CI smoke tests also use, is not the repository name and stays, because changing it would break the CLI for its users (`AGENTS.md`, convention 3).

## Affected users and systems

- The npm package `@next-friday/create-app` and its release workflow.
- Contributors, security reporters, and users who follow links from the repository or npm.

## Constraints

- Only a person with npm owner access can change the trusted publisher on npmjs.com.
- Release history stays as it was written.
