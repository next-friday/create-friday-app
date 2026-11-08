# Setup

This project follows Anthropic's [AI-native SDLC Playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook) in Claude Code and Cursor. Do the steps below in order. Each step says who does it and how to check that it is done.

## How a change flows

1. **Plan:** an idea, a ticket, or an incident becomes `intent/<change>/intent.md` (`write-intent` skill). The product owner merges or closes it.
2. **Design:** `spec.md` is written from the accepted intent with the policy skills loaded (`write-spec` skill). The product owner resolves concerns with the policy owners.
3. **Build:** the engineer starts in plan mode, approves the plan, and commits it as `plan.md`. A tech lead approves higher-risk plans.
4. **Test:** the session runs **Verifying your work** in `AGENTS.md`.
5. **Review:** Claude Code Review and Bugbot review by `REVIEW.md`. A code owner approves; the agent never does.
6. **Deploy:** `agent-production-gate.sh` gates production.
7. **Maintain:** larger work becomes a new `intent.md`.

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
/.agents/skills/write-intent/ @the-lead-who-signs-off-the-intent-template
/.agents/skills/brand-policy/ @the-brand-policy-owner
/.agents/skills/security-policy/ @the-security-policy-owner
/.agents/skills/compliance-policy/ @the-compliance-policy-owner
/.agents/skills/ux-policy/ @the-ux-policy-owner
```

Also replace the owner placeholder in `.github/zizmor.yml`.

**Check:** on GitHub, open `.github/CODEOWNERS`; GitHub shows no errors in the file.

## 3. GitHub repository settings

**Who:** a repository admin.

- **Actions → General → Workflow permissions:** select **Read repository contents and packages permissions**. Every workflow requests the extra permissions it needs.
- **Advanced Security:** enable private vulnerability reporting, Dependabot alerts, Dependabot security updates, secret scanning, and push protection. `SECURITY.md` sends reporters to private vulnerability reporting.
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
- **Managed settings:** deploy the non-negotiable settings and hooks as [managed settings](https://code.claude.com/docs/en/settings), tailored from the playbook's worked example in `.claude/managed-settings.example.json`. Engineers cannot override them.
- **Monitoring:** turn on the [OpenTelemetry export](https://code.claude.com/docs/en/monitoring-usage) that the playbook's indicators read.

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
- **Policies (each policy owner, with an engineer):** write the policy in `.agents/skills/<area>-policy/SKILL.md` from the owner's source of truth, then run `pnpm rules:sync`. Test that the skill triggers: ask for the relevant task in different ways and confirm the skill loads each time. The policy owner approves every later change as its code owner.
- **Production gate (engineering leadership, with change management and compliance):** list the approvals that must survive. A person then changes `.agents/hooks/agent-production-gate.sh` to match this project's production deploy command and approval; agent settings deny the file to agents.
- **Review (tech lead):** replace `src/gen/` in `.agents/review.md` with this project's generated paths, then run `pnpm rules:sync`, which renders it to `REVIEW.md` for Claude Code Review. Once a month, rate the review findings and tune `.agents/review.md`.
- **People without Git experience:** connect GitHub to Claude (claude.ai or Cowork), so Claude commits `intent.md` for them.

## 7. Later, as the guardrails mature

- Run the `write-spec` skill by hand first, then as an organization-level slash command, then as a job that commits `spec.md` as a pull request when an `intent.md` merges.
- Make auto mode the default for routine work: a tight `spec.md`, a small blast radius, and code the tests already cover.
- Replace `bands.yaml` with this project's metric, add a unit-tested detection script that reads it, and add the trigger that runs it.
