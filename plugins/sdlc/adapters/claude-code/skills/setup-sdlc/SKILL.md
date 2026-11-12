---
name: setup-sdlc
description: Sets the model and reasoning effort for each role from a budget and reports which steps of SETUP.md are done. Run it with /sdlc:setup-sdlc.
disable-model-invocation: true
---

# Set up the SDLC

Do these steps in order. Run again with the same answers, the skill writes the same file and redoes no step that is done.

1. **List the models the session offers:** the models it can run or start a subagent on, spelled as the session spells them. When it can list none, ask the person to paste the names and wait. Write no model the session does not offer.
2. **Read `.agents/sdlc-models.md`** when it exists. Its `budget:` line is the current budget, and a role line whose model is on the list keeps that model.
3. **Choose each role's model.** A role without a kept model gets its default. A default the session does not offer becomes the offered model of the same family, the newest when there are several. When the family has none, ask about that role in the question of step 4.

   | Role     | Default  | Does                                 |
   | :------- | :------- | :----------------------------------- |
   | `build`  | `sonnet` | Writes the change.                   |
   | `review` | `sonnet` | Reviews the change.                  |
   | `verify` | `sonnet` | Runs the app and the checks.         |
   | `evals`  | `haiku`  | Runs the eval cases, which are many. |

4. **Fix the budget,** which is the reasoning effort of every role. When the request names one of the four labels, that is the budget and you ask nothing about it. Otherwise ask one question, through the session's question tool when it has one, with these choices, adding the roles of step 3 that have no model. Name the current budget when the file records one; with no file, say that `large` matches the defaults.

   | Label       | Effort   |
   | :---------- | :------- |
   | `unlimited` | `max`    |
   | `large`     | `xhigh`  |
   | `medium`    | `high`   |
   | `small`     | `medium` |

5. **Write `.agents/sdlc-models.md`** as the whole file, overwriting it, in this shape and no other, with a newline after the last line, because the `build` playbook reads the `verify:` line. For the budget `medium` in a session that offers `sonnet` and `haiku`:

   ```markdown
   # SDLC models

   budget: medium (high)
   build: sonnet high
   review: sonnet high
   verify: sonnet high
   evals: haiku high
   ```

6. **Read `SETUP.md`** at the project root. When there is none, say "This project has no `SETUP.md`" and go to step 9. Otherwise decide for each step whether it is done by checking the repository: run the step's **Check** when it only reads files or local git state, and read the files the step names. Report each step as `done`, `not done`, or `a person checks this` when the repository cannot show it, such as a setting on a website, an account, or someone's decision. For example:

   - `1. Project description: done. package.json holds a description.`
   - `2. Owners: not done. .github/CODEOWNERS still holds the placeholder.`
   - `3. Repository settings: a person checks this. They live on the host, not in the repository.`

7. **Do the `not done` steps an agent can do,** as `.agents/rules/agent-owned-work.md` says: a step whose whole work is editing a file of the repository with values the repository or the request already gives. Do not redo a `done` step. Do not edit a file the project's rules or agent settings reserve for a person, such as rules, hooks, lint, format, and commit configuration, and the agent settings themselves; list it with the exact new text and the file it goes in. Commit nothing. After each step, run its **Check** again and report the result.
8. **List the steps a person does outside the repository,** each with who does it, from `SETUP.md`, and the full URL of the page where it is done when `SETUP.md` or the repository names one.
9. **Write the reply** by the reply rules in `../sdlc-mode/SKILL.md`. After them, in this order: the budget line and the four role lines as written; each step of `SETUP.md` with its state; what you did; what a person does.
