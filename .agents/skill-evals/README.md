# Skill evals

Each case under `<skill>/<case>/` is a prompt plus checks that decide whether the agent did the work. `pnpm evals:run` runs every case with Claude Code and the developer's own Claude login; `pnpm evals:run <case> ...` runs the named cases. It copies the project (without `.git` and `node_modules`) to a temporary directory, makes one commit, applies the case's fixture, runs `claude -p` with the prompt, evaluates the checks, prints one line per case, and exits non-zero when any case that ran failed. `AGENT_EVALS_MODEL` sets the model; the default is `claude-haiku-5-5`.

## Files of a case

- `prompt.md`: the prompt, after its front matter.
- `case.yaml`: `expected_outcome`, `timeout_seconds`, an optional `fixture`, and `checks`.
- `fixture.md`: the state the case needs, in prose. A case with this file and no `fixture` in `case.yaml` is reported as `skipped: fixture not machine-applicable`.
- `graders/*.md`: criteria that a model judges. The script does not read them.

## Fixture steps

Steps run in order in the copy. Each is one key:

| Step                     | Effect                                                                                                     |
| :----------------------- | :--------------------------------------------------------------------------------------------------------- |
| `write: {path, content}` | Writes the file.                                                                                           |
| `commit: <message>`      | Commits every change.                                                                                      |
| `branch: <name>`         | Creates the branch from the current one and checks it out.                                                 |
| `checkout: <name>`       | Checks out the branch.                                                                                     |
| `bare_remote: <name>`    | Creates a bare repository next to the copy, adds it as the remote `<name>`, and pushes every branch to it. |

The default branch is `main`.

## Checks

Each entry of `checks` is a kind, or a kind with its argument. Regular expressions use the `m` and `u` flags.

| Check                         | Passes when                                                                     |
| :---------------------------- | :------------------------------------------------------------------------------ |
| `no_file_changes`             | The working tree is as the fixture left it.                                     |
| `no_new_commits`              | No ref holds a commit that the fixture did not create.                          |
| `no_new_branch`               | No local branch exists that the fixture did not create.                         |
| `reply_matches: <regex>`      | The reply matches.                                                              |
| `reply_lacks: <regex>`        | The reply does not match.                                                       |
| `file_exists: <path>`         | The file exists. A glob matches only files the run created or changed.          |
| `file_matches: {path, regex}` | A file at `path` matches. A glob matches only files the run created or changed. |
| `commit_touches_only: <glob>` | Every file of the first commit the run made matches the glob.                   |
| `branch_matches: <regex>`     | The checked-out branch matches.                                                 |

A check decides only what a script can decide. What needs judgment stays in `graders/`.
