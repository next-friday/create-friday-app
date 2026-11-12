# Plan: The changeset check knows a dependency bot's pull request after a person updates its branch (fix)

Accepted by: @joetakara.

The defect: `pnpm changesets:check` lets a dependency bot's pull request pass without a changeset only when the workflow run's actor is `dependabot[bot]`. When a person merges `main` into that branch, the actor of the next run is the person, and the check fails on a change that is still only the bot's. Pull request #150 shows it: its runs on `6ea456c` and `58e9dcc` have the actor `joetakara` and fail, and the same commit passes with `GITHUB_ACTOR=dependabot[bot]`.

The cause: `scripts/check-changesets.ts` passes `process.env.GITHUB_ACTOR` to `findChangesetProblems`, which compares it with `dependencyBot`.

## Files that change

| File                          | Change  | Afterwards                                                                                                                                                                                                                                             |
| :---------------------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-changesets.ts` | changed | A branch is a dependency bot's when every commit on it that is not a merge has Dependabot's name and email as its author, and, in a pull request run, Dependabot opened the pull request. The run's actor is not read. The self-tests cover each case. |

## Order of work

1. Add a self-test: a branch whose only commit that is not a merge is the bot's, with a merge of `main` by a person, needs no changeset. Check: `pnpm changesets:check` fails on this test alone.
2. Read the authors with `git log --no-merges --format="%an <%ae>" <merge base>..HEAD` and the pull request's author from the file `GITHUB_EVENT_PATH` names, and pass both in place of the actor. Check: `pnpm changesets:check` exits 0, and on the head of pull request #150 it exits 0 with `GITHUB_ACTOR=joetakara`.
3. Add self-tests: the same branch with one more commit by a person, a person's pull request whose commits carry the bot's name, the bot's name with another email, and no commit author at all each still need a changeset. Check: `pnpm verify` exits 0.

## Risks

- A person's commit on a bot's branch must still need a changeset; step 3 proves it.
- An author's name and email can be set by hand. In a pull request run the check also needs Dependabot as the pull request's author, which GitHub sets. Outside a pull request run the commit authors alone decide.
- A merge commit by a person can carry a change of its own to a dependency file, and the check passes it. A change to any other published file still needs a changeset, and a person still reads the pull request before merging it.
- Option not taken: asking Dependabot to recreate the pull request. The next update of the branch by a person would fail again.

## Proof

- `pnpm changesets:check` on `main` with the new self-tests.
- `node scripts/check-changesets.ts` on the head of pull request #150 with `GITHUB_ACTOR=joetakara`: exit 0.
- `pnpm verify`: exit 0.
