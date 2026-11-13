# Plan: Make a reply easy to act on, and finish the deploy target documents

Accepted by: @joetakara.

This plan covers every requirement of `intent/chat-reply-ux/spec.md` in two deliveries: requirements 1 to 5, then 6 to 16. It is accepted by merging the pull request that adds it, and the code of each delivery follows in its own pull request.

## Files that change

Delivery 1. Edited by the agent; no file of this delivery is in the constitution:

- `README.md` (changed): the paragraph on what every stack is built from names the deploy layer.
- `CONTRIBUTING.md` (changed): the paragraph on templates names the deploy layer, and the paragraph on checking a template says that a file with a `deploy:<target>` section is edited under `templates/` and not copied back.
- `AGENTS.md` (changed): convention 3 names the `deploy.yml` of `templates/deploy-railway/turborepo/` as the file that replaces the one of `templates/deploy-railway/base/`.
- `.agents/review.md` (changed) and `REVIEW.md` (rendered by `pnpm rules:sync`): the line on where a template file lives names the deploy layer.
- `src/deploy-sections.ts` (changed): a marker's name is checked with `isDeployTarget`; any other name but `end` throws an error that holds the marker's text.
- `test/deploy-sections.test.ts` (changed): a case for a misspelled deploy target.
- `.changeset/<name>.md` (new): `patch`, with the sentence on `CONTAINER_IMAGE` and 9.7.1.

Delivery 2. Edited by the agent; no file of this delivery is in the constitution:

- `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` (changed): "Reply shape" holds the first line's three labels, the `**Not yet:**` line, the three lists, the place of **Request**, **Steps**, and **Checks**, the `**Now:**` line, the rule on a state read from the host, and one example of each kind of reply.
- `plugins/sdlc/source/hooks/check-reply-shape.sh` (changed): the anchor is the first line's label; the five checks of requirement 14 take the place of the check on `Next:`.
- `plugins/sdlc/source/hooks/check-reply-shape.cases.json` (changed): each existing case uses the new labels; each of the five checks gains a case that blocks and a case that passes; a `**No change:**` line alone passes.
- `plugins/sdlc/source/skills/sdlc-mode/playbooks/*.md` and `plugins/sdlc/source/skills/sdlc-help/SKILL.md` (changed): each sentence that names the **Status** line or `Next:` names the `**Now:**` line or the `**Not yet:**` line.
- `plugins/sdlc/README.md` (changed): the "Hook" section lists the five checks.
- `plugins/sdlc/adapters/claude-code/evals/` (changed): each grader and each expected outcome that reads `**Status:**`, `Next:`, or a **Request** line on every reply reads the new labels.
- `plugins/sdlc/adapters/` and `templates/base/plugins/sdlc/` (rendered by `pnpm plugin:sync`).
- `.changeset/<name>.md` (new): `minor`, with how to copy the plugin from a new project.
- `intent/chat-reply-ux/intent.md` and `spec.md` (changed): `Status: done.` when the last requirement is met.

## Order of work

Delivery 1:

1. On a new branch, set `Accepted by:` to the account that merged this plan's pull request. Check: `pnpm plan:check`.
2. The test for a misspelled deploy target, then the check in `src/deploy-sections.ts`. Check: the test fails before the change and `pnpm vitest run test/deploy-sections.test.ts` passes after.
3. `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `.agents/review.md`. Check: `pnpm rules:sync`, then `pnpm rules:check`.
4. The changeset, `pnpm verify` in the root, a generated project of each of the five stacks with each deploy target, and a draft pull request that stays a draft until its review's findings are fixed. Check: ten passes.

Delivery 2:

5. The hook's cases, cases first, then the hook. Check: the new cases fail on the hook of `main` and pass after; `pnpm plugin:check`.
6. `SKILL.md`, the playbooks, `sdlc-help`, and the plugin's `README.md`. Check: `git grep` finds no `**Status:**` and no `Next:` under `plugins/sdlc/source/`; `pnpm plugin:sync`, then `pnpm plugin:check`.
7. The eval cases. Check: each case's graders load, and every case runs once on the small model; the scores and the cost are reported.
8. The changeset, `Status: done.`, `pnpm verify` in the root, a generated project of each of the five stacks with each deploy target, and a draft pull request that stays a draft until its review's findings are fixed. Check: ten passes.

## Risks

- The riskiest step is 5: a hook that blocks a right reply stops every session that uses the plugin. It blocks once for a turn, only a reply whose first line has one of the three labels, and only for the five things a script reads.
- Step 7 can lower an eval score for a reason that is not the new shape: one run of a case on the small model varies. A case under its threshold runs once more before its grader is read again, and no grader is loosened.
- A project created before delivery 2 keeps the old shape. The changeset says how to copy the plugin.
- Delivery 2. Departures from the first plan. The line that ends each playbook was labelled `**Next:**`; it names the playbook that follows and who starts it, and is not a line of a reply, so it is renamed `**Hands off to:**` and requirement 15 holds as written. The eval cases held one grader that read the `**Status:**` line, in `reply-gives-full-urls`; that case gains the graders for the first line, the `**Now:**` line, and a state that was not read, and no case grades a `**Not yet:**` line, which the hook's cases cover. An action the person takes in the chat, such as answering a round of questions or sending a message, has no page: the `**Now:**` line then holds the action and no URL, a third form beside the two of requirement 8.
- The two deliveries are two releases. Delivery 1 is merged and versioned before delivery 2 opens its pull request, so that neither changeset rides the other's version.
- Options not taken: one pull request for both deliveries, because a `patch` and a `minor` would ship as one version; keeping `**Status:**` as the last line with new rules, because the link after it is what the person acts on; a check on the words of the `**Now:**` line, because a script cannot tell an action from a sentence.

## Proof

- 1–3: the review reads the four documents against `src/create.ts`, and `pnpm rules:check` shows `REVIEW.md` is rendered.
- 4: the case in `test/deploy-sections.test.ts`.
- 5: the review reads the changeset against the entries of 9.7.0 and 9.7.1 in `CHANGELOG.md`.
- 6–8, 10–12: the template in `SKILL.md`, the hook's cases for the three first-line labels, the `**Not yet:**` line, and the `**Now:**` line, and the graders of the eval case `reply-gives-full-urls` for the first line and the `**Now:**` line.
- 9, 14: the cases of `check-reply-shape.cases.json`, run by `pnpm plugin:check`.
- 13: the eval case `reply-gives-full-urls`, with a grader for a state that was not read.
- 15: `git grep` for `**Status` and for `Next:` under `plugins/sdlc/source/` finds nothing.
- 16: `pnpm plugin:check`, which compares both rendered copies with the source.
- 17: `pnpm plugin:check`.
- 18: steps 4 and 8, and the Template job in CI.
- 19: `pnpm changesets:check`.
