# Intent: GitHub files that fit private client projects

Author: Joe Takara. Status: draft.

## Problem

The templates ship a full set of GitHub files: README, contributing guide, security policy, code owners, pull request template, issue forms, Dependabot, and labeler. Some of them assume a public repository, but most generated projects are private client repositories.

| Problem                                                                                                                                                                                                                                                                                                                                                               | Where                                                           | Source                                                                                                                                                                                                           |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The security policy tells reporters to use **Security → Report a vulnerability**, and the setup guide turns on private vulnerability reporting. GitHub documents that feature for public repositories, so a private client repository may offer reporters no way to report. Unverified for private repositories: a person must check a private repository's settings. | `templates/base/SECURITY.md`; `templates/base/SETUP.md`, step 3 | [GitHub Docs: Privately reporting a security vulnerability](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-a-vulnerability/privately-reporting-a-security-vulnerability) |

## Proposed outcome

- `SECURITY.md` names a contact the team sets during setup, such as the security email of the company or of the client, and `SETUP.md` has a step to fill it in. Private vulnerability reporting is turned on only when the repository is public.

## Affected users and systems

- Every project generated from the CLI, and anyone who finds a vulnerability in one.
- `templates/base/SECURITY.md` and `templates/base/SETUP.md`.

## Constraints

- A generated project must still pass its own `pnpm verify`.
