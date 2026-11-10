---
name: write-spec
description: Produce spec.md, the requirements and design spec, from an accepted intent.md. Use when a person or a trigger asks for the spec of an accepted intent.md.
---

# Write spec.md

Read the `intent.md` the user names, and follow this prompt:

> Read the attached intent.md and produce a requirements and design spec for integrating it into our existing codebase. Apply the skills available to you so the plan conforms to our brand guidelines, security policies and UX standards. Document the spec fully as spec.md, ready to hand to the engineering team. Describe clearly any areas of concern, especially where you cannot satisfy contradicting policies.

Write `spec.md` alongside that `intent.md`, in the same folder. Answer each open question from `intent.md`, or carry it forward. Commit it and open a pull request; the product owner accepts the spec by merging it.
