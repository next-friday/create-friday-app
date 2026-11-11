---
name: sdlc
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc.
disable-model-invocation: true
---

# SDLC

Do these steps in order.

1. **Match the request** to the first row that fits, and read that row's file before you act.

   | The request                                                                      | What to do                                                                                                                                                                                                                                           |
   | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | A question, or a request to explain or check without changing things             | Follow [`playbooks/question.md`](playbooks/question.md).                                                                                                                                                                                             |
   | An idea, a problem, a ticket, or an incident, whether asked for or only reported | Follow [`playbooks/plan.md`](playbooks/plan.md).                                                                                                                                                                                                     |
   | A later step: a spec, a build, a review, a deploy, or an incident fix            | Say "This step has no playbook in `/sdlc` yet" and name the step. Name the skill that covers it when one exists: `write-spec` for a spec, `babysit-pr` for a pull request you opened. Answer what you can as `playbooks/question.md` says, and stop. |

   When a request both asks a question and reports a problem, use `question` and offer `plan` in one line.

2. **Do the playbook's steps yourself.** Find facts in files and commands instead of asking. Stop only where the playbook says to stop; at a step marked **Gate**, which waits for the person it names and is never skipped; before an irreversible action; or for a decision no file settles. `.agents/rules/agent-owned-work.md` lists the gates and the irreversible actions.
3. **Write the reply in the shape below,** following the **Write replies a person can check** convention in `AGENTS.md`.

## Reply shape

Write every part in the language of the person's message; keep paths, commands, copied step text, and a draft file's own text as they are. For `question` and for a later step, leave out **Steps** and put the answer in its place.

```markdown
**Request:** <the goal, the problem it solves, and the smallest change you expect to meet it, in your own words. When you cannot name the smallest change yet, say what you must learn first. For a question, only the question.>

**Steps:**

1. <the first sentence of step 1 of the playbook, copied word for word>: done | open | skip: <reason>
2. <and so on for every numbered step of the playbook>

<What the current step produces: the round of questions, or the whole draft.>

**Status:** <what is done, what comes next, and which gate it waits on and for whom.>
```

A step that is not finished is `open`, including one that waits at its Gate. Use `skip` only for a step you decide never to do.

When the evidence shows that the change cannot be made in this project, say so under **Request**. In the `plan` playbook, the first round then asks the one question that settles where the change belongs.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.
