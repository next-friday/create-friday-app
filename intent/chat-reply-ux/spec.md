# Spec: Make a reply easy to act on, and finish the deploy target documents

From `intent/chat-reply-ux/intent.md`. Status: draft.

Request: "docs(repo): add the chat reply intent (#211)", the merge of the intent's pull request by the product owner. Skills at `e477661`.

Choices the product owner has not made are marked **Proposal**. The product owner corrects them in review. Item numbers are those of the intent's **Problem** section. The plugin's paths are under `plugins/sdlc/source/`.

## Requirements

Delivery 1, the deploy target documents, items 7 to 9:

1. `README.md`, `CONTRIBUTING.md`, and `.agents/review.md` with its rendered `REVIEW.md` say that a project is `templates/base`, then `templates/<stack>`, then, for a deploy target other than `none`, `templates/deploy-<target>/base` and `templates/deploy-<target>/<stack>`.
2. `CONTRIBUTING.md` says that a file with a `deploy:<target>` section is edited under `templates/` and is not copied back from a generated project, as the root `AGENTS.md` already says.
3. The root `AGENTS.md`, convention 3, names `templates/deploy-railway/turborepo/.github/workflows/deploy.yml` as the file that replaces `templates/deploy-railway/base/.github/workflows/deploy.yml`, and no longer names a `deploy.yml` in `turborepo`.
4. A marker whose name is neither a deploy target of `src/deploy-targets.ts` nor `end` stops the run before the project is kept. The message names the marker's text. A test covers it.
5. The changeset of this delivery says that the `CONTAINER_IMAGE` variable has skipped the image job since version 9.7.1, because the entry of 9.7.0 in `CHANGELOG.md` names the variable and no `ci.yml` of 9.7.0 reads it.

Delivery 2, the shape of a reply, items 1 to 6:

6. A reply in the plugin's shape starts with one labelled line: `**Answer:**` for a question, `**Result:**` for work, or `**No change:**` for an automatic event that changes nothing for the person. **Proposal:** these are the three labels.
7. When there is something the person must not do yet, the second line is `**Not yet:**` and says what and why, in one line. A reply holds at most one such line.
8. The last line of a reply is `**Now:**`. It holds either one action for the person, in words that say the action, followed by the full URL of the page where it is done, or the words that the person has nothing to do, with no URL. **Proposal:** `**Now:**` is the label. It takes the place of the `**Status:**` line and its `Next:` link.
9. The `**Now:**` line never holds a URL of a list page, and never the URL of a page the `**Not yet:**` line names.
10. A `**No change:**` reply is that one line and nothing else. It says what happened and what the work still waits for.
11. A reply on work that spans turns holds, after its first lines, what is done, what is being done, and what waits for the person, each as a short list under a fixed label. **Proposal:** the labels are `**Done:**`, `**Doing:**`, and `**Waiting for you:**`, and a list with nothing in it is left out.
12. The **Request** line, which restates the goal, is in the first reply of a task only, after the first line. The **Steps** and **Checks** sections keep their rules and come after the lists of requirement 11.
13. A reply states a pull request's or an issue's state, such as open, draft, merged, or closed, only when the agent read it from the host in that turn; otherwise it says the state was not checked.
14. `check-reply-shape.sh` checks a reply whose first line has one of the labels of requirement 6, and blocks it once when:
    1. its last line does not start with `**Now:**`, unless the reply is a `**No change:**` line alone;
    2. the `**Now:**` line holds more than one URL;
    3. the `**Now:**` line's URL ends with `/pulls` or `/issues`;
    4. the `**Now:**` line's URL is also on the `**Not yet:**` line;
    5. the reply holds more than one `**Not yet:**` line.
       The checks on a number written for a pull request or an issue, and on the **Checks** section after a file changed, stay as they are. The check that asked for `Next:` or "no next page" is removed.
15. Every playbook, the `sdlc-help` skill, the plugin's `README.md`, and the eval cases name the labels of this spec and no longer name `**Status:**` or `Next:`.
16. The reply rules and the hook read the same in both agent tools the plugin is rendered for.

Every delivery:

17. `pnpm plugin:sync` renders each changed file into `plugins/sdlc/adapters/` and `templates/base/`, and `pnpm plugin:check` passes.
18. `pnpm verify` passes in a generated project of each of the five stacks with `--deploy none` and with `--deploy railway`.
19. Each delivery is one pull request with its own changeset for `@next-friday/create-app`: `patch` for delivery 1, and **Proposal:** `minor` for delivery 2, because a generated project's replies change shape.

