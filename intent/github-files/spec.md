# Spec: GitHub files that fit private client projects

From `intent/github-files/intent.md`. Status: done.

Written at `main` `dfac1fc` with the `write-spec` skill as committed there, as the next step of the loop. The product owner asked for it through another session and added no constraint to the skill's prompt.

## Requirements

1. The templates' `SECURITY.md` sends reporters to a contact the team sets during setup, and the templates' `SETUP.md` has a step to set it. Neither file mentions private vulnerability reporting. GitHub documents the feature for public repositories only: "Owners and administrators of public repositories can enable private vulnerability reporting on their repositories", and where it is not enabled a reporter follows "the instructions in the security policy for the repository" ([GitHub Docs: Privately reporting a security vulnerability](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-a-vulnerability/privately-reporting-a-security-vulnerability)).
2. The root `SECURITY.md` keeps private vulnerability reporting, because the root is a public repository (intent, **Proposed outcome**).
3. The templates' `SETUP.md` turns on secret scanning and push protection only for an organization that has GitHub Secret Protection. GitHub Docs: Secret Protection "includes features that help you detect and prevent secret leaks, such as secret scanning and push protection"; "To run the feature on your private or internal repositories, you must purchase the relevant GitHub Advanced Security product"; and "You must be on a GitHub Team or GitHub Enterprise plan in order to purchase GitHub Code Security or GitHub Secret Protection" ([About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)). Its availability table marks secret scanning and push protection "Yes" for a public repository and "No" for a private repository without Secret Protection.
4. gitleaks and TruffleHog stay the templates' secret scanners (`templates/base/.github/workflows/secret-scan.yml`, lines 17, 34, and 37).
5. The root and every generated project have a documentation report issue form with the three fields of the Next.js form and the labels `documentation` and `needs triage`.
6. `.git-blame-ignore-revs` is added, in the root or in a generated project, in the commit right after the first commit that only reformats code, and lists that commit and each later one. No project carries an empty file. GitHub reads the file only "in the root directory of your repository" ([GitHub Docs: Viewing and understanding files](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files)).
7. A generated project still passes its own `pnpm verify` (intent, **Constraints**).

## Design

### Files that change

Line numbers are at `main` `dfac1fc`.

