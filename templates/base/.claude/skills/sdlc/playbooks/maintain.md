# Maintain phase: turn a finding into `intent.md`

This playbook starts from a finding such as an alert, a monitoring ticket, a failing run, or an incident. No one answers questions while it runs.

1. Read the finding the request gives: what was seen, where, when, and its link or log. When the request gives no finding, say so in two lines and stop. When the finding asks for a new capability and reports no fault, say that a person sends it with `/sdlc`, and stop.
2. Diagnose without changing anything. Read the logs, the code, and the changes merged before the finding. When `bands.yaml` names the tools for the finding's tier, use only those. Write no file outside `intent/`, start no deploy, and act only through a route that `bands.yaml` lists for that tier: `pull_request` is the pull request in step 5, and any other route is a runbook of that name. When the finding names no tier, or the project has no `bands.yaml`, use read-only tools only. When the tier's action is only to log, put the finding in your reply and stop.
3. Write `intent/<change>/intent.md` from the template in `.agents/skills/sdlc/playbooks/plan.md`, in the language of the files already in `intent/`. Use exactly the template's five headings.
   - **Problem:** the anomaly and its evidence: the number, its source, and the time.
   - **Proposed outcome:** what the fixed system does, as its user would see it.
   - **Open questions:** everything the evidence does not settle, including the cause when you could not prove it. Never state a cause you did not verify.

   In the author line, name what started the run, such as "Author: maintain job (alert <link>). Status: draft."

4. Run the confidence check. It is a check, not a person.
   - Start a subagent that has not seen the diagnosis, give it only the finding, the logs and files you read, and `intent.md`, and have it try to disprove the **Problem** section from the evidence. When you cannot start a subagent, read the evidence again from the first line as if someone else wrote the intent.
   - When a claim does not survive, move it under **Open questions**, and say in the pull request that the confidence check failed and on which claim.
5. Commit `intent.md` on a new branch, push it, and open a pull request ready for review, as `AGENTS.md` says for branches and pull requests. Put the evidence and the confidence check's result first in its description, under the template's first heading. When you cannot open a pull request from this session, say so and give the pushed branch's name.
6. **Gate: the service owner triages the finding.** The service owner sets `Status: accepted.` and merges the pull request to fix the finding now, leaves it open to schedule it, or closes it to dismiss it. A dismissal tunes the bands: the service owner adjusts `bands.yaml` so the same noise raises fewer findings. The service owner asks the product owner to decide a product-facing finding. You do none of these. Report the pull request's URL, keep it green as `.agents/skills/sdlc/playbooks/review.md` says, and wait.

**Next:** `.agents/skills/sdlc/playbooks/design.md`; an agent; when the service owner has merged the intent's pull request and a person or a job sends `/sdlc` with the intent's path.
