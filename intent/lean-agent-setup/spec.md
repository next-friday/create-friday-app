# Spec: A lean agent setup that matches the playbook

From `intent/lean-agent-setup/intent.md`. Status: draft.

Written at `main` `7aac1c3` with the `write-spec` skill as committed there. The agent wrote it as the next step of the loop, under `AGENTS.md`'s "Asking the product owner"; the product owner asked for it through another session, and no product owner prompt added a constraint to the skill's prompt.

The playbook PDF was not available while this spec was written. Every playbook quote and page number below comes from the intent or from another spec on `main`; this spec adds none. `intent/multi-agent-support/spec.md`, written in the same pull request, moves the agent files this spec edits (rules to `.claude/rules/`, skills to `.claude/skills/`) and owns how each agent registers the hooks; this spec names files by their path on `main`. The templates' half assumes the monorepo layout of `intent/monorepo-apps/spec.md`: per-stack files move once into `templates/base/`, and the agent rules render once.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review.

## Requirements

1. **Constitution first.** Every change here to `.agents/rules/**`, `.agents/rules.json`, `.agents/hooks/**`, `.claude/settings.json`, `.cursor/hooks.json`, `.cursor/hooks/**`, `.husky/**`, `.lintstagedrc.json`, and the scripts agent settings deny ships through its own issue, as `constitution-changes.md` requires today, including the change that removes that rule.
2. **Corrections in place.** After that change merges, a correction to rules, hooks, or agent settings goes into the pull request where it is found, and code owners approve it there.
3. **Short rules.** The rules that load in every session state only this company's project conventions; overlapping rules are merged; `agent-owned-work`, `current-state-authority`, and `constitution-changes` are removed with every copy and entry that names them. No rule tells the agent how to talk to the person in the session.
4. **Small gates.** The shell gate blocks skipping Git hooks and, in Cursor only, a shell redirect or `tee` into a protected path inside the checkout. It blocks nothing outside the checkout and never blocks restoring a protected file to its committed state. Its test covers only these cases.
5. **Gates explain themselves.** A block names the command or path, the reason, and the route to approval, and reaches both the agent and the person. A gate that cannot run says so to the person.
6. **No test-edit marker.** The marker file, the test-edit gate, and their wiring are removed. `REVIEW.md` flags a bug-fix pull request that changes an existing test.
7. **Suppression check in CI.** The suppression check runs in CI on every pull request and in `pnpm verify`, not as an edit hook or before a push, and lists only directives of tools the project runs that no configured lint rule rejects.
8. **Production gate matches the production action.** The root's gate blocks publishing the npm package and approving a staged version; only `release.yml` stages the package, and a maintainer approves it.
9. **Agent settings.** The deny list keeps the check configuration it denies today and names only files that exist. The allow list pre-approves every read-only check `AGENTS.md` tells the agent to run. The templates deny reading `.env*` except `.env.example`, in Claude Code and in Cursor.
10. **Git hooks.** `pre-commit` runs gitleaks and lint-staged, lint-staged gives Markdown ESLint as well as Prettier, `commit-msg` runs commitlint, and `pre-push` only blocks pushing to `main`.
11. **One copy of each fact.** The review instructions live only in `REVIEW.md`, the stack replacement list only in `AGENTS.md`, and only `CLAUDE.md` imports `AGENTS.md`.
12. **No stale names.** No file names a path, tool, step, or dependency the project does not have: review paths, rule tools, the first-publish token, the CI change filter, the Dependabot groups, the deny list, `fast-check` where unused, Payload's pnpm settings outside Payload, ADRs, and the managed settings example's placeholders.
13. **`AGENTS.md`.** It states the merge gate as a rule, keeps the Git conventions no hook enforces, keeps only the 50-character subject limit for commit messages, drops the component-test question, and tells the agent what to do when something stops it.
14. **Skills.** `git-workflow` and `script-driven-changes` are removed with every copy and entry that names them.
15. **Logging rule.** It names what each app template logs through and where the logs go.

## Design

### The constitution change

`.claude/settings.json` denies agents edits to `.agents/rules/**`, `.agents/rules.json`, `.agents/hooks/**`, `.claude/settings.json`, `.cursor/hooks.json`, `.cursor/hooks/**`, `scripts/sync-agent-rules.ts`, `scripts/check-agent-gates.ts`, `.husky/**`, and `.lintstagedrc.json` (lines 13–33), and `constitution-changes.md` says "A developer changes the constitution through a dedicated issue, never inside a feature pull request". Most of this change edits those files, so:

