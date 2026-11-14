---
name: sdlc-status
description: Shows where each change in intent/ stands, which gate it waits on, and who acts next. It answers and starts no work. Run it with /sdlc:sdlc-status.
disable-model-invocation: true
---

# SDLC status

1. For each `intent/<change>/` folder, read which of `intent.md`, `spec.md`, and `plan.md` exist and their `Status:` lines. Leave out a change whose intent or spec says `Status: done.`
2. For each change left, find its pull requests on the host by the folder's path, open and merged, when the session can reach the host. When it cannot, say that the pull requests were not checked.
3. Name the stage of each change and who acts next:
   - only `intent.md`, its pull request open: the product owner accepts it by merging;
   - only `intent.md`, merged: the spec is written next, by `/sdlc:sdlc-mode` with the intent's path;
   - `spec.md`, its pull request open: the product owner reviews and merges it;
   - `spec.md` merged, no `plan.md`: the engineer accepts a plan in a session started with `/sdlc:sdlc-mode build`;
   - `plan.md`: the code and the plan are in one pull request, which a code owner reviews.
4. Show as blocked a pull request with a failed check, or with runs waiting for a person to approve them.
5. Reply with one line per change: the folder, the stage, and who acts next, with the full URL of its open pull request when there is one. Write no file and change nothing.
