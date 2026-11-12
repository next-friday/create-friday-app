---
name: sdlc
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc.
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

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line. A problem reported with `/sdlc` is the person's ask for `plan`.

2. **Open the task list** when the session offers a task-list tool. Its first items are the matched playbook's numbered steps, copied word for word, before any other task. A step you do not do stays in the list with `skip: <reason>`. Use `skip` only for a step you decide never to do. A step marked **Gate** is never skipped. When the session offers no such tool, the steps go in the reply instead, under **Steps**, and are never left out, except for `question`. When a playbook's **Next** line chains another playbook, add that playbook's steps when you start it.
3. **Do the playbook's steps yourself,** stopping only as `.agents/rules/agent-owned-work.md` says. At a step marked **Gate**, wait for the person it names. When a playbook's **Next** line says an agent runs the next file "in the same turn", read that file and continue without asking; otherwise stop at the Gate. Mark each step done in the task list as you finish it.
4. **Write the reply in the shape below.**

## Reply shape

Write the reply as the **Write replies a person can check** convention in `AGENTS.md` says, even when the message also holds a command, a path, or English technical terms. Only paths, commands, and a draft file's own text stay as they are.

```markdown
**Request:** <the goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. For a question, only the question.>

**Steps:** <only when the session has no task-list tool, and never for the `question` playbook. One line for each numbered step of the playbook: `1. <the step, copied word for word>: done | open | skip: <reason>`. When the turn ran more than one playbook, one list for each, under its file name on a line of its own, such as `playbooks/build.md`.>

**Checks:** <only when a step ran checks, and never for the `question` playbook. Each command, then the lines of its output that show the result, copied from the output.>

<What the current step produces: the round of questions, or the whole draft. For a question or a request no row fits, the answer.>

**Status:** <what is done, what comes next, and which gate it waits on and for whom.>
```

A step that is not finished is `open`, including one at its Gate.

A reply that ends before a **Gate** step says which step stopped it and why. "Waiting for an instruction" is not a reason.

When the evidence shows that the change cannot be made in this project, say so under **Request**. In the `plan` playbook, the first round then asks the one question that settles where the change belongs.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.
