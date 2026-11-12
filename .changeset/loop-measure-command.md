---
"@next-friday/create-app": minor
---

Every generated project gets `pnpm loop:measure`. For each `intent/<change>/` it reads git history and prints the date of the first `intent.md`, `spec.md`, and `plan.md` commits, the days from intent to spec, the `intent.md` commits made after the first `spec.md` commit, and the `spec.md` commits made after the first `plan.md` commit. It is not part of `pnpm verify`.
