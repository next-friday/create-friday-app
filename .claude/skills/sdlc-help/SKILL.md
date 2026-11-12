---
name: sdlc-help
description: Explains how this project's workflow runs and how to use /sdlc. It answers and starts no work. Run it with /sdlc-help.
disable-model-invocation: true
---

# SDLC help

1. When the message asks for work rather than how, open no project file. The whole reply is two lines in the person's language: this command starts no work; and the message to send instead, which is `/sdlc` followed by their own words.
2. When the topic is unclear, ask one question with these choices: how the workflow runs and starting work, keeping `/sdlc` on for a session, fixing a defect in behaviour that already exists, who decides at each gate, a mistake the agent repeats, or company policy.
3. Read the files the topic points to before you answer. When a file disagrees with the map below, the file is right.
4. When the person asks about a playbook, a command, or a file that this project does not have, the whole reply is three lines: it does not exist; what exists instead, as one file path; and one message they can send next. Stop there. Do not explain the topic from other files.
5. Otherwise answer, then give one message the person can send as is, with real words from their question and no blanks to fill in, then list the files the answer came from.
6. Write the reply as the **Write replies a person can check** convention in `AGENTS.md` says.

## Map

- **How the workflow runs, and starting work:** `intent/README.md` and the table in `.agents/skills/sdlc/SKILL.md`.
- **Keeping `/sdlc` on for a session:** a person starts it; nothing routes work into it. In Claude Code, an invoked skill's content stays in the conversation across later turns, and after a compaction Claude Code re-attaches the most recent invocation within a token budget, so a person types `/sdlc` again only to restore the full text. In Cursor, pick `/sdlc` from the `/` menu and press Option+Enter (Mac) or Alt+Enter (Windows) instead of Enter, which makes it a custom mode that stays in context until the person exits it. Plain Enter attaches it to one message.
- **Fixing a defect in behaviour that already exists:** `.agents/skills/sdlc/playbooks/fix.md` is the path with no intent and no spec, for a person's request: a plan an engineer accepts, then a failing test, the fix, and a pull request. A finding from a job always starts at intent. Every other change runs intent, spec, plan, then build.
- **Who decides:** `.agents/rules/agent-owned-work.md` and `.github/CODEOWNERS`.
- **A mistake the agent repeats:** **Things Claude gets wrong** in `AGENTS.md`.
- **Company policy:** the policy skills in `.agents/skills/`, and `.github/CODEOWNERS` for each one's owner.
