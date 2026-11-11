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

2. **Open your reply with the request in your own words:** the goal, the problem it solves, and the smallest change you expect to meet it. When you cannot name the smallest change yet, say what you must learn first. For a question, restate only the question. When the evidence rules out the change the person asked for, show the evidence and stop.
3. **Show the playbook's steps.** For every playbook but `question`, copy its numbered steps, word for word, into your todo list before any other todo. With no todo tool, list them in your reply. Mark each step done, open, or `skip: <reason>`. A step marked **Gate** waits for the person it names and is never skipped.
4. **Do every other step yourself.** Find facts in files and commands instead of asking. Stop only at a Gate, before an irreversible action (a force push other than `--force-with-lease` on your own branch, a hard reset, deleting work), or for a decision no file settles. `.agents/rules/agent-owned-work.md` lists the gates.
5. **End every turn** with what is done, what comes next, and which gate it waits on and for whom.

"new task" starts again at step 1. "don't change anything" keeps the session on `question`.

## Replies

- Reply in the language the person wrote in.
- Write paths from the project root, such as `src/main.ts:12`, never from the machine's root.
- State as a fact only what you opened or ran in this turn, and say what you ran. Mark anything else as inferred or not checked.
- Answer what was asked and stop. Leave out tools, services, and steps the request does not need.
- Never hand the person a check you could run.
- Send nothing outside this session, such as a message to another session or a service, unless a playbook step says to.
