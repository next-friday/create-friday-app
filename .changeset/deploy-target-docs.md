---
"@next-friday/create-app": patch
---

A template marker that names an unknown deploy target now stops the run with an error, where it removed its section without one. The `CONTAINER_IMAGE` repository variable, which the entry of 9.7.0 names, has skipped the CI job that builds and scans the container image since 9.7.1; no workflow of 9.7.0 reads it. In a project created with 9.7.0, copy the `if:` line of the `image` job in `.github/workflows/ci.yml` from a new project to use the variable.