## Design

Delivery 1:

- `README.md`, the section on what a project holds, and `CONTRIBUTING.md`, the two paragraphs on templates: the layer and the copy-back sentence.
- `AGENTS.md`, convention 3: the sentence of requirement 3.
- `.agents/review.md`: the line on where a template file lives gains the deploy layer; `pnpm rules:sync` renders `REVIEW.md`.
- `src/deploy-sections.ts`: the marker's name is checked with `isDeployTarget` before a section opens. `test/deploy-sections.test.ts`: the case.
- `.changeset/<name>.md`: `patch`.

Delivery 2:

- `skills/sdlc-mode/SKILL.md`, "Reply shape": the template block and its rules become the lines of requirements 6 to 13. The example of a request with a number keeps its URL rule and ends with a `**Now:**` line.
- `hooks/check-reply-shape.sh`: the anchor is the first line's label; the checks are those of requirement 14. `hooks/check-reply-shape.cases.json`: each existing case moves to the new labels, and each check of requirement 14 gains a case that blocks and a case that passes.
- `skills/sdlc-mode/playbooks/*.md` and `skills/sdlc-help/SKILL.md`: each sentence that names the **Status** line names the `**Now:**` line or the `**Not yet:**` line. A gate's sentence says that the `**Not yet:**` line names what waits, such as a pull request that is not whole.
- `plugins/sdlc/README.md`, "Hook": the checks of requirement 14.
- `plugins/sdlc/adapters/claude-code/evals/`: each grader that reads `**Status:**`, `Next:`, or `**Request:**` reads the new labels. No grader is loosened: each keeps what it proves.
- No file of either delivery is in the constitution, unless a person's rules reserve `.agents/review.md`; `scripts/check-agent-gates.ts` decides, and the build reads it first.

## Policies

- **Brand:** rule 4, as requirements 6, 8, and 11: one label for one thing in every reply. The change shows no other brand value.
- **Security:** Does not apply. The change touches no chapter of the standard: the hook reads the agent's own reply and prints a fixed reason, and the marker check reads the package's own template files. Rule 6: no secret is read, stored, or printed.
- **Compliance:** Does not apply. The change collects, stores, shows, sends, and deletes no data about a person.
- **UX:** the reply is text shown by the agent tool, which owns the interface. Of the standard, two criteria on content apply, as requirements 8 and 6: 2.4.4 Link Purpose (In Context), and 2.4.6 Headings and Labels. See area of concern 1.

## Areas of concern

1. UX, rule 2. The standard could not be opened from this session, so the two criteria are named from memory and not quoted. The UX policy owner checks their numbers and names.
   Decision: the two criteria stay as named, and the review of delivery 2 opens the standard and corrects them.
2. No policy. Requirement 12 moves the **Request** line out of every reply but the first. It was the first line of every reply so that a person sees what the agent understood.
   Decision: accepted. The first reply of a task keeps it, and later replies start with the answer or the result.
3. No policy. `AGENTS.md` says to run `pnpm evals:run` and `pnpm evals:run:write` after a skill or a hook changes. Delivery 2 changes the reply's labels in every case's graders, so every case runs.
   Decision: delivery 2 runs every eval case once, on the small model, and reports the scores and the cost.
4. No policy. A project created before delivery 2 keeps the old shape, because the CLI copies the plugin once. Two shapes then exist among a customer's projects.
   Decision: accepted. The changeset says how to copy the plugin from a new project.
5. No policy. The hook cannot tell whether an action on the `**Now:**` line is one the person should take; it reads only the URL. Requirements 8, 9, and 13 are rules of `SKILL.md` beyond the five checks of requirement 14.
   Decision: accepted. The hook checks what a script can read, and the eval cases cover the rest.

## Open questions

1. A reply to an automatic event that changes nothing: one line, requirement 10. The originator decided this.
2. The word before the link: words that say the action, requirement 8. The originator decided this.
3. What the hook enforces: answered as requirement 14, a proposal. It adds two checks to the intent's one: a second URL, and a URL the `**Not yet:**` line names.
4. A limit on a reply's length: none. No source gives one for a reply in a chat, and no requirement sets one.
5. The lists of what is done, being done, and waiting: answered as requirement 11, a proposal.
6. The order of delivery: requirements 1 to 5, then 6 to 16.
7. Item 8 of the intent named a pending changeset. It is no longer pending: `CHANGELOG.md` holds the entry of 9.7.1. Requirement 5 puts the sentence in the changeset of delivery 1.
