# Plan: A reply names a pull request by its URL (fix)

Accepted by: @joetakara.

The defect: a reply of the `sdlc-mode` skill names a pull request by its number, such as "PR #42", and its **Status** line often ends without the URL of the page to open. Requirement 19 of `intent/sdlc-plugin/spec.md` asks for the full URL in both places. The eval case `reply-gives-full-urls` shows it: no run passes.

The cause: the rule sat apart from the lines it governs, and the person's own wording, a number beside a repository URL, was repeated on the **Request** line as written.

## Files that change

| File                                                | Change  | Afterwards                                                                                                                                                                                                                                            |
| :-------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/sdlc/source/skills/sdlc-mode/SKILL.md`     | changed | The reply shape says to build the URL from the repository and the number before writing, gives one worked example of the **Request** and **Status** lines, ends the **Status** line with `Next: <URL>`, and names two things to check before sending. |
| `plugins/sdlc/adapters/*/skills/sdlc-mode/SKILL.md` | changed | Rendered by `pnpm plugin:sync`.                                                                                                                                                                                                                       |

## Order of work

1. Run the eval case `reply-gives-full-urls` on the small model and on the mid-size model. Check: no run passes.
2. Change the reply shape in `SKILL.md` and render the adapters. Check: `pnpm plugin:check` exits 0.
3. Run the same case again on both models. Check: on each model more runs pass than in step 1.
4. Check: `pnpm verify` exits 0.

## Risks

- The riskiest step is 2: the reply shape governs every reply of the skill, so the other eval cases read the same text.
- The change publishes nothing: it touches no file under `src/` or `templates/`, no publish field of `package.json`, and adds no changeset.
- Option not taken: changing the graders of the eval case. They state requirement 19 as written.

## Proof

- `claude plugin eval plugins/sdlc/adapters/claude-code --scaffold --tag no-shell --allow-tools Write Edit --model <model> --runs <n>`: before the change 0 of 6 runs pass; with it, 8 of 9 runs pass on the mid-size model and 25 of 35 on the small model.
- `pnpm verify`: exits 0.
