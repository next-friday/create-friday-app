# Setup

This project runs an AI-native software development loop in Claude Code and Cursor: intent, spec, plan, build, review, deploy, and maintain. Do the steps below in order. Each step says who does it and how to check that it is done.

## How a change flows

Send a request with `/sdlc`. `intent/README.md` and the playbooks in `.agents/skills/sdlc/playbooks/` say who acts and who decides at each stage.

## 1. First commit and push

**Who:** an engineer.

1. Install gitleaks and jq (see [CONTRIBUTING.md](CONTRIBUTING.md)).
2. Replace the template's description and owner: `package.json#description`, `repository.url`, and `author`, and any template text that `README.md` → **After creating a project from this template** lists. Change `license` from `UNLICENSED` if the project is open source.
3. Create an empty repository on GitHub. Make the first commit on `main` and push it there. The Git hooks allow only this first commit and push on `main`; work on branches after that.

   ```sh
   git add --all
   git commit -m "chore(repo): start from template"
   git remote add origin https://github.com/OWNER/REPOSITORY.git
   git push --set-upstream origin main
   ```

**Check:** `git log --oneline origin/main` prints one commit.

## 2. Owners

**Who:** an engineer, with the product owner, a lead, and each policy owner.

In `.github/CODEOWNERS`, add these lines in this order. GitHub uses the last matching line for each file ([code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)), so the line for every file comes first:

```text
* @your-org/your-team
/intent/ @the-product-owner
/.agents/skills/sdlc/ @the-lead-who-signs-off-the-intent-template
/.agents/skills/brand-policy/ @the-brand-policy-owner
/.agents/skills/security-policy/ @the-security-policy-owner
/.agents/skills/compliance-policy/ @the-compliance-policy-owner
/.agents/skills/ux-policy/ @the-ux-policy-owner
```

Also replace the owner placeholder in `.github/zizmor.yml`.

Replace `security@example.com` in `SECURITY.md` with the contact the security policy owner names, such as the security email of the company or of the client.

**Check:** on GitHub, open `.github/CODEOWNERS`; GitHub shows no errors in the file. `grep example.com SECURITY.md` prints nothing.

Run `pnpm setup:check`. It names each file that still holds a template placeholder, and passes when none does.

## 3. GitHub repository settings

**Who:** a repository admin.

