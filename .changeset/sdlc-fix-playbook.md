---
"@next-friday/create-app": minor
---

Generated projects gain a path for fixing a defect. When a request is a defect in behaviour that already exists, `/sdlc` follows the new playbook `.agents/skills/sdlc/playbooks/fix.md`: it reproduces the defect by running the code, finds the one cause the evidence leaves, writes `intent/<short-description>/plan.md` and waits for an engineer to accept it, then commits that plan and a failing test on a `fix/<short-description>` branch, makes the test pass, runs the checks, and opens a pull request. A fix has no `intent.md` and no `spec.md`. A change that adds behaviour, a dependency, a schema, or a public interface goes through intent, spec, and plan.
