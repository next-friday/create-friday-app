---
"@next-friday/create-app": minor
---

Every generated project gets `runbooks/rollback-deploy.md`: the one command that redeploys the previous production commit through the `Deploy` workflow, how to rehearse it on `uat`, and that a release manager runs it. The deploy playbook points to it when a request asks to return production to an earlier commit. The maintain playbook says a dismissed finding tunes `bands.yaml`.
