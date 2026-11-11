---
name: sdlc
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act.

   | The request                                                                       | What to do                                                                                                                       |
   | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
   | A question, a statement, or a request to explain or check without changing things | Follow [`playbooks/question.md`](playbooks/question.md).                                                                         |
   | An idea, a problem, a ticket, or an incident that should become a change          | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                                 |
   | A later step: a spec, a build, a review, a deploy, or an incident fix             | Say "This step has no playbook in `/sdlc` yet" and name the step. Answer what you can as `playbooks/question.md` says, and stop. |

   When a request fits the first two rows, use `question` and offer `plan` in one line.

2. **Do the playbook's steps yourself.** Find facts in files and commands instead of asking. Stop only at a step marked **Gate**, which waits for the person it names and is never skipped; before an irreversible action (a force push other than `--force-with-lease` on your own branch, a hard reset, deleting work); or for a decision no file settles. `.agents/rules/agent-owned-work.md` lists the gates.
3. **Write the reply in the shape below,** following the **Write replies a person can check** convention in `AGENTS.md`.

## Reply shape

For `question` and for a later step, leave out **Steps** and put the answer in its place.

```markdown
**Request:** <the goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. For a question, only the question.>

**Steps:**

1. <step 1 of the playbook, copied word for word>: done | open | skip: <reason>
2. <and so on for every numbered step of the playbook>

<What the current step produces: the round of questions, or the whole draft.>

**Status:** <what is done, what comes next, and which gate it waits on and for whom.>
```

When the evidence rules out the change the person asked for, show the evidence under **Request** and stop.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.
