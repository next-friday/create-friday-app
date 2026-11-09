# Spec: Adopt the AI-native SDLC Playbook in the templates and the root

From `intent/playbook-plays/intent.md` (accepted 2026-11-09 by the merge of pull request #57). Status: draft.

Written at `main` `dfac1fc` with the `write-spec` skill as committed there. The agent wrote it as the next step of the loop, under `AGENTS.md`'s "Asking the product owner"; no product owner prompt added a constraint to the skill's prompt.

The playbook PDF was not available while this spec was written. Every playbook quote and page number below comes from the intent; this spec adds none. The templates' half assumes the monorepo layout of `intent/monorepo-apps/spec.md` (apps at `apps/<group>/<app>`, the docs site at `apps/docs`, images deployed by digest) and the CI layout of `intent/ci/spec.md` (pull request #66: a `changes` job, checks skipped by job conditions, **All Checks** as the one required check).

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. Every play the intent lists is present in every template, and in the root where **Which plays apply to the root** says it applies; where a play is absent, that table records the playbook page and the reason.
2. **Intent home.** Every change keeps `intent.md`, `spec.md`, and `plan.md` in `intent/<change>/`; none is deleted or moved. An intent's `Status:` line takes one of the values in **Status values**, and the agent or CI job that carries out a step writes it in the pull request it opens.
3. **Automated handover.** When an intent's pull request merges, a CI job writes `spec.md` with the `write-spec` skill and opens it as a pull request, with no person starting it.
4. **Interviews.** `write-intent` and the plan convention in `AGENTS.md` tell the agent how to interview. `plan.md` has the sections Files that change, Order of work, Risks, and Proof, answers page 19, step 3's three questions, and names the engineer who accepted it. Only an engineer's plan-mode session writes the first `plan.md`.
5. **Requirements and design.** Each `spec.md` names the commit it was written at and quotes what the product owner's prompt added. The policy skills hold the organization's policy once each owner provides it.
6. **Feedback loop.** Every check under **Verifying your work** reads the project's files and fails when it cannot. Each verification command runs locally with one command and no download beyond `pnpm install`. UI stacks tell the agent to look at the changed page; every stack names the `verifier` subagent.
7. **Evals.** An eval suite runs on every pull request that changes agent instructions and nightly, and its pass-rate threshold is a merge check.
8. **PR review loop.** `@claude` on a review comment pushes a fix. On a pull request the agent opened, each submitted review, and each later comment by a person, starts the babysit loop in CI. `REVIEW.md` checks the policy skills and flags an outdated `AGENTS.md`.
9. **Production gate hook.** The hook matches the command that deploys to `prod`.
10. **CI/CD.** The templates get the triage job. Every CI job that calls Claude runs with an exact allowlist and no production credentials. Deploy, status, and rollback are reachable through MCP. `prod` deploys only from a protected tag that the release team pushes. Promotion and rollback read GitHub deployment records. Rollback is one command per environment, and in the root it moves the npm `latest` tag.
11. **Closing the loop.** A stage that no person started passes an independent gate before the next starts. The CI test failure rate is watched with the playbook's `bands.yaml` tiers.
12. **Lessons.** Every project has `lessons/`.
13. **Measure.** The loop guide names each play's indicators and where each is read.
14. **Entering the loop.** Every generated project has the loop guide page in `apps/docs`, a status skill, a session-start reminder for Claude Code and Cursor, and a setup skill.

## Design

### Which plays apply to the root

The root ships the CLI and releases one npm package; it deploys no app (`.github/workflows/release.yml`, the only release path). It has `intent/`, Claude jobs in CI (`.github/workflows/ci.yml`, lines 345–397), agent hooks (`.claude/settings.json`, lines 46–90), and `bands.yaml`. Where a generated project keeps an outcome in `apps/docs`, the root keeps it in `CONTRIBUTING.md`, under a new section **The loop**.

| Play (playbook page)                       | Root     | Why                                                                                                                                                                                       |
| :----------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent home (12–13)                        | Applies  | The root keeps its changes in `intent/` (`intent/README.md`).                                                                                                                             |
| Automated handover (5, 9, 16)              | Applies  | The root writes specs from intents, as this one is.                                                                                                                                       |
| Interviews in Plan and Build (12, 19–20)   | Applies  | The root has `write-intent` and the plan convention (`AGENTS.md`, convention 8).                                                                                                          |
| Requirements and design (15–17)            | Applies  | The root has `write-spec` and the four policy skills (`.agents/skills/`).                                                                                                                 |
| Feedback loop (31–33)                      | Applies  | `pnpm verify` downloads editorconfig-checker on first use (`CONTRIBUTING.md`, line 15). There is no UI, so the screenshot step does not apply; the root has `.claude/agents/verifier.md`. |
| Continuous evals in CI (34–35)             | Applies  | The root's agents follow its `AGENTS.md`, rules, skills, and hooks.                                                                                                                       |
| PR review loop, step 4 (38)                | Applies  | The root has `REVIEW.md` and agents open its pull requests.                                                                                                                               |
| Hooks as approval gates (40–41)            | Does not | The root has no production deploy; its release runs only in CI through the `Release` environment (`release.yml`, `environment: Release`). The root's copy of the hook stays as it is.     |
| CI/CD step 1, triage (45)                  | Applies  | Already present (`ci.yml`, lines 345–397).                                                                                                                                                |
| CI/CD step 3, agent jobs (45)              | Applies  | The root's triage job calls Claude.                                                                                                                                                       |
| CI/CD step 4, MCP (45)                     | Does not | The root deploys nothing; its release is driven by Changesets on `main` (`release.yml`, lines 1–11).                                                                                      |
| CI/CD step 5, tiered autonomy (45–46)      | Does not | No environments other than `Release`; publishing already needs a reviewed version pull request to merge.                                                                                  |
| CI/CD step 6, rollback (45)                | Applies  | As the npm `latest` tag, in **Rollback in the root**. `bands.yaml` already routes to `runbook:rollback-deploy`.                                                                           |
| Closing the loop (48–51)                   | Applies  | The root has CI and `bands.yaml` with `metric: ci_test_failure_rate`.                                                                                                                     |
| Claude Tag and the lessons file (52)       | Applies  | Incidents in the root (a bad release) need a post-mortem.                                                                                                                                 |
| How to measure it (8)                      | Applies  | In `CONTRIBUTING.md` **The loop**.                                                                                                                                                        |
| Entering the loop: guide, status, reminder | Applies  | Guide in `CONTRIBUTING.md`; the status skill and reminder read `intent/`, which the root has.                                                                                             |
| Entering the loop: setup skill             | Does not | The root has no `SETUP.md`; its one-time setup is done.                                                                                                                                   |

The root also gets the two steps the intent finds missing:

- **Owners.** `.github/CODEOWNERS` keeps `* @joetakara @next-friday-engineer` and adds `/intent/ @joetakara`, because the intent names Joe Takara as the product owner. The four policy owners are not named in any file, so their lines wait for **Open questions**.
- **Sources of truth.** `CONTRIBUTING.md` **The loop** names this repository as the source of truth for intents, specs, plans, and lessons, and GitHub pull requests for reviews and approvals (page 22). **Proposal:** the root uses no other tracker, because none appears in the repository.

### Status values

`Status:` already holds `draft` and `accepted` on this repository's specs (`intent/repository-rename/spec.md`, line 3: "Status: accepted"). The values are:

| Value                          | Meaning                                         | Written by                                                                                                  |
| :----------------------------- | :---------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `draft`                        | Written, its pull request not merged.           | `write-intent` and `write-spec`, as today (`templates/base/.agents/skills/write-intent/SKILL.md`, line 19). |
| `accepted`                     | Its pull request merged.                        | For an intent: the spec pull request. For a spec: the plan pull request.                                    |
| `done`                         | The change shipped.                             | The pull request that completes the last step of `plan.md`'s Order of work.                                 |
| `withdrawn`                    | Accepted, then dropped before it shipped.       | A pull request that says why (page 11), which the product owner merges.                                     |
| `replaced by intent/<change>/` | A later intent supersedes it before it shipped. | The later intent's pull request.                                                                            |

A shipped change is never edited to a new status; a problem found later starts a new intent (page 48). The status skill reads acceptance from the merged pull request when the line has not caught up. These values are the intent's proposal; this spec confirms them.

`write-intent`, `write-spec`, and `intent/README.md` (root and `templates/base/`) describe the values and that files are never deleted or moved.

### Automated handover

`.github/workflows/spec-on-intent-merge.yml`, in the root and in `templates/base/`, named as the community kit names it (`jsnkle/ai-native-sdlc`, `plugin/template/.github/workflows/`):

1. Runs on `push` to `main`. A step lists the `intent/*/intent.md` files the push added or changed whose folder has no `spec.md`, leaving out any whose `Status:` is `withdrawn` or `replaced by intent/<change>/`. A merged intent that still says `draft` stays eligible, because the spec pull request is what sets it to `accepted` (**Status values**). With none, the job ends.
2. For each, runs `claude -p` with the `write-spec` skill and the prompt "Write spec.md for intent/<change>/intent.md", with `--permission-mode dontAsk --allowedTools "Read,Glob,Grep,Write(intent/**),Edit(intent/**),Skill"`. Claude gets no GitHub token and no shell.
3. A later step, outside Claude, runs the deterministic gate in **Confidence gates**, then commits, pushes `spec/<change>`, and opens the pull request.

**Token. Proposal:** a GitHub App the organization creates for the loop, used through `actions/create-github-app-token`, with secrets `LOOP_APP_ID` and `LOOP_APP_PRIVATE_KEY`. GitHub names "a GitHub App installation access token or a personal access token" as what to use instead of `GITHUB_TOKEN` so the pull request's workflows run ([GitHub Docs: GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)). An App token rather than the community kit's `LOOP_GH_TOKEN` personal token, because page 45, step 3 asks for "short-lived scoped tokens" and an App token belongs to no person, so the product owner can approve a pull request it opens. The App gets `contents: write` and `pull-requests: write` on the repository only. `SETUP.md` gets a step: a GitHub organization owner creates and installs the App. The root uses the same App.

**Claude credentials.** Templates: the `ANTHROPIC_API_KEY` secret (**Across the plays**). Root: workload identity federation, as the triage job does (`ci.yml`, lines 382–383).

The job stops at `spec.md`. The product owner accepts the spec by merging (page 16, step 6); the engineer writes the plan (page 19).

### Interviews in Plan and Build

- **`write-intent`, step 2** (root and `templates/base/`) becomes: interview the originator in rounds; number each question; offer choices where it can; give a recommended answer; look up every fact and ask only for decisions; use the originator's words and plain language (page 12, step 1: "No formal language is required"); stop when nothing is left silently assumed. Sources as in the intent: [Claude Code: Best practices](https://code.claude.com/docs/en/best-practices) and `mattpocock/skills` `grilling`.
- **The plan convention** (`AGENTS.md` convention 8 in the root; convention 5 in each `templates/<stack>/AGENTS.md`, or `templates/base/AGENTS.md` once `intent/monorepo-apps/spec.md` moves it) becomes: interview the engineer in rounds as above until the plan is concrete (page 19); write `plan.md` with the sections Files that change, Order of work, Risks, and Proof (page 20); answer in Risks what the change could break, which step is most risky, and what options were not chosen (page 19, step 3); iterate until an engineer who never saw the conversation could implement it (page 20, step 4); start `plan.md` with `Accepted by: @<engineer>` (page 20: logged "along with who accepted it"). Only a plan-mode session the engineer started writes the first `plan.md`. A later commit that departs from the plan updates it (page 20, step 7).
- **`write-spec`** and the spec job end at `spec.md` and never write `plan.md`.
- **`.agents/review.md`** (rendered to `REVIEW.md`) flags a `plan.md` with no `Accepted by:` line. The code owner who approves confirms the named engineer accepted it (page 39).

### Requirements and design

- **`write-spec`** (root and `templates/base/`) adds the step this repository's specs already follow by hand: under the status line, name the `main` commit the spec was written at and quote what the product owner's prompt added to the skill's prompt, or say it added nothing (page 16, step 2; page 17). The skill's quoted prompt does not change. The spec job writes the same line, quoting "no product owner prompt; written by `spec-on-intent-merge.yml`".
- **Policy skills** keep their placeholder until each owner provides the policy (page 25). See **Areas of concern**.

### Feedback loop

| Check                      | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dependency-cruiser         | The templates pin `dependency-cruiser` 18.7.1 (`templates/nextjs/package.json`, line 59), whose `src/meta.cjs` still says `typescript: ">=2.0.0 <7.0.0"` (line 14, from `npm pack dependency-cruiser@18.7.1` on 2026-11-09), with TypeScript 7.0.2 (line 71). **Proposal:** give dependency-cruiser a TypeScript it supports through pnpm `packageExtensions`, and add `--validate` output checking to `depcruise` so a run that cruises 0 modules fails. The plan proves the mechanism by running it. |
| `AGENTS.md` healthy output | **Verifying your work** names the output of a run that cruised the project's modules, copied from that run.                                                                                                                                                                                                                                                                                                                                                                                            |
| editorconfig-checker       | `editorconfig-checker` 7.0.0 downloads its binary on first use (`CONTRIBUTING.md`, line 15). **Proposal:** replace it with an npm package whose tarball carries the binary, checked by `npm pack`; if none is maintained, remove it and record in `CONTRIBUTING.md` which `.editorconfig` properties Prettier does not enforce. Unverified: no such package was found in this session.                                                                                                                 |
| UI stacks' `AGENTS.md`     | `nextjs`, `payload`, `turborepo` (those with `.mcp.json`): after a UI change, open the changed page with the Playwright MCP, take a screenshot, look at it, and compare it with the approved mock when there is one (page 32, step 5).                                                                                                                                                                                                                                                                 |
| Every `AGENTS.md`          | One line: the `verifier` subagent (`.claude/agents/verifier.md`) runs the app and checks the change before the session reports done.                                                                                                                                                                                                                                                                                                                                                                   |

### Continuous evals in CI

- `evals/` holds one YAML case per behavior: a prompt, the fixture state, and deterministic checks on the result (files written, commands run, text present). The first cases: the loop-autonomy case (`intent/loop-autonomy/spec.md`, **Proof**), the spec job stopping at `spec.md`, and `plan.md` naming its engineer.
- `scripts/run-agent-evals.ts` runs each case with `claude -p` under the exact allowlist and writes the pass rate.
- **Placement, aligned with `intent/ci/spec.md`:** a check is skipped by a job condition, never by `paths`, and **All Checks** is the one required check. So the eval suite is an `agent-evals` job in `ci.yml`, not a separate `agent-evals.yml` as on page 35. The `changes` job outputs `agent_instructions`, true when the change touches `CLAUDE.md`, `AGENTS.md`, `.claude/**`, `.agents/**`, `.cursor/**`, or `evals/**` (page 34, step 3, plus this project's instruction paths). `agent-evals` runs when it is true and nightly through `ci.yml`'s `schedule`, and **All Checks** needs it, so "The pass-rate threshold is enforced as a merge check" (pages 34–35).
- **Fork pull requests.** "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner" for a workflow triggered from a fork ([GitHub Docs: Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)), so `agent-evals` has no Claude credential there. It does not switch to `pull_request_target`, which `intent/ci/spec.md` allows only for `pr-triage.yml`. Instead, on a fork pull request that changes agent instructions, `agent-evals` fails with a message asking a maintainer to push the branch to the repository and open it from there, where the eval runs after the maintainer has read the change. The merge check therefore never passes without an eval run. This matters in the root, which is public; a private template repository has no outside forks in practice.
- **Proposal:** a 90% threshold, set in `evals/threshold.json`. No source gives a number; the product owner sets it.

### PR review loop

**`@claude` fix loop.** `.github/workflows/claude.yml`, from Anthropic's example (`anthropics/claude-code-action` `examples/claude.yml`), in the root and `templates/base/`: on `pull_request_review_comment` and `pull_request_review` that mention `@claude`, from a same-repository head only.

**Babysit loop.** `.github/workflows/babysit-pr.yml`, in the root and `templates/base/`:

- Starts on `pull_request_review` (`submitted`) and `pull_request_review_comment` (`created`), the events Anthropic's example uses.
- Runs only when all hold: the pull request's author is the loop App's bot, or it carries the `agent-opened` label (**Proposal:** the agent adds that label to every pull request it opens from an interactive session); the head is in the same repository, so secrets never reach a fork; the review state is not `approved`; the review or comment is not by the loop App's bot; a comment belongs to no review that already started a run (`pull_request_review_id` of a review submitted in this run's window).
- `concurrency: { group: babysit-${{ github.event.pull_request.number }}, cancel-in-progress: false }`, so a new review waits.
- Claude runs `babysit-pr` with `--permission-mode dontAsk` and an allowlist of `Read`, `Glob`, `Grep`, `Edit`, `Write`, and the project's `pnpm` check commands. It writes, as `--json-schema` output (as the triage job does, `ci.yml`, line 389), one reply per thread: what changed or why nothing changed.
- Later steps, outside Claude, commit and push with the loop App's token, post each reply with the attribution footer, and resolve each thread. The job never approves or merges.

**`.agents/review.md`** (root and `templates/base/`), rendered to `REVIEW.md`:

- The Compliance pass checks "spec.md, plan.md, our design principles, and the brand, security, compliance, and UX policy skills" (page 26).
- A new line: flag a change that makes `AGENTS.md` outdated, and when a mistake is flagged a second time, propose the `AGENTS.md` correction (page 38, step 5).

### Production gate hook

`agent-production-gate.sh` checks for "production" (`templates/base/.agents/hooks/agent-production-gate.sh`, line 4); the environment is `prod` (`templates/base/.github/workflows/deploy.yml`, line 21). After this change a `prod` deploy is a tag push, so the hook blocks without `RELEASE_APPROVAL`:

- `git push` of a ref matching the release tag pattern (`v*`), or with `--tags` or `--follow-tags`;
- `gh workflow run` or `gh api …/dispatches` naming `deploy` or `rollback` with `prod`;
- any `railway` command with `-e prod` or `--environment prod`.

The hook is in the constitution (`.claude/settings.json`, line 21), so it ships through its own issue (`constitution-changes.md`). The organization deploys it in managed settings without `allowManagedHooksOnly` (intent, step 5).

### CI/CD integration and deployment

**Step 1.** `templates/base/.github/workflows/ci.yml` gets the root's **Triage failed build** job, with the `ANTHROPIC_API_KEY` secret in place of federation.

**Step 3.** Every job that calls Claude:

- Uses `--permission-mode dontAsk --allowedTools <exact list>` ([Claude Code: Permission modes](https://code.claude.com/docs/en/permission-modes)), with no `WebFetch` or `WebSearch`, and no production credential in its environment.
- When the allowlist includes a shell command, installs `bubblewrap` and `socat` and runs with `sandbox.enabled: true`, `sandbox.network.allowedDomains` set to the package registry only, and `sandbox.failIfUnavailable: true`, so the job fails instead of running unsandboxed ([Claude Code: Sandboxing](https://code.claude.com/docs/en/sandboxing): domains "start empty"; Linux needs "`bubblewrap`" and "`socat`").
- Ubuntu 24.04 restricts unprivileged user namespaces through AppArmor, which "keeps the sandbox from starting" until a `bwrap` profile is added (same page). Whether GitHub's `ubuntu-latest` runner has the restriction on is unverified; the plan's first step runs the sandbox there and adds the documented AppArmor profile if needed.
- The egress-firewall runner waits for GitHub's release (intent).

**Step 4. Proposal:** expose deploy, status, and rollback through the GitHub MCP server's Actions tools (`actions_run_trigger`, `actions_list`, `actions_get`), which trigger `deploy.yml` and `rollback.yml` and read their runs, instead of a custom MCP server (`platform-and-library-first.md`). Scope per environment comes from the environment's ref policy, the tag ruleset, and the hook, not from the MCP server: the agent can trigger `dev` and `uat` work and cannot create the `prod` tag.

**Step 5, tiered autonomy.**

| Environment | Who deploys                                                                   | How                                                                         |
| :---------- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `dev`       | CI, on each push to `main` after checks pass (`intent/monorepo-apps/spec.md`) | By digest                                                                   |
| `uat`       | Anyone with write access, the agent included                                  | `deploy.yml` `workflow_dispatch` with a commit on `main` that reached `dev` |
| `prod`      | The release team                                                              | Pushing a `v*` tag on a `main` commit that reached `uat`                    |

- `deploy.yml` gains `on: push: tags: ["v*"]`. A tag run deploys `GITHUB_SHA`, the tagged commit ([GitHub Docs: Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)), and takes no commit input. Its `verify` job requires that commit on `main` and a successful `uat` deployment record for each app it deploys. The `if: github.ref == 'refs/heads/main'` on both jobs (lines 36 and 77) becomes: `main` for `uat`, a `v*` tag for `prod`.
- A tag ruleset on `refs/tags/v*` with "Restrict creations", "Restrict updates", "Restrict deletions", and "Block force pushes", bypassed only by the release team, not by the loop App or the Claude GitHub App ([GitHub Docs: Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)).
- The `prod` environment's deployment branches and tags: the `v*` tag pattern and `main` (for **Rollback**). Deployment branches and tags are "available for private repositories" on GitHub Team ([GitHub Docs: Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).
- **Independent check before `prod` credentials, answered:** none on GitHub Team for a private repository. On that page, required reviewers, wait timers, and custom deployment protection rules are "only available for public repositories" on Free, Pro, and Team. A release-team member who tags an unreviewed commit runs that commit's workflow with `prod` secrets; `SETUP.md` and the README record this as the release team's trust.
- The template READMEs drop the advice to add required reviewers; `SETUP.md` adds the tag ruleset, the environment ref policy, and the managed-settings hook.

**Deployment records.** `intent/monorepo-apps/spec.md` deploys each changed app by digest to its own Railway service. Each deploy job, after the health check passes, creates a deployment with `POST /repos/{owner}/{repo}/deployments`, `ref` set to the deployed commit SHA ([GitHub REST API: Deployments](https://docs.github.com/en/rest/deployments/deployments)), `environment` set to `dev`, `uat`, or `prod`, `task` set to `deploy:<package name>`, `payload` holding the image digest and the run's `run_id`, and `auto_merge: false`, because the API's default `true` "Attempts to automatically merge the default branch into the requested ref" (same page), which must not happen for an older promoted commit. It then posts a `success` status with `auto_inactive: false`, so a later deploy of another app does not add an `inactive` status to it. The job needs `deployments: write`.

GitHub's records are not a trusted source for the gates. A person with write access can create a deployment and a status through the API, or from a workflow on another branch, and point it at any real run; nothing on GitHub Team binds a self-reported record to the app, environment, and digest. GitHub's artifact attestations could bind them, but `intent/monorepo-apps/spec.md` records no attestation, as its intent says, and whether a private repository on GitHub Team can use them is unverified: GitHub's attestation pages state no plan availability. Deployment statuses also expire: "GitHub retains records of previous deployment statuses for 90 days" ([GitHub REST API: Deployment statuses](https://docs.github.com/en/rest/deployments/statuses)).

So the gates read the deployment platform, which records what actually ran and which only the environment's own credential can write:

- **Receipt.** Railway's deployment history for the app's service in that environment, read through Railway's public API with that environment's project token. A deploy or rollback writes it only with the `RAILWAY_TOKEN` of the matching GitHub environment, which "can only be used to authenticate requests to that environment" (Railway docs: Public API, as `intent/monorepo-apps/spec.md` cites). A writer without that environment's secret cannot forge a `prod` entry, and a `dev` deployment cannot stand in for a `prod` one because each environment's history is separate.
- **Promotion** to `uat` or `prod` requires a successful Railway deployment of the same digest for each app in the previous environment. The `verify` job reads it with the previous environment's token, stored as a read-only-use secret of the target environment. **Proposal:** a separate project token for this, so the target environment never holds a token it deploys with elsewhere.
- **Rollback** requires a successful Railway deployment of the requested digest for that app in that environment.
- **GitHub records** stay as the team's view of which commit and digest are where: each deploy writes one with `auto_merge: false` and `auto_inactive: false`, as above, but no gate trusts it.
- **Retention.** Unverified: Railway's documentation was blocked in this session, as `intent/monorepo-apps/spec.md` records, so whether Railway's deployment history returns the image digest, and for how long it keeps entries whose image is past its "Image retention policy" (intent), is not confirmed. The plan proves both first. The rollback window is then the shorter of that retention and how long GitHub Container Registry keeps the image, and `SETUP.md` states it.

**Step 6, rollback.** `.github/workflows/rollback.yml` in `templates/base/`:

- `workflow_dispatch` on `main` with `environment` (`dev`, `uat`, `prod`), `app` (package name), and `digest`.
- Refuses a digest that has no successful Railway deployment for that app in that environment (**Deployment records**), so it returns only to code released there before.
- Deploys the digest with the same Railway calls as a deploy (`serviceInstanceUpdate`, then `serviceInstanceDeployV2`, `intent/monorepo-apps/spec.md`), records a deployment, and posts a summary to the workflow run and, **Proposal**, to the team's channel that `SETUP.md` names (page 52's example).
- `prod` admits it because the environment allows `main`; the release `deploy.yml` job still refuses `prod` from any ref but a `v*` tag. Every workflow on `main` arrives through a pull request that a code owner approves under the `main` ruleset (`SETUP.md`, step 3), which is the trust that admits it.
- In `dev` and `uat` the agent runs it; in `prod` the agent may trigger it as a pre-approved runbook (pages 49–51), and the hook still requires `RELEASE_APPROVAL` for a person's agent session.
- `SETUP.md` and the loop guide say a rollback does not undo data changes ([Heroku Dev Center: Releases](https://devcenter.heroku.com/articles/releases)).

**Rollback in the root.** A `rollback` job in `release.yml`, on `workflow_dispatch` with a `version` input, in the `Release` environment with `id-token: write`, runs `npm dist-tag add @next-friday/create-app@<version> latest`. The job installs npm 11.21.0 or later first: "dist-tags with OIDC Trusted publishing requires npm CLI version 11.21.0 (or later)" (same page), and Node.js 24.22.1 from `.nvmrc` bundles npm 11.19.1 (`deps/npm/package.json` at `nodejs/node` `v24.22.1`). npm's trusted publishing page says "OIDC authentication supports `npm publish`, `npm stage publish`, and the dist-tag operations", with **Allow npm dist-tag** turned on per configuration (`npm/documentation` `content/packages-and-modules/securing-your-code/trusted-publishers.mdx`). The same page does not mention `npm deprecate`, so a maintainer runs `npm deprecate @next-friday/create-app@<bad> "Use <version>"` with their own account. `CONTRIBUTING.md` **The loop** writes the procedure, and `bands.yaml`'s `runbook:rollback-deploy` names it.

### Confidence gates

Every stage that no person starts ends in a pull request a person merges, so the gate runs before that pull request opens:

- **Deterministic**, in each job before it opens a pull request: the spec job checks that `spec.md` has the header, provenance line, and the five sections; the babysit job runs the project's checks; the band detection script is unit tested.
- **Adversarial**: Claude Code Review and Bugbot review every pull request (`SETUP.md`, steps 4 and 5), and they run independently of the agent that wrote it (page 48).

A failed gate opens no pull request, comments on the source pull request or run, and leaves the work to a person.

### Closing the loop

`scripts/detect-control-band.ts`, unit tested, reads `bands.yaml` and computes the CI test failure rate from the Actions API over a rolling 30 days with Western Electric rules (page 50). A nightly `control-band.yml` runs it. 1σ logs to the run summary; 2σ runs Claude read-only with the tools `bands.yaml` lists; 3σ opens an `intent.md` pull request with the finding, or triggers `rollback.yml` in the templates. In the root and `templates/base/`.

### Lessons

`lessons/README.md` in the root and `templates/base/` says a post-mortem goes in `lessons/<yyyy-mm-dd>-<incident>.md` and that a lesson that changes agent behavior also becomes an eval case (pages 48–51, step 7: "add an eval for the incident") or, when it repeats a mistake, an `AGENTS.md` correction (page 38, step 5).

### How to measure it

The loop guide (`apps/docs`; `CONTRIBUTING.md` in the root) has one row per play the project has: the play, its leading and lagging indicators as the playbook names them, and where each is read (git history, pull request metadata, the CI API, the OpenTelemetry export). The first named row is the time spent waiting at each gate, read from hook decisions in the OpenTelemetry export (page 44). The other indicators are not in this spec because the playbook PDF was not available; the plan copies them from the playbook with page numbers. `SETUP.md` step 4's OpenTelemetry line names the indicators it feeds. `intent/loop-autonomy/spec.md`'s two indicators join the table.

### Entering the loop

- **Loop guide.** `apps/docs/src/content/docs/loop.md` in the docs template: a link to the playbook, then one row per stage (Plan, Design, Build, Test, Deploy, Maintain): who acts, and the file, skill, workflow, or command that carries it out. It links rather than copies. `SETUP.md` **How a change flows** links to it instead of listing the stages.
- **Status skill.** `.agents/skills/loop-status/SKILL.md`, in the root and `templates/base/`: for each `intent/<change>/`, read which files exist, their `Status:` lines, and their pull requests (`gh pr list --state all --search "intent/<change>"`), and print the stage, the gate it waits on, who acts next, and the next step. It shows as blocked: a pull request whose runs wait for **Approve workflows to run** (run status `action_required`), a failed handover run, or a failed or skipped check. It encodes a repeated step, not a policy, so it has no policy owner (page 11).
- **Reminder.** A `SessionStart` hook in `.claude/settings.json` and a `sessionStart` hook in `.cursor/hooks.json` both run `.agents/hooks/agent-loop-status.sh`, which prints the status skill's summary. Claude Code adds its output "as context that Claude can see and act on" with "No blocking or decision control" ([Claude Code: Hooks](https://code.claude.com/docs/en/hooks)). **Cursor, answered:** Cursor has `sessionStart`, whose output field `additional_context` is "Additional context to add to the conversation's initial system context", and which "runs as fire-and-forget" ([Cursor: Hooks](https://cursor.com/docs/agent/hooks)). So the script prints Cursor's JSON when it runs under Cursor. All three files are in the constitution (`.claude/settings.json`, lines 21–25), so they ship through their own issue.
- **Setup skill.** `.agents/skills/project-setup/SKILL.md` in `templates/base/`: read `SETUP.md`, do each step an agent can do in the session, and list the rest with who does each, as `SETUP.md` names them. It holds no steps of its own.

### Across the plays

- **API key in the templates.** Every Claude job in the templates uses the `ANTHROPIC_API_KEY` secret, as the playbook's eval example does (pages 34–35). This departs from page 45, step 3's "short-lived scoped tokens" and from Anthropic's own workflows, which use workload identity federation (`anthropics/claude-code-action`, `.github/workflows/issue-triage.yml`). Reason: it follows the playbook's own eval example (pages 34–35), and federation needs an Anthropic federation rule and organization ID configured for each consumer (`anthropic_federation_rule_id` and `anthropic_organization_id`, `ci.yml`, lines 382–383), while an API key is one secret. The second part is this spec's proposal. `SETUP.md` step 4 records the departure. The root keeps federation.
- **Removing a play** later starts from its own `intent.md` (page 11).

### Files that change

| File                                                                                                            | Root | Templates                                     | Constitution issue |
| :-------------------------------------------------------------------------------------------------------------- | :--- | :-------------------------------------------- | :----------------- |
| `intent/README.md`, `write-intent`, `write-spec` skills                                                         | Yes  | `base`                                        | No                 |
| `AGENTS.md` plan convention, Verifying your work, Playwright and verifier lines                                 | Yes  | each stack, or `base` after monorepo-apps     | No                 |
| `.agents/review.md` → `REVIEW.md`                                                                               | Yes  | `base`                                        | No                 |
| `.github/CODEOWNERS`, `CONTRIBUTING.md` **The loop**                                                            | Yes  | No                                            | No                 |
| `.github/workflows/spec-on-intent-merge.yml`, `claude.yml`, `babysit-pr.yml`, `control-band.yml`                | Yes  | `base`                                        | No                 |
| `.github/workflows/ci.yml` (`agent-evals`, triage in templates)                                                 | Yes  | `base`                                        | No                 |
| `.github/workflows/deploy.yml`, `rollback.yml`                                                                  | No   | `base`, `turborepo` until monorepo-apps lands | No                 |
| `.github/workflows/release.yml` (`rollback` job)                                                                | Yes  | No                                            | No                 |
| `evals/`, `scripts/run-agent-evals.ts`, `scripts/detect-control-band.ts`, `lessons/`                            | Yes  | `base`                                        | No                 |
| `.agents/skills/loop-status/`, `.agents/skills/project-setup/` (templates only)                                 | Yes  | `base`                                        | No                 |
| `package.json` (`depcruise`, editorconfig check)                                                                | Yes  | each stack                                    | No                 |
| `SETUP.md`, READMEs                                                                                             | No   | `base`, each stack                            | No                 |
| `apps/docs/src/content/docs/loop.md`                                                                            | No   | docs template                                 | No                 |
| `.agents/hooks/agent-production-gate.sh`, `agent-loop-status.sh`, `.claude/settings.json`, `.cursor/hooks.json` | Yes  | `base`                                        | Yes                |

Rendered copies under `.claude/` and `.cursor/` are regenerated with `pnpm rules:sync`, in a generated project for the templates (`AGENTS.md`, "Template rule copies").

### Order of work

Each play after the ones it depends on (page 8):

1. Open the constitution issue for the production gate, the loop-status hook, and both hook configurations.
2. The feedback loop: dependency-cruiser and editorconfig-checker, so later proofs run on real checks.
3. Intent home, interviews, and `write-spec` provenance: skill and `AGENTS.md` text.
4. The loop GitHub App, then the sandbox proof on `ubuntu-latest`, then the spec job, `claude.yml`, and `babysit-pr.yml`.
5. Evals in `ci.yml`, with the first cases.
6. Deployment records, the tag-based `prod` deploy, `rollback.yml`, and the root's `rollback` job, after `intent/monorepo-apps/spec.md` and `intent/ci/spec.md` land.
7. Control band, lessons, root `CODEOWNERS` and `CONTRIBUTING.md`.
8. Loop guide, status skill, setup skill, and the reminder once the constitution issue merges.

## Proof

- Merging a test intent in a generated project opens a `spec.md` pull request from the loop App whose checks start without **Approve workflows to run**, and whose spec passes the deterministic gate.
- On that pull request, a review comment starts one babysit run, which pushes a fix, replies, and resolves the thread; its own reply starts no run; an approval starts no run.
- `pnpm depcruise` in a generated `nextjs` project reports more than 0 modules cruised, and fails on a deliberately broken TypeScript parse.
- `pnpm verify` passes with GitHub's releases API unreachable, after `pnpm install`.
- A pull request that changes `AGENTS.md` runs `agent-evals`, and lowering the pass rate below the threshold fails **All Checks**.
- In a consumer project: a person without the release team role cannot push `v1.0.0`; the release team's tag on a commit that never reached `uat` fails `verify`; `rollback.yml` refuses a digest never deployed to that environment and accepts the previous one. A forged GitHub deployment record for `prod` that points at a successful `dev` run of the same commit and digest does not make that digest eligible for a `prod` rollback.
- In the root: the `rollback` job moves `latest` on a real test package published under the same trusted publisher setup, not in a dry run, proving dist-tag under OIDC with the pinned npm.
- The production gate hook blocks `git push origin v1.0.0` without `RELEASE_APPROVAL`, in a hook unit test.
- A Claude Code session and a Cursor session in a generated project both show the loop status at start.
- These consumer-project checks run only in a consumer project, not in this repository's CI.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review the loop App's permissions, the API key departure, the babysit job's write access, and the release team's trust before `prod`.
- **Root policy owners:** not named in any file; `CODEOWNERS` lists only `* @joetakara @next-friday-engineer`.
- **Product owner approving their own intent:** "Pull request authors cannot approve their own pull requests" ([GitHub Docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews)). An agent working under the product owner's account opens the intent pull request as the product owner, who then cannot give the code owner approval the `main` ruleset requires. **Proposal:** `/intent/` lists the product owner and one deputy (in the root, `@next-friday-engineer`); the deputy approves an intent the product owner authored, and the product owner's merge records acceptance (page 13). Pull requests the loop App opens are not authored by a person, so the product owner approves them directly.
- **Sandbox on GitHub runners:** unverified; the plan proves it first.
- **editorconfig-checker replacement:** no package that bundles the binary was verified.
- **Release team's trust before `prod`:** no independent check exists on GitHub Team for a private repository.
- **Constitution:** hooks and hook configuration need their own issue, and the reminder and production gate wait for it.
- **Order with other specs:** `intent/monorepo-apps/spec.md` and `intent/ci/spec.md` change the same `ci.yml`, `deploy.yml`, `AGENTS.md`, and `SETUP.md`. This spec's deploy work lands after both.
- **API budget:** evals, the babysit loop, triage, the spec job, and the band diagnosis each call the API (intent, **Affected users and systems**).
- **Unverified playbook indicators:** listed by the plan from the PDF, which this session did not have.

## Open questions

Answered from the intent:

- Which plays apply to the root: **Which plays apply to the root**.
- Status values: **Status values**.
- Which token the handover uses, and who creates it: **Automated handover**.
- Whether Claude Code's sandbox runs on GitHub's Ubuntu runners: carried to the plan's first step (**Areas of concern**).
- Whether GitHub Team offers an independent check before `prod` credentials: no (**Step 5**).
- How the `prod` environment admits rollback: **Step 6**.
- How deploys record the commit they deployed: **Deployment records**.
- Whether the root's release can run `npm dist-tag` and `npm deprecate` under trusted publishing: `dist-tag` yes, `deprecate` not documented (**Rollback in the root**).
- How the product owner approves their own intent pull request: proposal in **Areas of concern**.
- Whether Cursor has a `SessionStart` equivalent: yes, `sessionStart` (**Entering the loop**).

Carried forward:

- Who the root's four policy owners are. No file names them, and only the organization can.
- The eval pass-rate threshold (proposal: 90%).
