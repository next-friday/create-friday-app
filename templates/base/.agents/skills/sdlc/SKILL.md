---
name: sdlc
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act.

   | The request                                                                                                    | What to do                                                                                                                     |
   | :------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
   | A question, or a request to explain or check without changing things                                           | Follow [`playbooks/question.md`](playbooks/question.md).                                                                       |
   | A spec for an intent, or a path to an `intent.md`                                                              | Follow [`playbooks/design.md`](playbooks/design.md).                                                                           |
   | A build for a spec, a path to a `spec.md`, or a plan the engineer accepted                                     | Follow [`playbooks/build.md`](playbooks/build.md).                                                                             |
   | A review of a pull request or a branch, a failing check on a pull request, or a pull request to drive to green | Follow [`playbooks/review.md`](playbooks/review.md).                                                                           |
   | A deploy, a promotion to an environment, or a release to production                                            | Follow [`playbooks/deploy.md`](playbooks/deploy.md).                                                                           |
   | A finding sent by a job, a monitor, or a trigger, or one the message says no person can answer questions about | Follow [`playbooks/maintain.md`](playbooks/maintain.md).                                                                       |
   | A defect in behaviour that already exists, to fix                                                              | Follow [`playbooks/fix.md`](playbooks/fix.md).                                                                                 |
   | An idea, a problem, a ticket, or an incident that a person describes, whether asked for or only reported       | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                               |
   | Anything else                                                                                                  | Say which of the rows above is closest and why it does not fit, answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line.

2. **Do the playbook's steps yourself,** stopping only as `.agents/rules/agent-owned-work.md` says. At a step marked **Gate**, wait for the person it names. When a playbook's **Next** line says an agent runs the next file in the same turn, read that file and continue without asking.
3. **Write the reply in the shape below.**

## Reply shape

Reply in the language the person wrote in, even when the message also holds a command, a path, or English technical terms. Only paths, commands, copied step text, and a draft file's own text stay as they are. For `question` and for a request no row fits, leave out **Steps** and put the answer in its place.

```markdown
**Request:** <the goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. For a question, only the question.>

**Steps:**

1. <the first sentence of step 1 of the playbook, copied word for word>: done | open | skip: <reason>
2. <and so on for every numbered step of the playbook>

<What the current step produces: the round of questions, or the whole draft.>

**Status:** <what is done, what comes next, and which gate it waits on and for whom.>
```

A step that is not finished is `open`, including one at its Gate. When one turn runs more than one playbook, list the steps of each under its file name. A reply that ends before a **Gate** step says which step stopped it and why. "Waiting for an instruction" is not a reason. Use `skip` only for a step you decide never to do.

When the evidence shows that the change cannot be made in this project, say so under **Request**. In the `plan` playbook, the first round then asks the one question that settles where the change belongs.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.
