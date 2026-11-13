# Intent: Record who approved at every gate

Author: Joe Takara (Developer Productivity). Status: draft.

## Problem

The AI-native SDLC Playbook makes the chain of commits the audit trail: "who asked for what, what the agent produced, and who approved it" (page 7). In the `sdlc` plugin, some gates leave no record of the decision, and at others the agent types the record itself. The paths below are under `plugins/sdlc/source/skills/sdlc-mode/playbooks/` unless they start elsewhere.

A decision made in the chat, which the agent then writes down:

1. The plan. The playbook says "The plan and its revisions are logged along with who accepted it" (page 20). `build.md:25` has the agent write the `Accepted by:` line, and `plugins/sdlc/source/scripts/check-plan.ts:28` checks only the line's form.
2. The plan of a bug fix. `fix.md:17` does the same.
3. The plan's revisions before it is accepted. They happen in the chat and reach no commit.
4. A higher-risk change. The playbook says it "goes to a tech lead or architect" (page 20). `build.md:24` has the agent say so, and nothing records that approval.
5. The spec's skill versions. The playbook says "The spec, the prompt that produced it, and the skill versions in force are all logged in version control" (page 17). `design.md:11` records the request, and no step records the version of the skills.
6. The spec's areas of concern. The playbook says the product owner "routes flagged concerns to the named policy owners" (page 17). `design.md:15` lists the concerns, and a spec is accepted with no written decision on any of them.
7. The intent's author. The playbook says the committed intent "lists the author, the timestamp and the full revision history" (page 13). `plan.md:6` takes the author from `git config user.name`, the name set on the machine the session runs on, which is the originator only when the session runs on the originator's machine, and the originator's yes to the draft stays in the chat.

A hook that decides and keeps no record:

8. The playbook says "Allow and block decisions are logged with a timestamp" (page 41). None of the five hooks under `templates/base/.agents/hooks/` writes one.
9. The playbook says the gate "defines what counts as approval" (page 41) and that "a named release manager authorizes" the release (page 46). In `templates/base/.agents/hooks/agent-production-gate.sh:19` to `:22`, any value of `RELEASE_APPROVAL` but an empty one, `0`, `false`, and `no` lifts the gate, and nothing records who set it.

Evidence that rests on a setting a person makes, which nothing checks:

10. The playbook says "code owners approve those changes in PR review" (page 24). `templates/base/.github/CODEOWNERS` holds only a comment.
11. The playbook says "Skill invocations are logged in session traces" (page 26) and names the OpenTelemetry export as where a session is logged (page 33). The export is one line of `templates/base/SETUP.md:76`.
12. The playbook says "Approval comes from a human through branch protection" (page 39). The ruleset is a manual step of `templates/base/SETUP.md:58`.

A part that is missing:

13. The playbook says verification before a task is reported done is "implemented as hooks where the organization wants them guaranteed" (page 33). No hook does it.
14. The playbook says "findings, fixes, ratings and approvals are logged in the PR history" (page 39). `review.md:3` puts the findings in the reply when the session cannot reach the host, and the plugin holds no way to rate a finding.
15. The playbook says "triage decisions are logged with a timestamp" (page 50). In `maintain.md:16`, the service owner schedules a finding by leaving its pull request open, which records nothing.
16. The playbook says "The pass-rate threshold is enforced as a merge check, runs are logged" (page 35). A generated project holds no eval case and no such check.

## Proposed outcome

- Items 1 to 4: `plan.md` is pushed and has a pull request before any code is written, so each revision is a commit. The engineer's acceptance, and the tech lead's or architect's for a higher-risk change, is an action on that pull request that the host records with a name and a time. The agent cannot write it for them. No merge is added.
- Item 5: the spec records the commit of the plugin that wrote it.
- Item 6: each area of concern has a decision and the name of who made it, on the spec's pull request, before the spec is accepted.
- Item 7: the intent names the originator as a person, not as the session, and the originator's acceptance of the draft is recorded on the intent's pull request.
- Item 8: every hook records each allow and each block with a timestamp.
- Item 9: lifting the production gate records who lifted it and which approval record it names. A value that does not match the form the organization sets does not lift the gate.
- Items 10 to 12: the project reports which of these settings is not made yet, and what the customer needs to make it.
- Item 13: a hook blocks a report that the task is done when the checks were not run.
- Item 14: the findings go on the pull request whenever one exists, and the tech lead has a place to rate a finding.
- Item 15: scheduling a finding leaves a record on its pull request.
- Item 16: a generated project holds eval cases that run as a merge check, and their runs are kept.
- Out of scope:
  - Rewriting a `plan.md` that already exists.
  - Changing a gate whose record the host already keeps: accepting an intent, accepting a spec, and approving code.
  - Adding a human gate the playbook does not have.

## Affected users and systems

- An engineer, and a tech lead or architect: accepts a plan on its pull request, not only in the chat.
- A product owner: records the decision on each area of concern before merging a spec.
- A release manager and a service owner: their decisions are recorded.
- The plugin: `plan.md`, `design.md`, `build.md`, `fix.md`, `review.md`, `maintain.md`, `deploy.md`, `check-plan.ts`, and the `setup-sdlc` skill.
- The templates: the five hooks, `SETUP.md`, the workflows, and the rendered copy of the plugin.
- `@next-friday/create-app` on npm: the change needs a new version. A project that already exists does not get it, because the CLI copies the files once.

## Constraints

- No merge gate is added: the playbook has the engineer "Accept the plan and let Claude implement" in one sitting (page 20).
- It works in a repository with one person, and in a session that cannot reach the host.
- The hooks and the workflows are in the constitution: a person commits them.
- What depends on the customer's environment, such as the host's plan or the monitoring stack, is not built in; the project says what the customer needs.
- The repository holds no log file.
- No eval grader is loosened.

## Open questions

1. What the engineer's acceptance on the pull request is. The host does not let a pull request's author approve it. **Proposal:** an approving review when another identity opened the pull request, and a comment with a fixed phrase from the engineer when the engineer is its author; a CI job reads it from the host.
2. Where a hook writes its record. **Proposal:** a file on the machine that git does not track, and the session trace when the OpenTelemetry export is on.
3. The form of a production approval record. **Proposal:** the organization sets the form in one settings file, such as `CHG-<number>`.
4. Whether a missing setting of items 10 to 12 fails a check or is only reported. **Proposal:** the `setup-sdlc` skill reports it, and `pnpm verify` in a new project does not fail on it.
5. Where a rating of a finding is kept. No proposal: the playbook says only "Once a month the tech lead tunes the setup by rating findings" (page 38).
6. Item 16 is larger than the others. **Proposal:** it stays in this intent and gets its own spec and pull request.
7. The order of delivery. **Proposal:** items 1 to 7, then items 8 and 9, then the rest.
