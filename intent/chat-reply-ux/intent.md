# Intent: Make a reply easy to act on, and finish the deploy target documents

Author: @joetakara (Developer Productivity). Status: accepted.

## Problem

This intent holds two matters the product owner asked to keep together: the shape of a reply in the chat, raised by the product owner, and what an independent audit found in the deploy target change.

The shape of a reply. The `sdlc` plugin sets it in `plugins/sdlc/source/skills/sdlc-mode/SKILL.md` and checks it in `plugins/sdlc/source/hooks/check-reply-shape.sh`. A person reads the reply on a phone and decides from it what to do next.

1. The link at the end of a reply can lead to a page where the person has nothing to do. `SKILL.md:56` asks for `Next: <its full URL>` "when there is a page where the person acts next". The hook, at lines 83 to 85, passes any URL after `Next:`, so a list page such as a repository's pull requests passes.
2. The link at the end of a reply can lead to a pull request that must not be merged yet. The reply says so in its text, and its last line is still a link to the page that holds the merge button.
3. An automatic event that changes nothing for the person, such as a passed check on a pull request that still waits for someone else, gets a reply in the full shape. The person reads the same state again.
4. A reply does not show what is left. The person asks.
5. A question is not always answered first. The shape puts **Request**, **Steps**, and **Checks** before the answer.
6. A reply can report a state that is no longer true, such as a pull request that waits for a merge after it was merged.

Sources read for the design, each quoted where it is used below:

- Microsoft, Guidelines for Human-AI Interaction, <https://www.microsoft.com/en-us/haxtoolkit/library/>.
- IBM Carbon Design System, Notification usage, `src/pages/components/notification/usage.mdx` in `carbon-design-system/carbon-website`.
- 18F Content Guide, "Structure the content", `content/content-guide/our-approach/structure-the-content.md` in `18F/guides`.

The deploy target change. An audit by an agent with a fresh context read `intent/deploy-target-choice/spec.md` against `main` and found:

7. The root documents describe a template as `base` plus a stack only: `README.md:27`, `CONTRIBUTING.md:40` and `:46`, and `.agents/review.md:37` with its rendered `REVIEW.md`. The root `AGENTS.md`, convention 3, still names `.github/workflows/deploy.yml` in `turborepo` as a file that replaces `base`; that file is now `templates/deploy-railway/turborepo/.github/workflows/deploy.yml`.
8. `.changeset/deploy-target-files.md` does not say that the `CONTAINER_IMAGE` variable takes effect only from the next version: version 9.7.0 names the variable in `SETUP.md`, and no `ci.yml` of that version reads it.
9. `src/deploy-sections.ts:3` accepts any lowercase word as a deploy target in a marker. A marker with a misspelled target removes its section for every target, and nothing reports it.

## Proposed outcome

The shape of a reply:

- A reply starts with the answer to the question, or with the result of the work. 18F: "most people will only read 25 percent of it". Carbon: "The title should be short and descriptive, explaining the most important piece of information."
- What the person must not do yet, such as merging a pull request that is not whole, is one line directly under the result. Carbon: "Callout should be used sparingly to emphasize information that must not be overlooked."
- A reply names at most one thing for the person to do now, in words that say the action, with one link to the page where it is done. When the person has nothing to do, the reply says so and ends with no link. Carbon: "Only one action is allowed for each notification", and of a link, "They must be descriptive and meaningfully indicate the link's destination."
- No reply ends with a link to a list page, or to a page where the person must not act yet.
- A reply to an automatic event that changes nothing for the person is one line. Carbon: "they are disruptive and should be used sparingly". Microsoft, guideline 3: "Time when to act or interrupt based on the user's current task and environment."
- A reply on work that spans turns lists what is done, what is being done, and what waits for the person. 18F: "Lists are easily scannable". Microsoft, guideline 4: "Display information relevant to the user's current task and environment."
- The reasons and the evidence follow the lines above. Microsoft, guideline 11: "Enable the user to access an explanation of why the AI system behaved as it did."
- A state the reply reports is read from its source in that turn.

The deploy target change:

- The root documents and the review rules describe the deploy layer and the files with marked sections.
- The pending changeset says what the next version corrects, the `CONTAINER_IMAGE` variable included.
- A marker that names a deploy target the CLI does not know stops the run with a message that names the marker.

Out of scope:

- The progress text that the agent tool's own interface writes while the agent works.
- Any rule on the language of a reply.
- The other findings of the audit: the full copy of `turbo.json` in the deploy layer, the production gate paragraph held once for each target, the sentence on promotion in the `CONTRIBUTING.md` of a project with no deploy target, and the file names the root workflow's host check does not read.

## Affected users and systems

- A product owner, an engineer, and a reviewer who read a reply on a phone and act on it.
- The plugin: `sdlc-mode/SKILL.md`, `check-reply-shape.sh` with its cases, and the playbooks that end at a gate.
- A generated project, which holds the plugin's copy.
- The CLI: `src/deploy-sections.ts` and its tests.
- This repository's `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, and `.agents/review.md`.
- `@next-friday/create-app` on npm: each part needs a new version.

## Constraints

- The shape works in both agent tools the plugin is rendered for.
- The hook blocks only what it can read with certainty, and never judges what a sentence means.
- A reply keeps the evidence it must hold: the checks that ran, and what a merge publishes.
- No human gate is added.
- `.agents/review.md` is rendered by `pnpm rules:sync`; a person commits it if it is in the constitution.

## Open questions

1. A reply to an automatic event that changes nothing for the person. Decided by the originator: one line, not silence, so that the person knows the agent still watches.
2. The word before the link. Decided by the originator: words that say the action, such as "Merge the plan's pull request:", in place of `Next:`.
3. What the hook enforces. **Proposal:** it blocks a reply whose last link is a list page of the host, a URL that ends with `/pulls` or `/issues`; the rest is a rule of `SKILL.md`. No source says this; it is the one part a script can read.
4. A limit on a reply's length. No proposal: the sources give a length for a notification, "one or two short sentences" (Carbon), and none for a reply in a chat.
5. The list of what is done, being done, and waiting. **Proposal:** three short lists under fixed labels. No source gives the labels.
6. The order of delivery. **Proposal:** the deploy target part first, because it is small and corrects the next version, then the shape of a reply.
