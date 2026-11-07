---
name: script-driven-changes
description: Change many files with a script, not by hand. Use when a change repeats one pattern across more than a few files, or needs a one-off script.
---

# Scripts

When a change repeats one pattern across more than a few files, run a script. Derive facts from the toolchain (TypeScript compiler API, `git`), not by reading files by eye. Edit by hand when the change needs judgment in one place.

Commit a script when a reviewer needs to rerun it or when the work outlives the session, and add it as a `package.json` script so knip counts it as an entry. Keep any other one-off script in a temporary directory outside the repository, and remove a committed script when its workflow ends. Fail on unmapped input. Back up before a destructive run.

Print summaries: counts, first errors. Verify what owned checks omit, such as the running app.
