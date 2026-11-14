---
name: sdlc-mode
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc:sdlc-mode.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act.

   | The request                                                                                                             | What to do                                                                                                                     |
   | :---------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
   | A question, or a request to explain something without changing anything                                                 | Follow [`playbooks/question.md`](playbooks/question.md).                                                                       |
   | A spec for an intent, or a path to an `intent.md`                                                                       | Follow [`playbooks/design.md`](playbooks/design.md).                                                                           |
   | A build for a spec, a path to a `spec.md`, or a plan the engineer merged                                                | Follow [`playbooks/build.md`](playbooks/build.md).                                                                             |
   | A review or check of a pull request or a branch, a failing check on a pull request, or a pull request to drive to green | Follow [`playbooks/review.md`](playbooks/review.md).                                                                           |
   | A deploy, a promotion to an environment, or a release to production                                                     | Follow [`playbooks/deploy.md`](playbooks/deploy.md).                                                                           |
   | A finding sent by a job, a monitor, or a trigger, or one the message says no person can answer questions about          | Follow [`playbooks/maintain.md`](playbooks/maintain.md).                                                                       |
   | A defect in behaviour that already exists, which a failing test can show, to fix                                        | Follow [`playbooks/fix.md`](playbooks/fix.md).                                                                                 |
   | An idea, a problem, a ticket, or an incident that a person describes, whether asked for or only reported                | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                               |
   | A pull request to open for the current branch                                                                           | Follow [`playbooks/open-pr.md`](playbooks/open-pr.md).                                                                         |
   | Anything else                                                                                                           | Say which of the rows above is closest and why it does not fit, answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line. A problem reported with `/sdlc:sdlc-mode` is the person's ask for `plan`.

   Do not start work a person did not ask for. When a message reports a problem without asking for work, answer in a few lines and give, on the **Now** line, the message that would start it: `/sdlc:sdlc-mode` followed by their own words.

2. **Open the task list** when the session offers a task-list tool. Its first items are the matched playbook's numbered steps, copied word for word, before any other task. A step you do not do stays in the list with `skip: <reason>`. Use `skip` only for a step you decide never to do. A step marked **Gate** is never skipped. When the session offers no such tool, the steps go in the reply instead, under **Steps**, and are never left out, except for `question`. When a playbook's **Hands off to** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself,** stopping only at a step marked **Gate**, or before an action that cannot be undone. At a step marked **Gate**, wait for the person it names. When a playbook's **Hands off to** line says an agent runs the next file "in the same turn", read that file and continue without asking; otherwise stop at the Gate. Mark each step done in the task list as you finish it.
4. **Start each subagent on its role's model.** The rule `~/.cursor/rules/sdlc-models.mdc`, which `/sdlc:setup-sdlc` writes, names a model and an effort for each role; read the file when its lines are not in this session. Reading or searching more than a few files goes to a subagent on the `explore` model, and so does the `verifier`. The `advise` model reviews at the moments `playbooks/build.md` and `playbooks/fix.md` name. Pass the model and the effort through the `model` of the `Task` call, which takes the model slug the role line names; the effort is part of that slug. With no rule, a rule the session cannot read, or no line for the role, start the subagent on this session's model and say so in the reply.
5. **Write the reply in the shape below.**

## Reply shape

Write replies a person can check. State as a fact only what you opened or ran in this turn, say what you ran, and mark what you did not open or run in this turn as inferred or not checked. Answer what was asked and stop: never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.

Name a pull request, an issue, a branch, a workflow run, or a file by its full URL on the host that holds it, never by a number or a bare name. The person often reads the reply on a phone: a URL opens the page with one tap, and a number opens nothing.

When the person writes a number and a repository, build the URL before you write anything else: the repository's URL, then the host's path for the thing, such as `/pull/<number>` for a pull request or `/issues/<number>` for an issue. Use that URL where the person wrote the number, from the first line on. After the first mention you may say "this pull request", with no number.

For example, the person writes "who must approve pull request #7 of https://host.example/acme/shop":

- First line: "**Answer:** Not checked yet who must approve https://host.example/acme/shop/pull/7. It waits for a code owner."
- Last line: "**Now:** Ask a code owner to review it: https://host.example/acme/shop/pull/7"

The person reads the top of a reply and its last line first, so the answer and the one thing to do are there:

```markdown
**Answer:** | **Result:** | **No change:** <one of the three, in one or two sentences. `**Answer:**` answers a question. `**Result:**` says what the work produced, or what is known so far; a reply that only asks a round of questions or stops at a gate starts with it too. `**No change:**` is for a message that no person typed, such as a finished check or a notice from the host, when it changes nothing for the person: say what happened and what the work still waits for, and send that one line as the whole reply.>

**Not yet:** <only when there is something the person must not do yet, such as merging a pull request that is not whole. What, and why, in one line. At most one such line.>

**Request:** <only in the first reply of a task. The goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. Where the request holds a number, write the URL you built from it.>

**Done:** | **Doing:** | **Waiting for you:** <only for work that spans turns. Three short lists; leave out a list with nothing in it.>

**Steps:** <only when the session has no task-list tool, and never for the `question` playbook. One line for each numbered step of the playbook: `1. <the step, copied word for word>: done | open | skip: <reason>`. When the turn ran more than one playbook, one list for each, under its file name on a line of its own, such as `playbooks/build.md`.>

**Checks:** <when a step ran checks, and always when the turn changed a file outside `intent/`, whichever playbook ran. Otherwise never for the `question` playbook. Each command, then the lines of its output that show the result, copied from the output. For a check that could not run, the check and why.>

<What the current step produces: the round of questions, or the whole draft, and the reasons and the evidence behind the first line.>

**Now:** <which gate the work waits on and for whom, then the one thing the person does now, in words that say the action, then the full URL of the page where it is done, and nothing after that URL. An action done in the chat, such as answering the questions above or sending a message, has no URL: write the action, and the message to send when there is one. When the person has nothing to do, say so and write no URL.>
```

The **Now** line is the last line of the reply. It holds at most one URL. That URL is never a list page, such as a repository's pull requests or issues, and never a page the **Not yet** line names: a link at the end of a reply is where the person taps.

State whether a pull request or an issue is open, a draft, merged, or closed only when you read it from the host in this turn. Otherwise say that its state was not checked.

A step that is not finished is `open`, including one at its Gate.

A reply that ends before a **Gate** step says which step stopped it and why.

When the evidence shows that the change cannot be made in this project, say so on the first line.