| File                                                                                                                                      | Line                | Today                                                                                                                                                                                                                    | After                                                                                                                                                                                                                                                                                                                                            |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/base/SECURITY.md`                                                                                                              | 9                   | "Report vulnerabilities privately through **Security → Report a vulnerability** in this repository."                                                                                                                     | "Report vulnerabilities privately by email to `security@example.com`." The rest of the line, which asks for the issue, the affected files or versions, and steps to reproduce, stays.                                                                                                                                                            |
| `templates/base/SETUP.md`                                                                                                                 | 48 (step 2, Owners) | "Also replace the owner placeholder in `.github/zizmor.yml`."                                                                                                                                                            | A further sentence: replace `security@example.com` in `SECURITY.md` with the contact the security policy owner names, such as the security email of the company or of the client. The step's **Check** adds: `grep example.com SECURITY.md` prints nothing.                                                                                      |
| `templates/base/SETUP.md`                                                                                                                 | 57 (step 3)         | "**Advanced Security:** enable private vulnerability reporting, Dependabot alerts, Dependabot security updates, secret scanning, and push protection. `SECURITY.md` sends reporters to private vulnerability reporting." | "**Advanced Security:** enable Dependabot alerts and Dependabot security updates. If the organization has GitHub Secret Protection, also enable secret scanning and push protection; a private repository needs it for both. gitleaks and TruffleHog scan for secrets in CI either way." Each claim links the GitHub Docs page in requirement 3. |
| `templates/base/.github/ISSUE_TEMPLATE/documentation.yml`                                                                                 | new                 | none                                                                                                                                                                                                                     | The documentation report form; see **The documentation report form**.                                                                                                                                                                                                                                                                            |
| `.github/ISSUE_TEMPLATE/documentation.yml`                                                                                                | new                 | none                                                                                                                                                                                                                     | The same form, with the `assignees` that the root's `bug.yml` (lines 4–6) and `feature.yml` (lines 4–6) set.                                                                                                                                                                                                                                     |
| `CONTRIBUTING.md`                                                                                                                         | 97–103              | The **Pull requests** list                                                                                                                                                                                               | One more item: see **Ignoring reformat commits in blame**.                                                                                                                                                                                                                                                                                       |
| `templates/{nestjs,nextjs}/CONTRIBUTING.md`:52, `templates/nodejs/CONTRIBUTING.md`:51, `templates/{payload,turborepo}/CONTRIBUTING.md`:53 | after that line     | "Pull requests are squash-merged, so the pull request title becomes the commit on `main`."                                                                                                                               | The same item as in the root `CONTRIBUTING.md`.                                                                                                                                                                                                                                                                                                  |
| `.changeset/`                                                                                                                             | new                 | none                                                                                                                                                                                                                     | A changeset; see **Release**.                                                                                                                                                                                                                                                                                                                    |

The root `SECURITY.md` keeps line 13, the private vulnerability reporting link (requirement 2). `intent/repository-rename/spec.md` changes the repository name in that line; this spec does not touch it.

`security@example.com` is a proposal: `example.com` is reserved for documentation ([RFC 2606](https://www.rfc-editor.org/rfc/rfc2606), section 3), so a project that skips the setup step sends no report to a real stranger, and the check in step 2 finds it.

### The documentation report form

One file in `templates/base/`, because every stack would carry the same content and `AGENTS.md` the **A stack replaces a `base` file** convention lets a stack replace a `base` file only when it needs different content. This also matches `intent/monorepo-apps/spec.md`, which moves each stack's `.github/` into `templates/base/` once.

The fields follow [vercel/next.js `.github/ISSUE_TEMPLATE/4.docs_report.yml`](https://github.com/vercel/next.js/blob/canary/.github/ISSUE_TEMPLATE/4.docs_report.yml), fetched on 2026-11-09 (lines 14–31):

| Next.js field                                          | Type     | Required | Here                                                                                                         |
| :----------------------------------------------------- | :------- | :------- | :----------------------------------------------------------------------------------------------------------- |
| "What is the documentation issue?"                     | textarea | yes      | Same label and validation; the example names wrong or stale information instead of Next.js's `<Link>`.       |
| "Is there any context that might help us understand?"  | textarea | yes      | Same label, description, and validation.                                                                     |
| "Does the docs page already exist? Please link to it." | input    | no       | Same label and validation; the example is a page URL or a file path in the repository instead of nextjs.org. |

Proposals that follow the sibling forms rather than Next.js, because each Next.js line names Next.js resources:

- `name: Documentation report` and a one-line `description`, as `bug.yml` and `feature.yml` have.
- `labels: ["documentation", "needs triage"]` (requirement 5).
- An `id` on each field, as every field in the sibling forms has.
- No `title: 'Docs: '`, no `type: Documentation`, and no Next.js markdown block. The sibling forms set no title or type, and the markdown block links Next.js's contribution guide and discussions. `type` sets an issue type, which an organization defines; the sibling forms do not use it.

The template's form names no product, so the rename in `src/rename.ts` changes nothing in it.

### Labels

GitHub adds issue form labels only when they exist: "If a label does not already exist in the repository, it will not be automatically added to the issue" ([GitHub Docs: Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)).

- `documentation` is a default label: "GitHub provides default labels in every new repository", including `documentation` ([GitHub Docs: Managing labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)).
- `needs triage` is created by `templates/base/SETUP.md` line 65.
- The root has both: the GitHub API returns `documentation` and `needs triage` for this repository on 2026-11-09.

So the setup step needs no change; see **Areas of concern** for an organization that edits its default labels.

### Ignoring reformat commits in blame

Neither the root nor any template has a commit that only reformats code: `git log --oneline origin/main` at `dfac1fc` lists 50 commits, and no subject among them names a reformat: each is a feature, fix, docs, dependency, or release commit. So no `.git-blame-ignore-revs` is added now (requirement 6).

Pull requests are squash-merged, so the commit to list is the squash commit on `main`. The `CONTRIBUTING.md` item, proposed wording:

> After a pull request that only reformats code merges, the next pull request lists its commit on `main` in `.git-blame-ignore-revs` at the repository root, creating the file the first time, with a `#` comment that names the change, as GitHub Docs shows. GitHub then hides that commit in the blame view.

