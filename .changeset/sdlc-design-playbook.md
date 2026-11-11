---
"@next-friday/create-app": major
---

`/sdlc` now writes the spec through the `design` playbook: send the intent's path with `/sdlc`, for example `/sdlc write the spec of intent/<change>/intent.md`, once the intent's pull request is merged. The `write-spec` skill is removed from `.agents/skills/`, `.claude/skills/`, and `.cursor/skills/` of generated projects; send the intent's path with `/sdlc` instead. The `security-policy`, `ux-policy`, `compliance-policy`, and `brand-policy` skills ship usable defaults (OWASP ASVS 5.0.0 Level 1, WCAG 2.2 Level AA, the OECD privacy principles, and one declared source for every brand value); review them and replace or add the organization's own rules.
