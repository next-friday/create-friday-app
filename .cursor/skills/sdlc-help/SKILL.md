---
name: sdlc-help
description: Explains how this project's workflow runs and how to use /sdlc. It answers and starts no work. Run it with /sdlc-help.
disable-model-invocation: true
---

# SDLC help

1. When the message asks for work rather than how, open no project file. The whole reply is two lines in the person's language: this command starts no work; and the message to send instead, which is `/sdlc` followed by their own words.
2. When the topic is unclear, ask one question with these choices: how the workflow runs, starting work, who decides at each gate, fixing a mistake the agent repeats, or adjusting a company policy.
3. Read the files the topic points to before you answer. When a file disagrees with the map below, the file is right.
4. When the person asks about a playbook, a command, or a file that this project does not have, the whole reply is three lines: it does not exist; what exists instead, as one file path; and one message they can send next. Stop there. Do not explain the topic from other files.
5. Otherwise answer, then give one message the person can send as is, with real words from their question and no blanks to fill in, then list the files the answer came from.
6. Write the reply as the **Write replies a person can check** convention in `AGENTS.md` says.

## Map

- **The loop:** intent, then spec, then plan, then build, review, and maintain. Each change keeps its files in `intent/<change>/`: `intent.md`, `spec.md`, and `plan.md` (`intent/README.md`).
- **Starting work:** `/sdlc` matches the request to a playbook in `.agents/skills/sdlc/playbooks/`. The table in `.agents/skills/sdlc/SKILL.md` lists the playbooks this project has. The `plan` playbook writes `intent.md`; `intent/<change>/plan.md` is the later build plan.
- **Who decides:** `.agents/rules/agent-owned-work.md` lists the human gates. `.github/CODEOWNERS` names who approves each path.
- **A mistake the agent repeats:** add the correction to **Things Claude gets wrong** in `AGENTS.md`.
- **Company policy:** the policy skills in `.agents/skills/`; `.github/CODEOWNERS` names each one's owner.