GitHub's example puts each full hash under a `#` comment line ([Viewing and understanding files](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files)), as the Next.js file does ([vercel/next.js `.git-blame-ignore-revs`](https://github.com/vercel/next.js/blob/canary/.git-blame-ignore-revs)).

When `intent/monorepo-apps/spec.md` lands, the templates' `CONTRIBUTING.md` content moves to the contributing page of `apps/docs`, and this item moves with it. The root `CONTRIBUTING.md` stays.

### Release

`.changeset/README.md` calls "a previously valid command that now generates a different project" a breaking change, which takes `major`. This change gives every stack a different `SECURITY.md`, `SETUP.md`, `CONTRIBUTING.md`, and a new issue form. Proposal: ship it in the same major release as `intent/monorepo-apps/spec.md` (its requirement 17), with its own changeset entry naming the four generated files, so the release notes record it.

### Order of work

1. The template files: `SECURITY.md`, `SETUP.md`, the issue form in `templates/base/`, and each stack's `CONTRIBUTING.md`.
2. Generate a project for each stack under the template's own name, as `AGENTS.md` **Commands** shows, and run its `pnpm verify`.
3. The root issue form and `CONTRIBUTING.md`, then `pnpm verify` at the root.
4. The changeset.

## Proof

- `git grep -n -i "private vulnerability\|Report a vulnerability" -- templates/` prints nothing; `git grep -n "advisories/new" -- SECURITY.md` still prints the root's line.
- `git grep -n "Secret Protection" -- templates/base/SETUP.md` prints the step 3 line.
- `ls .git-blame-ignore-revs templates/base/.git-blame-ignore-revs` finds neither file.
- In a project generated for each stack, `.github/ISSUE_TEMPLATE/documentation.yml` exists and `pnpm verify` passes. The Template job in CI runs the same check; it runs only in CI.
- After merge, the root's **New issue** page offers **Documentation report**, and an issue opened from it carries `documentation` and `needs triage`. No local tool validates issue form syntax, so this is the first check of the form itself.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills in `.agents/skills/` say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review the `SECURITY.md` contact and the setup step that sets it, and decide whether the templates' "What to expect" section (lines 13–15) needs response targets like the root's (`SECURITY.md`, lines 17–21).
- **A public generated project:** a team may make its project public (`templates/base/SETUP.md`, lines 20 and 63). It can then enable private vulnerability reporting, but the templates no longer say so, as the intent decided.
- **Edited default labels:** "Organization owners can customize the default labels for repositories in their organization" (GitHub Docs: Managing labels). In an organization that removed `documentation`, the form opens issues without it and shows no error. Proposal for the product owner to accept or reject in review: extend line 65 to `gh label create documentation --force` as well.
- **Major release:** see **Release**. If this change ships before `intent/monorepo-apps/spec.md`, it needs a major release of its own.
- **Overlapping specs:** `intent/monorepo-apps/spec.md` moves each stack's `CONTRIBUTING.md` into `apps/docs` and its `.github/` into `templates/base/`, `intent/repository-rename/spec.md` edits the root `SECURITY.md` line 13, `intent/ci/spec.md` drops scanner steps from `templates/base/SETUP.md` (its **Files** table) and keeps gitleaks and TruffleHog, and `intent/playbook-plays/spec.md` edits `SETUP.md` **How a change flows** and step 4 and adds **The loop** to the root `CONTRIBUTING.md`, and `intent/dependency-freshness/spec.md` adds a Renovate step next to `templates/base/SETUP.md` line 57, the line this spec rewrites, and edits line 8 of each stack's `CONTRIBUTING.md`. The plans need one agreed order; this spec's template edits are small enough to apply before or after the move.

## Open questions

The intent has no open questions. Choices the product owner has not made are written above as proposals: the placeholder `security@example.com`, the form's file name, name, examples, and ids, the `CONTRIBUTING.md` wording, the `documentation` label step, and the release.