- **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**. Every workflow requests the extra permissions it needs.
- **General → Pull Requests:** select **Automatically delete head branches**, so a branch is deleted when its pull request merges.
- **General → Pull Requests → Allow squash merging:** set the default commit message to the pull request title alone ([configure commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)). Each commit on `main` is then the pull request title and number, with only co-author trailers in the body; the pull request description holds the why.
- **Advanced Security:** enable Dependabot alerts and Dependabot security updates. If the organization has [GitHub Secret Protection](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security), also enable secret scanning and push protection; a private repository needs it for both, and it needs a GitHub Team or GitHub Enterprise plan. gitleaks and TruffleHog scan for secrets in CI either way.
- **Rules → Rulesets:** protect `main` with:
  - squash merges only, a linear history, and no force pushes or deletion;
  - the required checks `All Checks` and `Validate pull request title`;
  - a pull request before merging, with at least one approval, review from Code Owners, and stale approvals dismissed when new commits are pushed. Claude Code Review follows the severity, exclusion, and nit-cap rules in `REVIEW.md` only on a default branch protected this way ([customize Code Review](https://code.claude.com/docs/en/code-review-customize)).

  Rulesets in a private repository need GitHub Pro, Team, or Enterprise; on GitHub Free, make the repository public or upgrade.

- Create the `needs triage` label, which the issue forms apply: `gh label create "needs triage"`.

**Check:** a test pull request shows the two required checks and asks for a code owner's review.

## 4. Claude

**Who:** an Owner of the Claude organization, with an owner of the GitHub organization.

- **Code Review:** in [**Admin settings → Claude Code**](https://claude.ai/admin-settings/claude-code#code-review), turn on **Allow code review**, install the Claude GitHub App, and add this repository ([set up Code Review](https://code.claude.com/docs/en/code-review-setup)). It needs a Team or Enterprise plan ([availability](https://code.claude.com/docs/en/code-review#availability)). Keep **Review runs** at **After every push**, the default, so every push to a pull request gets a review. Reviews run on Anthropic's infrastructure, so the repository has no review workflow.
- **Managed settings:** deploy the non-negotiable settings and hooks as [managed settings](https://code.claude.com/docs/en/settings), tailored from the example in `.claude/managed-settings.example.json`. Engineers cannot override them.
- **Monitoring:** turn on the [OpenTelemetry export](https://code.claude.com/docs/en/monitoring-usage).

**Check:** the test pull request gets a **Claude Code Review** check run within a few minutes.

## 5. Cursor

**Who:** a Cursor team admin.

- **Bugbot:** enable the repository at [Bugbot](https://cursor.com/automations/from-cursor/bugbot). Bugbot reviews pull requests by the files `.cursor/BUGBOT.md` links, including `.agents/review.md`.
- **Sandbox:** set the team's sandbox policy ([Cursor sandbox](https://cursor.com/docs/reference/sandbox)), which repository and user settings cannot weaken.

**Check:** the test pull request gets a Bugbot review.

## 6. Team decisions

**Who:** the people named in each item.

- **Sources of truth (engineering lead):** for each artifact, name one system as the source of truth: this repository, an existing tool such as Jira, or, as the minimum, a link both ways (the record id in the file and the commit SHA in the record).
- **Higher risk (engineering lead):** decide which changes count as higher risk. A tech lead or architect approves their specs and plans.
- **Policies (each policy owner, with an engineer):** each `.agents/skills/<area>-policy/SKILL.md` ships a default (security: OWASP ASVS 5.0.0 Level 1; UX: WCAG 2.2 Level AA; compliance: the OECD privacy principles; brand: one declared source for every brand value). Review it, replace or add the organization's own rules, then run `pnpm rules:sync`. Test that the skill triggers: ask for the relevant task in different ways and confirm the skill loads each time. The policy owner approves every later change as its code owner.
- **Production gate (engineering leadership, with change management and compliance):** name the release managers and add them as required reviewers on the `prod` environment, as the README's deploy section describes. `.agents/hooks/agent-production-gate.sh` blocks an agent's shell commands that dispatch a `prod` deploy, run a Railway command with `prod` as its environment, or push a release tag. It does not read MCP tools. A release manager whose own agent session must do one of these starts the agent with `RELEASE_APPROVAL` set to the approval record, for example `RELEASE_APPROVAL=CHG-123 claude`.
- **Review (tech lead):** check that the generated files named in `.agents/review.md` match this project's generated paths, and change the list where they differ, then run `pnpm rules:sync`, which renders it to `REVIEW.md` for Claude Code Review. Once a month, rate the review findings and tune `.agents/review.md`.
- **People without Git experience:** connect GitHub to Claude (claude.ai or Cowork), so Claude commits `intent.md` for them.

## 7. Later, as the guardrails mature

- Send the intent's path with `/sdlc` by hand first. Then build a job that runs it when an `intent.md` merges. The job runs this in the repository: `claude -p "/sdlc intent/<change>/intent.md" --permission-mode acceptEdits --allowedTools "Bash(git switch:*)" "Bash(git add:*)" "Bash(git commit:*)" "Bash(git status:*)" "Bash(git log:*)" "Read" "Write" "Edit" "Glob" "Grep"`. Without `--permission-mode acceptEdits` the session stays in plan mode and writes nothing. The job then pushes the branch and opens the pull request with its own token; the product owner's first step is the review.
- Make auto mode the default for routine work: a tight `spec.md`, a small blast radius, and code the tests already cover.
- Set the metric in `bands.yaml`, then run `pnpm bands:check <file>` from a scheduled job with the metric's values, and send a `2sigma` or `3sigma` result to `/sdlc` as a finding.
