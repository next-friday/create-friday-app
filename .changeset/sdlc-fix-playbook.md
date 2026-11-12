---
"@next-friday/create-app": minor
---

Generated projects gain a short path for fixing a defect. When a request is a defect in behaviour that already exists, `/sdlc` follows the new playbook `.agents/skills/sdlc/playbooks/fix.md`: it reproduces the defect as a failing test, makes the test pass, runs the checks, and opens a pull request. A change that adds behaviour, a dependency, a schema, or a public interface goes through intent, spec, and plan as before.