- One issue lists every constitution file in **Files that change** and links this spec. A person makes the edits, because agent settings deny them to agents; the pull request closes the issue, and code owners approve it.
- That pull request also removes `constitution-changes.md` (requirement 2). From its merge on, a correction to a rule, hook, or agent setting goes into the pull request where it is found, and code owners approve it there (pages 24 and 38, from the intent). The deny list stays (requirement 9), so an agent still cannot make that edit on its own work (page 32); a person makes it in the same pull request.
- `intent/multi-agent-support/spec.md` changes the same files (`scripts/sync-agent-rules.ts`, `.claude/settings.json`, `.cursor/hooks.json`). **Proposal:** both specs' constitution edits ship in this one issue and pull request, so each file changes once.
- `AGENTS.md`, the skills, `REVIEW.md`, `CONTRIBUTING.md`, `.cursor/BUGBOT.md`, `.github/`, and the templates' `package.json` and `knip.json` are not in the constitution and ship in ordinary pull requests.

### Rules

`.agents/rules.json` lists 17 rules on `main`; 11 have no `globs` and load in every session, and `scripts/sync-agent-rules.ts` adds `.claude/rules/agents-guide.md` (lines 18–20). Claude Code loads "Rules without `paths` frontmatter … at launch" ([Claude Code: memory](https://code.claude.com/docs/en/memory)). **Proposal:** a rule stays when it states a convention of this company's projects that no configured check enforces; general advice moves into the rule it overlaps or goes.

| Rule on `main`                   | Loads  | Change                                                                                                                                                                                                                                                                                                                                                      |
| :------------------------------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-owned-work`               | Always | Removed (intent).                                                                                                                                                                                                                                                                                                                                           |
| `current-state-authority`        | Always | Removed (intent).                                                                                                                                                                                                                                                                                                                                           |
| `constitution-changes`           | Scoped | Removed (intent).                                                                                                                                                                                                                                                                                                                                           |
| `codebase-hygiene`               | Always | Kept. **Proposal:** absorbs `demand-driven-configuration` (a setting is code: add it for an active requirement, remove what nothing reads), `platform-and-library-first` (its order is the next step after "New code exists only when no current code can be changed to do the job"), and `single-author-style` (one author's style, one term per concept). |
| `demand-driven-configuration`    | Always | **Proposal:** merged into `codebase-hygiene`.                                                                                                                                                                                                                                                                                                               |
| `platform-and-library-first`     | Always | **Proposal:** merged into `codebase-hygiene`, keeping "State in the pull request why the first two fall short". `dependency-security.md`, which cites it, cites `codebase-hygiene.md` instead.                                                                                                                                                              |
| `single-author-style`            | Always | **Proposal:** merged into `codebase-hygiene`. Its pointers to `code-comments.md` and `descriptive-naming.md` go; those rules load on their own.                                                                                                                                                                                                             |
| `automation-owned-checks`        | Always | **Proposal:** removed. `AGENTS.md` **Verifying your work** already says what to run and to paste the output, and the new **When something stops you** says not to report a stopped check as done.                                                                                                                                                           |
| `code-comments`                  | Always | Kept. "Names, types, tests, ADRs, issues, and pull requests carry intent" becomes "Names, types, tests, the change's `intent/` files, issues, and pull requests carry intent": no project keeps ADRs, and the playbook's audit trail is "the intent, the spec, the plan, the diff and the review findings" (page 7, from the intent).                       |
| `descriptive-naming`             | Always | Kept, without "and report the existing name to the user"; the sentence ends at "Give new code a descriptive name".                                                                                                                                                                                                                                          |
| `evidence-before-claims`         | Always | Kept. `AGENTS.md`'s "Playbook claims" correction depends on it.                                                                                                                                                                                                                                                                                             |
| `no-suppression`                 | Always | Kept. It names only the scanners the project runs (below), and "stop and cite the tool's documentation to the user" becomes "cite the tool's documentation in the pull request".                                                                                                                                                                            |
| `dependency-security`            | Scoped | Kept. In the root it names Dependabot only (below).                                                                                                                                                                                                                                                                                                         |
| `deterministic-testing`          | Scoped | Kept, without "When the user asks to run tests, run the narrowest owning file or filter"; `AGENTS.md` **Commands** names the one-test command.                                                                                                                                                                                                              |
| `diagnostics-and-error-handling` | Scoped | Kept, without "Report unresolved type, declaration, or rule conflicts to the user"; **When something stops you** covers an unresolved conflict.                                                                                                                                                                                                             |
| `structured-logging`             | Scoped | Rewritten in the templates (**Logging**). **Proposal:** the root drops it: the root's CLI writes its user interface to the terminal and has no application logs.                                                                                                                                                                                            |
| `typescript-first`               | Scoped | Kept.                                                                                                                                                                                                                                                                                                                                                       |

After the change, five rules load in every session (`code-comments`, `codebase-hygiene`, `descriptive-naming`, `evidence-before-claims`, `no-suppression`) instead of 11 plus `agents-guide.md`. Each removed or merged rule leaves `.agents/rules.json`, `.claude/rules/`, `.cursor/rules/`, and `.cursor/BUGBOT.md`, in the root and in `templates/base/`.

**Tools a root rule names.** The root runs gitleaks (`.husky/pre-commit`, line 14), zizmor (`.github/workflows/zizmor.yml`), and Dependabot (`.github/dependabot.yml`), and no OSV-Scanner, Trivy, or hadolint (intent). The root's `no-suppression.md` lists `.github/zizmor.yml` and `.gitleaksignore` only, and its `dependency-security.md` says "Resolve a vulnerability that Dependabot reports". The templates' copies keep OSV-Scanner, Trivy, and hadolint, which `intent/ci/spec.md` keeps in the templates (**Scanners**).

### `AGENTS.md`

In the root and in the templates' `AGENTS.md` (each stack's copy until `intent/monorepo-apps/spec.md` moves it to `templates/base/`):

- **Convention 1** drops "Rules, hooks, and agent settings change as `constitution-changes.md` describes" and says instead: "A correction to rules, hooks, or agent settings goes into the pull request where it is found; agent settings deny those files to agents, so a person makes the edit, and code owners approve it."
- **Convention 4** keeps the list of stack files that replace `base` files and is its one home. `.cursor/BUGBOT.md` line 7 becomes a link to it. Under `intent/monorepo-apps/spec.md` the list empties, because `templates/turborepo/` goes and each app template is copied into its own folder; the convention then says so, and the link stays.
- **Convention 9**, the bug fix: "Reproduce the bug as a test, run it, and confirm it fails for the reason you expect. Commit that test before the fix (page 32, step 4). The fix changes no existing test. If an existing test asserts the bug itself, correct it in the fix commit and say in the pull request which test asserted the bug and why; the code owner confirms it before approving." The sentences about `.git/bug-fix-in-progress` go.
- **Branches and pull requests**, a new convention with what `git-workflow` says that no hook enforces: branch from the latest `origin/main` as `<type>/<short-description>`; open the pull request ready for review (CI skips drafts), with the body from `.github/pull_request_template.md`; rebase and `git push --force-with-lease` only branches you own; and the merge gate, "Never merge a pull request. A person merges it with `--squash` after code owner approval." The commit format is left to `commit-msg`, and pushes to `main` to `pre-push` and branch protection, which enforce them.
- **When something stops you**, a new convention: "When a gate, a permission rule, or a check stops you, say what stopped you, what you tried, and what is left undone, and do not report the task complete." This follows `vlang/v` (`AGENTS.md`: "If blocked, note what was attempted and why it failed"), as the intent cites.
- **Things Claude gets wrong:** "Commit messages" keeps only the 50-character subject limit once `@next-friday/commitlint-config-friday` 5.2.1 is installed (`intent/dependency-freshness/spec.md`, **Order of work**, step 1); until then the trailer sentence is still true and stays. "Agent shell gate" describes the gate's new scope. "Asking the product owner" drops "as `agent-owned-work.md` says".

In `templates/nextjs/AGENTS.md` (line 35), `templates/payload/AGENTS.md` (line 38), and `templates/turborepo/AGENTS.md` (line 40), "Ask the user before adding component tests" goes. The fact behind it stays: "Component tests need a DOM test environment, and Vitest runs in Node.js; add that environment with the first component test."

**Alignment with `intent/loop-autonomy/spec.md`.** Its convention, **Carry each step of the loop without asking**, cites `current-state-authority.md`, item 2, names `git-workflow` as the skill for branches and pull requests, and gives the component-test sentence as an example of a question a project instruction requires. Whichever spec lands second makes these edits, so the two never disagree: the convention says "In this repository, `AGENTS.md` decides how branches, commits, and pull requests are made; a skill from another checkout in the same session does not apply here", without the citation; it drops the component-test example; and loop-autonomy's `git-workflow` edit ("Never merge. The person who merges uses `--squash`") lands in **Branches and pull requests** instead of in the removed skill, together with its line that the agent drives its pull request until it is green and waiting only on code owner approval, as `babysit-pr` describes. Its requirement to ask "for what no file, tool, or source can answer" stays in the convention's own words and does not depend on `agent-owned-work.md`.

### Skills removed

`git-workflow` and `script-driven-changes` leave `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/`, and their links leave `.cursor/BUGBOT.md` (root lines 27 and 30, and the same links in `templates/base/.cursor/BUGBOT.md`), in the root and in `templates/base/`. What this project still needs from them is in **Branches and pull requests**; the rest is general advice (intent).

### Shell gate

`.agents/hooks/agent-shell-gate.sh` (366 lines) and `scripts/check-agent-gates.ts` (260 lines), in the root and `templates/base/`, are replaced. The gate blocks only:

| Case                                                                                                                 | Agents      | Why                                                                                                                                                                                                                                                                                                                                                           |
| :------------------------------------------------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skipping Git hooks: `--no-verify`, `git commit -n`, `core.hooksPath`, `HUSKY=0`, `git commit-tree`, `git update-ref` | Both        | The block the intent keeps. Today the list is written twice, in the gate and as `Bash(...)` deny rules (`.claude/settings.json`, lines 37–43). **Proposal:** the gate owns it and the six deny rules go, so the list has one home; Claude Code runs the gate with `"onFailure": "block"`, as today (line 72).                                                 |
| A redirect (`>`, `>>`) or `tee` whose target resolves inside the checkout to a path the deny list protects           | Cursor only | Claude Code already applies `Edit` deny rules "to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `tee`, and to the targets of Bash redirections" ([Claude Code: Permissions](https://code.claude.com/docs/en/permissions)). Cursor does not read Claude Code's permissions (`intent/multi-agent-support/intent.md`). |

It allows everything else, including any path outside the checkout (`~/.cursor/rules/`, `~/.claude/settings.json`, another repository) and restoring a protected file (`git checkout -- <path>`, `git restore <path>`), which the intent's run on 2026-11-09 found blocked.

- **One list of protected paths.** The shell gate, and Cursor's file-path gate (`.cursor/hooks/agent-constitution-gate.sh`, whose own copy of the list is on line 4), read the protected paths from the `Edit(./…)` entries in `.claude/settings.json` with `jq`, so the deny list is the one source. **Proposal:** a deny entry is either an exact path or a directory ending in `/**`; the gates support those two shapes, and `scripts/check-agent-gates.ts` fails on any other.
- **Which agent is running.** Cursor sends `cursor_version` in every hook's input ([Cursor: Hooks](https://cursor.com/docs/agent/hooks)); the gate applies the Cursor-only case when it is present. How each agent registers the gate is in `intent/multi-agent-support/spec.md`, **Hooks**.
- **The test.** `scripts/check-agent-gates.ts` keeps one case per row above, plus: a path outside the checkout is allowed; `git restore` of a protected path is allowed; `curl -o` into a protected folder is allowed, because the intent leaves other shell routes to code owner review; and each agent gets its output format below.

### Gate messages

Each gate prints one JSON object and exits 0, which Claude Code documents for structured control: "Instead of exiting with code 2 to block, exit 0 and print a JSON object to stdout" ([Claude Code: Hooks](https://code.claude.com/docs/en/hooks)).

| Agent       | Output on a block                                                                                                               | Who sees it                                                                                                                                                                                                |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code | `hookSpecificOutput` with `"permissionDecision": "deny"` and `permissionDecisionReason`, and `systemMessage` with the same text | Claude reads the reason ("blocks the tool call, and shows Claude the reason"), and `systemMessage` is a "Warning message shown to the user" ([Claude Code: Hooks](https://code.claude.com/docs/en/hooks)). |
| Cursor      | `"permission": "deny"`, `user_message`, and `agent_message`, as today (`.agents/hooks/agent-shell-gate.sh`, line 10)            | `user_message` is "shown to the user when denied", and `agent_message` is "fed back to the agent" ([Cursor: Hooks](https://cursor.com/docs/agent/hooks)).                                                  |

The text names the command or path, the reason, and the route. For a protected path: "Agent settings deny this file to agents. A person makes the change in this pull request, and a code owner approves it." Page 40, step 4: "A block should explain itself". The ending "stop and ask the user" (`.cursor/hooks/agent-constitution-gate.sh`, line 33; `.agents/hooks/agent-shell-gate.sh`, line 25) goes, because **When something stops you** now says what the agent does.

When `jq` is missing, the gate still blocks and prints both formats from a fixed string that tells the person to install `jq`, as `cdklabs/cdk-cicd-wrapper` (`.claude/hooks/guard-tmp-confinement.sh`) does (intent). Claude Code runs it with `"onFailure": "block"` and Cursor with `"failClosed": true`, as today.

### Production gate

- **Root:** `.agents/hooks/agent-production-gate.sh` blocks `npm publish`, `pnpm publish`, `npm stage publish`, `npm stage approve`, and `changeset publish`, also through `pnpm exec`, `pnpm changeset`, `npx`, `pnpm dlx`, or `bash -c`, with no approval variable. Only `.github/workflows/release.yml` stages the package, from the `Release` environment, after the version pull request merges, and a maintainer approves the staged version with 2FA (`CONTRIBUTING.md`, **Releasing**). Its message names `release.yml`, the `Release` environment, and the maintainer's approval. `intent/playbook-plays/spec.md` (**Which plays apply to the root**) marks hooks as approval gates as not applying to the root, because it has no production deploy, and leaves the root's copy as it is; this intent tailors that copy to the root's one production action (page 43: "a starting point to tailor"), so the play still does not apply and the two specs do not conflict.
- **Templates:** what the gate matches is `intent/playbook-plays/spec.md`'s (**Production gate hook**). This spec changes only its output, to **Gate messages**.

### Suppression check

The edit-time hook goes: its entries leave `.claude/settings.json` (lines 51–56) and `.cursor/hooks.json` (lines 5–10), in the root and `templates/base/`. The check stays in `pnpm verify` and in CI, which already runs it on each pull request that runs the Agent Gates job (`.github/workflows/ci.yml`, lines 92–93), and leaves `pre-push` with the rest of `pnpm verify` (**Git hooks**). `intent/ci/spec.md` decides which job conditions run it.

- **Proposal:** the script moves from `.agents/hooks/agent-suppression-gate.sh --repo` to `scripts/check-suppressions.sh`, because it is no longer a hook, and `suppressions:check` points there. Agent settings deny it, as they deny `.agents/hooks/**` today, so an agent cannot shorten the list on its own work (page 32).
- **The list.** Today 20 directives (line 4). Out, because a configured rule already rejects them or no tool here reads them: ESLint's disable and enable comments, inert under `--no-inline-config` (`package.json`, line 46); SonarQube's comment, rejected by `sonarjs/no-sonar-comments` (`node_modules/@next-friday/eslint-config-friday/dist/index.mjs`, line 1977); TypeScript's ignore and no-check comments, which `@typescript-eslint/ban-ts-comment` (line 2372) reports with its default options; and Python linters' comment, which belongs to tools no project runs. In the root also out: the comments of Semgrep, hadolint, and Trivy, whose tools only the templates run (`intent/ci/spec.md`, **Scanners**). The rest stays, including TypeScript's expect-error comment, which `ban-ts-comment` allows with a description and `tsc` still honours (intent).
- **Seen while writing this spec.** The edit hook blocked the first write of this file, because the spec named some directives in prose. `pnpm suppressions:check` reads the files the same way, so this spec names directives by tool, as the intent does.

### Test-edit gate

`.agents/hooks/agent-test-edit-gate.sh`, its entries in `.claude/settings.json` (lines 57–62) and `.cursor/hooks.json` (lines 17–22), and the **Start a bug fix with a failing test** convention's marker sentences are removed, in the root and `templates/`. `REVIEW.md`'s Compliance pass gains: "A pull request that fixes a bug changes no existing test, unless it names the test that asserted the bug and says why; flag any other test change as Important." Claude Code Review "never approves or blocks the pull request" ([Claude Code: Code Review](https://code.claude.com/docs/en/code-review)), so the code owner rejects it, as page 32, step 7 has it ("reject any change that touches a test").

### Agent settings

**Deny list** (`.claude/settings.json`, root and `templates/base/`):

- Removed: `Edit(./prettier.config.ts)` in the root, which has no such file (line 18; the root formats with `.prettierrc.json`, line 17); the six hook-skip `Bash(...)` rules (lines 37–43, **Shell gate**); the hook entries for the removed gates.
- Moved with their files: `Edit(./.agents/rules/**)` and `Edit(./.agents/rules.json)` follow the rules to `.claude/rules/` (`intent/multi-agent-support/spec.md`); `Edit(./scripts/check-suppressions.sh)` is added.
- Kept: the check configuration, hooks, agent settings, Git hook and config paths, and the three `gh … delete` rules. `Edit(./.claude/settings.local.json)` stays although the file is not committed, because each developer may create it.
- **Each entry exists:** `scripts/check-agent-gates.ts` fails when an `Edit(./…)` entry names a path that does not exist, other than `.claude/settings.local.json` and `.git/config.worktree`. For the templates it runs in a generated project, in the Template job, where the apps' config files exist.

**Allow list.** Pre-approved, so parallel sessions do not wait on a prompt (page 28):

| Where             | Added                                                                                                                   |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------- |
| Root              | `Bash(pnpm vitest run *)`, `Bash(pnpm lint:check)`, `Bash(pnpm typecheck)`, `Bash(pnpm knip)`, `Bash(pnpm rules:check)` |
| `templates/base/` | `Bash(pnpm vitest run *)`, `Bash(pnpm test:e2e)`, `Bash(pnpm check)`                                                    |

`pnpm lint` and `pnpm rules:sync` write files, so they are not pre-approved. When `AGENTS.md` **Commands** gains a read-only check, the allow list gains it in the same pull request.

**Reading `.env`, templates only.** `templates/base/.claude/settings.json` denies `Read(.env*)`, followed by `Read(!.env.example)`. Claude Code documents the carve-out: "In one settings file's `deny` list, `Read(*.env)` followed by `Read(!sample.env)` blocks every file whose name ends in `.env` at any depth, except files named `sample.env`" ([Claude Code: Permissions](https://code.claude.com/docs/en/permissions)). Cursor's counterpart, checked against its documentation: Cursor's default ignore list includes `.env*`, and in `.cursorignore` "`!` negates a pattern" ([Cursor: Ignore files](https://cursor.com/docs/context/ignore-files)). The default pattern also matches `.env.example`, so `templates/base/.cursorignore` holds `!.env.example`, and the agent can document each variable in `.env.example`, as the templates' `AGENTS.md` requires. Under `intent/monorepo-apps/spec.md` each app has its own `.env`, which both patterns match at any depth. The root has no `.env` and gets neither.

### Managed settings example

`templates/base/.claude/managed-settings.example.json` is tailored (page 43: "a starting point to tailor"):

- `permissions.allow` names the template's read-only checks, as the project allow list does, instead of `make build`, `make test`, and `make lint`.
- `permissions.deny` keeps `Read(.env*)` and adds `Read(!.env.example)`, because a carve-out "reaches only rules from the same source" ([Claude Code: Permissions](https://code.claude.com/docs/en/permissions)), so the project's carve-out cannot reopen a file managed settings deny. `Read(./secrets/**)` goes; no template has `secrets/`.
- `sandbox.network.allowedDomains` drops `git.internal.example.com`. **Proposal:** it lists `registry.npmjs.org`, `github.com`, and `api.github.com`, which `pnpm install` and `gh` reach, and the organization adds its own hosts.
- `strictKnownMarketplaces` with `example-corp/approved-plugins` goes; the organization adds its own marketplace when it has one.
- `allowManagedPermissionRulesOnly` goes: it makes "managed settings the only settings source of permission rules" ([Claude Code: Settings](https://code.claude.com/docs/en/settings-reference)), which would drop the project's deny list for the check configuration.
- `allowManagedHooksOnly` goes, because `intent/playbook-plays/spec.md` deploys the production gate in managed settings "without `allowManagedHooksOnly`" (**Production gate hook**).

### Git hooks

| Hook               | Root after                                                     | Templates after                                                                               |
| :----------------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `pre-commit`       | gitleaks, then lint-staged. The `main` block (lines 4–7) goes. | gitleaks, then lint-staged. The `main` block (lines 4–8) and `pnpm rules:check` (line 16) go. |
| `commit-msg`       | commitlint, unchanged                                          | commitlint, unchanged                                                                         |
| `pre-push`         | Blocks a push to `main`; `pnpm verify` (line 11) goes.         | Blocks a push to `main` except the one that creates it, unchanged; `pnpm check` goes.         |
| `pre-merge-commit` | None                                                           | Removed, with its name in each `.lintstagedrc.json` glob for `.husky/`.                       |

- **lint-staged.** `.md` runs `eslint --fix --cache --max-warnings=0 --no-warn-ignored --no-inline-config` before Prettier, in the root (`.lintstagedrc.json`, line 7, split from `yml` and `yaml`) and in each template's `.lintstagedrc.json`. ESLint lints Markdown in every project (intent).
- **Why.** None of the repositories the intent cites runs tests or a build in a Git hook, and page 27 puts "Heavier checks such as the full test suite … at the commit or the PR". The full checks run in CI on the pull request.
- **The cloud-session case.** A new Claude Code cloud session cannot push the root today: `pre-push` runs `pnpm verify`, whose `format:check` runs `editorconfig-checker` (`package.json`, line 42), which downloads its binary through the GitHub releases API on first use (`CONTRIBUTING.md`, line 15; `.github/workflows/ci.yml`, line 114). Where that API is unreachable, the push fails before any check of the code runs. This is the intent's hook that "needs more than the code". After this change `pre-push` downloads nothing, so the push goes through. `pnpm verify` still downloads it; replacing editorconfig-checker belongs to `intent/playbook-plays/spec.md` (**Feedback loop**).
- `CONTRIBUTING.md` (root lines 15 and 68–74; each template's prerequisites and Git hooks table) and each template `AGENTS.md`'s "What `pre-push` runs" row describe the hooks that remain. The `jq` prerequisite stays, for the agent gates.

### Review instructions

- `REVIEW.md` is the source, in the root and `templates/base/`. `.agents/review.md` and its line in `scripts/sync-agent-rules.ts` (root line 177; template line 172) go; `.cursor/BUGBOT.md` links `REVIEW.md` (root line 13; template line 5); and `templates/base/SETUP.md` lines 83 and 96 point to `REVIEW.md` and drop "then run `pnpm rules:sync`".
- **Generated paths.** `src/gen/` (line 21) goes. **Proposal:** the root names `CHANGELOG.md`, which Changesets writes (`CONTRIBUTING.md`, **Releasing**), and `pnpm-lock.yaml`; rendered agent files are left to `pnpm rules:check`, which CI runs. The templates name Payload's generated files, which `.cursor/BUGBOT.md` line 9 lists today and which move into `REVIEW.md` so the list has one home: `src/app/(payload)/**`, `src/migrations/**`, and `src/payload-types.ts` in each Payload app.
- `intent/playbook-plays/spec.md` edits `.agents/review.md` (**PR review loop**). Whichever lands second puts those lines in `REVIEW.md`.

### `CLAUDE.md` and `agents-guide.md`

`.claude/rules/agents-guide.md` and `claudeExtras` in `scripts/sync-agent-rules.ts` (lines 18–20) go, in the root and `templates/base/`. `CLAUDE.md` keeps `@AGENTS.md`.

### Templates

- **`fast-check`** leaves `templates/nextjs/package.json`, `templates/turborepo/package.json`, and `templates/turborepo/apps/app/package.json`, and its `ignoreDependencies` entry leaves `templates/nextjs/knip.json` and `templates/turborepo/knip.json`. `.cursor/BUGBOT.md` line 8 goes. Under `intent/monorepo-apps/spec.md`, the regenerated `nextjs` and `nextjs-liff` app templates do not list it until their tests import it.
- **Payload's pnpm settings.** `templates/base/pnpm-workspace.yaml` keeps only what every project needs, such as the `katex` override. `packageExtensions` for `payload`, `@payloadcms/*`, `graphql-http`, and `graphql-scalars`, and the overrides for `dompurify`, `happy-dom`, and `graphql-scalars`, move to the Payload template. This is the move `intent/monorepo-apps/spec.md` makes (**Each template**, `payload`), where the CLI merges `templates/payload/pnpm-workspace.yaml` into the root.

### Logging

`structured-logging.md` says to log "through the stack's logging library or the framework's logger" and to "send them to a store that keeps them longer than the host does" (`templates/base/.agents/rules/structured-logging.md`, line 3). The new text names each app template:

| App template                      | Logs through                                                                                                                                                                                                     |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nestjs`                          | Nest's `ConsoleLogger`, which writes JSON lines in production (`templates/nestjs/src/main.ts`, lines 15–17: `json: process.env.NODE_ENV === "production"`).                                                      |
| `payload`                         | `payload.logger`, a pino logger (`payload` 3.92.1 `dist/index.d.ts`, line 3: `import type { Logger } from 'pino'`, and line 405: `logger: Logger`; `npm view payload@3.92.1 dependencies.pino` prints `9.14.0`). |
| `nextjs`, `nextjs-liff`, `nodejs` | No logger yet. The app adds a logging library in the change whose code first logs, as `dependency-security.md` requires ("Add a dependency when active code … uses it"). **Proposal:** pino, which Payload uses. |

- `console.*` stays out of application code: the company config sets `"no-console": "error"` (`node_modules/@next-friday/eslint-config-friday/dist/index.mjs`, line 97).
- **Where logs go.** Each template writes to standard output and standard error, which the deploy host collects; the templates deploy to Railway (`templates/base/railway.json`). No template configures a log store, so "send them to a store that keeps them longer than the host does" goes.
- The intent left "whether the template adds one or the rule changes" to this spec: the rule changes, and no template adds a library its code does not use, which is the same reasoning that removes `fast-check`.

### Root housekeeping

| File                       | Change                                                                              |
| :------------------------- | :---------------------------------------------------------------------------------- |
| `.github/file-filters.yml` | `!docs/**` (line 4), `!.vscode/**` (line 14), and the image globs (lines 19–21) go. |
| `.github/dependabot.yml`   | `vite` (line 42) leaves `test-build-tooling`.                                       |

`intent/ci/spec.md` rewrites `ci.yml` and uses `file-filters.yml`; these lines go whichever lands first.

### Files that change

| File                                                                                           | Root | Templates                                 | Constitution issue |
| :--------------------------------------------------------------------------------------------- | :--- | :---------------------------------------- | :----------------- |
| `.agents/rules/**`, `.agents/rules.json`, rendered rule copies                                 | Yes  | `base`, each stack                        | Yes                |
| `.agents/hooks/` (shell, production, suppression moved to `scripts/`, test-edit removed)       | Yes  | `base`                                    | Yes                |
| `.cursor/hooks/agent-constitution-gate.sh`, `.cursor/hooks.json`, `.claude/settings.json`      | Yes  | `base`                                    | Yes                |
| `scripts/check-agent-gates.ts`, `scripts/sync-agent-rules.ts`, `scripts/check-suppressions.sh` | Yes  | `base`                                    | Yes                |
| `.husky/**`, `.lintstagedrc.json`                                                              | Yes  | `base`, each stack                        | Yes                |
| `package.json` (`suppressions:check`)                                                          | Yes  | each stack                                | No                 |
| `AGENTS.md`, `CONTRIBUTING.md`                                                                 | Yes  | each stack, or `base` after monorepo-apps | No                 |
| `.agents/skills/git-workflow/`, `.agents/skills/script-driven-changes/`, their copies          | Yes  | `base`                                    | No                 |
| `REVIEW.md`, `.agents/review.md` (removed), `.cursor/BUGBOT.md`, `SETUP.md`                    | Yes  | `base`                                    | No                 |
| `.claude/managed-settings.example.json`, `.cursorignore`                                       | No   | `base`                                    | No                 |
| `pnpm-workspace.yaml`; `package.json` and `knip.json` for `fast-check`                         | No   | `base`, `payload`, `nextjs`, `turborepo`  | No                 |
| `.github/file-filters.yml`, `.github/dependabot.yml`                                           | Yes  | No                                        | No                 |

### Order of work

1. Open the constitution issue, shared with `intent/multi-agent-support/spec.md`, and land it: rules, gates and their test, hook wiring, deny and allow lists, Git hooks, lint-staged, and the sync script.
2. `AGENTS.md`, the skills, `REVIEW.md`, `.cursor/BUGBOT.md`, `SETUP.md`, and `CONTRIBUTING.md`, in the root and the templates.
3. Root housekeeping.
4. Templates: `fast-check`, Payload's settings, the managed settings example, `.cursorignore`, and logging; in `templates/base/` and the app templates if `intent/monorepo-apps/spec.md` has landed, otherwise in each stack.
5. `pnpm verify` in the root, and in one generated project per template, as `AGENTS.md` describes.

## Proof

- `pnpm gates:check` passes and covers each case in **Shell gate**, both output formats, the block without `jq`, and the existence of each deny entry.
- In a generated project, through the gate: `cp x ~/.cursor/rules/` and `git restore .claude/rules/code-comments.md` are allowed; `git commit --no-verify` is blocked for both agents; with Cursor's input, `echo x > .cursor/hooks.json` is blocked.
- A Claude Code session that runs a blocked command shows the block to the person (`systemMessage`) as well as to Claude; a Cursor session shows `user_message`.
- In a new Claude Code cloud session on this repository, with no editorconfig-checker binary present, `git push` of a branch succeeds.
- Outside `intent/`, no file in the root or a generated project names `agent-owned-work`, `current-state-authority`, `constitution-changes`, `git-workflow`, `script-driven-changes`, `bug-fix-in-progress`, `agents-guide`, `.agents/review.md`, or `src/gen`: `git grep` for each finds nothing.
- In a generated project, `pnpm knip` passes with no `ignoreDependencies` entry for `fast-check`, and a project with no Payload app has none of Payload's `packageExtensions` or overrides.
- A Claude Code session in a generated project cannot read `.env` and can edit `.env.example`; the same holds in Cursor.

## Areas of concern

- **Policy skills:** the brand, security, compliance, and UX policy skills say "This policy is not written yet. Report that as an area of concern." No policy could be applied. The security policy owner, once named, should review moving the hook-skip list from deny rules into the gate, the narrowed shell gate, and the tailored managed settings.
- **Constitution change:** most of this spec ships through its own issue, as `constitution-changes.md` requires, and the rest waits for it. A person makes those edits, because agent settings deny them to agents.
- **Shell routes no gate sees:** Claude Code's deny rules do not apply "to arbitrary subprocesses that read or write files indirectly" ([Claude Code: Permissions](https://code.claude.com/docs/en/permissions)), and Cursor's ignore list does not cover "The terminal and MCP server tools used by Agent" ([Cursor: Ignore files](https://cursor.com/docs/context/ignore-files)). So `python -c`, `node -e`, or `curl -o` can still read `.env` or write a protected file. The intent accepts this: code owner review is the boundary, and the managed settings sandbox narrows it where an organization deploys it.
- **The hook-skip list in one place:** without the six `Bash(...)` deny rules, the block depends on the gate running. `"onFailure": "block"` in Claude Code and `"failClosed": true` in Cursor make a gate that crashes block, not pass.
- **`ban-ts-comment` defaults:** that the rule rejects TypeScript's ignore and no-check comments with its default options is unverified in this session; the plan checks typescript-eslint's documentation before those directives leave the list.
- **Railway log retention:** unverified, because Railway's documentation was not read in this session; the rule no longer promises a store, and a team that needs one starts its own intent.
- **Which rules stay:** the merge table is this spec's reading of "only rules about this repository's own conventions"; the product owner corrects it in review.
- **Order with other specs:** `intent/multi-agent-support/spec.md` changes and moves the same files; `intent/monorepo-apps/spec.md` moves per-stack files into `templates/base/`; `intent/loop-autonomy/spec.md` and `intent/playbook-plays/spec.md` edit `AGENTS.md`, `git-workflow`, and `.agents/review.md`, whose new homes this spec names; `intent/dependency-freshness/spec.md` installs the commitlint config that makes the trailer sentence stale; `intent/ci/spec.md` rewrites `ci.yml`. The plans need one agreed order.

## Open questions

The intent left two choices to this spec, both answered:

- How `nextjs` and `nodejs` log: the rule changes, and no library is added until code logs (**Logging**).
- Cursor's counterpart for reading `.env`, checked against Cursor's documentation: its default ignore list plus `!.env.example` in `.cursorignore` (**Agent settings**).

No question is carried forward.
