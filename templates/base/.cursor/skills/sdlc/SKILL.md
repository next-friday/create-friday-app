---
name: sdlc
description: The front door for work in this project. Matches a request to a playbook and runs it to the next human gate. Run it with /sdlc.
disable-model-invocation: true
---

# SDLC

1. **Restate first.** Your first message on a task says, in your own words, the goal, the problem it solves, and the smallest change you expect to meet it. For a question, restate only the question. When the evidence rules out the change the person asked for, show the evidence and stop.
2. **Match one playbook** from the table below, and read its file before you act.
3. **Copy its steps into a todo list,** word for word, before any task-specific todo. A step you choose not to do stays in the list as `skip: <reason>`. A step marked **Gate** waits for the person it names and is never skipped.
4. **Do every other step yourself.** Find facts in files, commands, and sources instead of asking. Stop only at a Gate, before an irreversible action (a force push other than `--force-with-lease` on your own branch, a hard reset, deleting work), or for a decision no file settles. `.agents/rules/agent-owned-work.md` lists the gates.
5. **End every turn** with what is done, what comes next, and which gate it waits on and for whom. Each claim carries its evidence in the same sentence, or says that it is inferred or a guess. Never hand the person a check you could run.

| The request                                                                       | Playbook                                         |
| :-------------------------------------------------------------------------------- | :----------------------------------------------- |
| A question, a statement, or a request to explain or check without changing things | [`playbooks/question.md`](playbooks/question.md) |
| An idea, a problem, a ticket, or an incident that should become a change          | [`playbooks/plan.md`](playbooks/plan.md)         |

- When a request fits both, use `question` and offer `plan` in one line.
- A request for a later step (a spec, a build, a review, an incident fix) has no playbook yet. Say which step it is, answer what you can as a question, and stop.
- "new task" starts again at step 1. "don't change anything" keeps the session on `question`.
