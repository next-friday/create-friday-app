# Owned Checks

A check is **owned** when `.husky/` or `.github/workflows/` runs it. Those files are the source of truth for what must pass.

Run any check by hand when you need its result to verify your work; the hooks and CI still run it on commit, push, and the pull request. Read their output and fix what it reports. Report a check as passed only from an observed result.
