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
   | A build for a spec, a path to a `spec.md`, or a plan the engineer accepted                                              | Follow [`playbooks/build.md`](playbooks/build.md).                                                                             |
   | A review or check of a pull request or a branch, a failing check on a pull request, or a pull request to drive to green | Follow [`playbooks/review.md`](playbooks/review.md).                                                                           |
   | A deploy, a promotion to an environment, or a release to production                                                     | Follow [`playbooks/deploy.md`](playbooks/deploy.md).                                                                           |
   | A finding sent by a job, a monitor, or a trigger, or one the message says no person can answer questions about          | Follow [`playbooks/maintain.md`](playbooks/maintain.md).                                                                       |
   | A defect in behaviour that already exists, which a failing test can show, to fix                                        | Follow [`playbooks/fix.md`](playbooks/fix.md).                                                                                 |
   | An idea, a problem, a ticket, or an incident that a person describes, whether asked for or only reported                | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                               |
   | A pull request to open for the current branch                                                                           | Follow [`playbooks/open-pr.md`](playbooks/open-pr.md).                                                                         |
   | Anything else                                                                                                           | Say which of the rows above is closest and why it does not fit, answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line. A problem reported with `/sdlc:sdlc-mode` is the person's ask for `plan`.

   Do not start work a person did not ask for. When a message reports a problem without asking for work, answer in a few lines and give, on the **Status** line, the message that would start it: `/sdlc:sdlc-mode` followed by their own words.

2. **Open the task list** when the session offers a task-list tool. Its first items are the matched playbook's numbered steps, copied word for word, before any other task. A step you do not do stays in the list with `skip: <reason>`. Use `skip` only for a step you decide never to do. A step marked **Gate** is never skipped. When the session offers no such tool, the steps go in the reply instead, under **Steps**, and are never left out, except for `question`. When a playbook's **Next** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself,** stopping only as `.agents/rules/agent-owned-work.md` says. At a step marked **Gate**, wait for the person it names. When a playbook's **Next** line says an agent runs the next file "in the same turn", read that file and continue without asking; otherwise stop at the Gate. Mark each step done in the task list as you finish it.
4. **Write the reply in the shape below.**

## Reply shape

Write replies a person can check. Write the reply in the language the person wrote in, even when the message also holds a command, a path, or English technical terms. Only paths, commands, and a draft file's own text stay as they are. Write paths from the project root, such as `README.md:12`, never from the machine's root. State as a fact only what you opened or ran in this turn, and say what you ran; mark anything else as inferred or not checked. Answer what was asked and stop: leave out tools, services, and steps the request does not need, and never hand the person a check you could run. Send nothing outside the session, such as a message to another session or a service, unless a task step says to.

Name a pull request, an issue, a branch, a workflow run, or a file by its full URL on the host that holds it, never by a number or a bare name. The person often reads the reply on a phone: a URL opens the page with one tap, and a number opens nothing.

When the person writes a number and a repository, build the URL before you write anything else: the repository's URL, then the host's path for the thing, such as `/pull/<number>` for a pull request or `/issues/<number>` for an issue. Use that URL where the person wrote the number, from the **Request** line on. After the first mention you may say "this pull request", with no number.

For example, the person writes "who must approve pull request #7 of https://host.example/acme/shop":

- **Request** line: "**Request:** Who must approve https://host.example/acme/shop/pull/7, and which page to open next."
- **Status** line: "**Status:** Not checked yet who must approve this pull request. It waits for a code owner. Next: https://host.example/acme/shop/pull/7"

```markdown
**Request:** <the goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. For a question, only the question. Where the request holds a number, write the URL you built from it.>

**Steps:** <only when the session has no task-list tool, and never for the `question` playbook. One line for each numbered step of the playbook: `1. <the step, copied word for word>: done | open | skip: <reason>`. When the turn ran more than one playbook, one list for each, under its file name on a line of its own, such as `playbooks/build.md`.>

**Checks:** <only when a step ran checks, and never for the `question` playbook. Each command, then the lines of its output that show the result, copied from the output.>

<What the current step produces: the round of questions, or the whole draft. For a question or a request no row fits, the answer.>

**Status:** <what is done, what comes next, and which gate it waits on and for whom, all on this one line. When there is a page where the person acts next, the line ends with `Next: <its full URL>`, and nothing follows that URL.>
```

The **Status** line is the last line of the reply.

Before you send the reply, check two things. No line names a pull request or an issue by its number: each such place holds the URL or "this pull request". The last line starts with `**Status:**`, and when there is a page to open it ends with `Next: <URL>`.

A step that is not finished is `open`, including one at its Gate.

A reply that ends before a **Gate** step says which step stopped it and why. "Waiting for an instruction" is not a reason.

When the evidence shows that the change cannot be made in this project, say so under **Request**. In the `plan` playbook, the first round then asks the one question that settles where the change belongs.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.
