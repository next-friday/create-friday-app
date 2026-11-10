---
"@next-friday/create-app": patch
---

The CLI no longer follows a Git repository named by an inherited `GIT_DIR`, as Git sets when the CLI runs from a Git hook. It used to treat the new project as inside that repository and skip `git init`, and `pnpm install` set the Git hooks path in that repository's config. Both now act on the new project's own repository.
