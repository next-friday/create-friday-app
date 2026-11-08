# Intent: Follow the repository rename to create-next-friday-app

Author: Joe Takara. Status: draft.

## Problem

The repository was renamed from `next-friday/create-friday-app` to `next-friday/create-next-friday-app`, but files and settings still name the old repository. GitHub redirects web links, so most of them still open, but the npm release depends on the exact name.

| Still names the old repository                                                      | Where                                                  | Risk                                                                                                                                                          |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| npm trusted publisher, set up as `next-friday/create-friday-app` with `release.yml` | npmjs.com package settings; `CONTRIBUTING.md`, line 91 | The next publish may fail, because the workflow's OIDC token now names the new repository. Unverified: a person must check the package settings on npmjs.com. |
| `repository.url`, `homepage`, and `bugs.url`                                        | `package.json`, lines 11, 13, and 17                   | The package's npm page links to the old name, and npm provenance compares `repository.url` with the repository that built the package.                        |
| Private vulnerability reporting link                                                | `SECURITY.md`, line 13                                 | Reporters rely on a redirect.                                                                                                                                 |
| Discussions links in the issue chooser                                              | `.github/ISSUE_TEMPLATE/config.yml`, lines 4 and 7     | Users rely on a redirect.                                                                                                                                     |
| Clone command and trusted publisher instructions                                    | `CONTRIBUTING.md`, lines 27 and 91                     | Contributors copy the old name.                                                                                                                               |

## Proposed outcome

- The next release publishes to npm with provenance, from the renamed repository.
- No file in this repository names the old repository, except release history such as `CHANGELOG.md`.

## Affected users and systems

- The npm package `@next-friday/create-app` and its release workflow.
- Contributors, security reporters, and users who follow links from the repository or npm.

## Constraints

- Only a person with npm owner access can change the trusted publisher on npmjs.com.
- Release history stays as it was written.

## Open questions

1. Was release 5.0.0, published on 2026-11-08, built before or after the rename, and does the trusted publisher on npmjs.com still name the old repository?
