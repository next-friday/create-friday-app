# Intent: GitHub files that fit private client projects

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

The templates ship a full set of GitHub files: README, contributing guide, security policy, code owners, pull request template, issue forms, Dependabot, and labeler. Some of them assume a public repository, but most generated projects are private client repositories.

| Problem                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Where                                                                      | Source                                                                                                                                                                                                           |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The security policy tells reporters to use **Security → Report a vulnerability**, and the setup guide turns on private vulnerability reporting. GitHub documents that feature for public repositories, so a private client repository may offer reporters no way to report. Unverified for private repositories: a person must check a private repository's settings.                                                                                         | `templates/base/SECURITY.md`; `templates/base/SETUP.md`, step 3            | [GitHub Docs: Privately reporting a security vulnerability](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-a-vulnerability/privately-reporting-a-security-vulnerability) |
| `CODEOWNERS` ships with comments only. Until the team fills it in, as `SETUP.md` step 2 asks, the repository has no code owner, so a rule that requires code owner approval approves nothing, and a pull request the agent wrote can merge without an owner's review.                                                                                                                                                                                         | `templates/base/.github/CODEOWNERS`; `templates/base/SETUP.md`, step 2     | Playbook page 38, step 3: "branch protection still requires approval from a code owner". Page 39: the agent that wrote the code has no way to approve it.                                                        |
| No issue form reports a documentation problem. The root and every stack offer only a bug report and a feature request, and blank issues are off, so a reader who finds wrong or stale documentation has no form that fits. The official Next.js repository has a documentation report form with three fields: what the issue is, context, and a link to the page.                                                                                             | `.github/ISSUE_TEMPLATE/` in the root and in each stack under `templates/` | [vercel/next.js `.github/ISSUE_TEMPLATE/4.docs_report.yml`](https://github.com/vercel/next.js/blob/canary/.github/ISSUE_TEMPLATE/4.docs_report.yml)                                                              |
| A commit that only reformats code, such as a Prettier upgrade, hides who last changed each line in the blame view. GitHub hides the commits listed in `.git-blame-ignore-revs` at the repository root from blame ([GitHub Docs: Viewing and understanding files](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files)), and the official Next.js repository has one. The root and the templates have none. | Repository root, in the root and in `templates/base/`                      | [vercel/next.js `.git-blame-ignore-revs`](https://github.com/vercel/next.js/blob/canary/.git-blame-ignore-revs)                                                                                                  |

## Proposed outcome

- `SECURITY.md` names a contact the team sets during setup, such as the security email of the company or of the client, and `SETUP.md` has a step to fill it in. Private vulnerability reporting is turned on only when the repository is public.
- The team still fills in `CODEOWNERS` as `SETUP.md` step 2 describes, and CI fails while `CODEOWNERS` names no owner, so the gap cannot be forgotten.
- The root and every template have a documentation report issue form, with the same fields as the Next.js form and the labels `documentation` and `needs triage`.
- The root and every template have `.git-blame-ignore-revs`, and a commit that only reformats code is added to it.

## Affected users and systems

- Every project generated from the CLI, and anyone who finds a vulnerability in one.
- `templates/base/SECURITY.md`, `templates/base/.github/CODEOWNERS`, `templates/base/SETUP.md`, and every template's CI.

## Constraints

- A generated project must still pass its own `pnpm verify`.
