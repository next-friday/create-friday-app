# Plan: The gate check and the eval runner leave the caller's repository alone (fix)

Accepted by: @joetakara.

The defect: `pnpm gates:check` builds scratch repositories with `git -C <temporary directory>`. A git hook exports `GIT_DIR`, and `git -C` does not override it, so under `pnpm verify` in the pre-push hook of a linked worktree those commands run against the caller's repository. They add commits by "Gate Check", create the branch `fix/login-error`, and move `HEAD` to it. `scripts/run-agent-evals.ts` builds its fixtures the same way, with `git init --bare`.

Reproduced on a scratch clone at `d6a5da4`: `GIT_DIR=<clone>/.git node scripts/check-agent-gates.ts` exits 1, and the clone's `HEAD` moves from `d6a5da4` on `main` to a "Gate Check initial" commit on `fix/login-error`.

The cause: both scripts pass the whole environment to `git` and to the gate scripts. Git names the variables that tie a process to one repository with `git rev-parse --local-env-vars`.

## Files that change

| File                                                                          | Change  | Afterwards                                                                                                                             |
| :---------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------- |
| `test/check-agent-gates.test.ts`                                              | new     | Runs the gate check with `GIT_DIR` set to a scratch repository and expects that repository's `HEAD` and branches to stay as they were. |
| `scripts/check-agent-gates.ts`, `templates/base/scripts/check-agent-gates.ts` | changed | Each child `git` and each gate script runs without the variables `git rev-parse --local-env-vars` lists. A person commits these files. |
| `scripts/run-agent-evals.ts`, `templates/base/scripts/run-agent-evals.ts`     | changed | The same, for the fixture commands and the agent command.                                                                              |
| `.changeset/gate-check-git-env.md`                                            | new     | Patch: a generated project's `pnpm gates:check` and `pnpm evals:run` no longer write to the repository a git hook runs them in.        |

## Order of work

1. Add the test. Check: `pnpm vitest run test/check-agent-gates.test.ts` fails because `HEAD` moved.
2. Change `scripts/run-agent-evals.ts` and its template copy. Check: its self-tests pass with `GIT_DIR` set to a scratch repository, and that repository is unchanged.
3. A person commits the change to `scripts/check-agent-gates.ts` and its template copy, from an issue that carries the exact text. Check: the test of step 1 passes, and `pnpm verify` exits 0.
4. Generate the `nodejs` project and run `GIT_DIR=<scratch>/.git pnpm gates:check` in it. Check: exit 0, and the scratch repository is unchanged.

## Risks

- The riskiest step is 3: the test of step 1 fails until a person's commit lands, and the pre-push hook runs the tests, so the test is pushed after that commit.
- A gate under test reads the branch of its project directory with `git`. Without the variables it reads that directory's own repository, which is what each case sets up.
- Option not taken: removing every variable whose name starts with `GIT_`. Git's own list is narrower and is the documented one.

## Proof

- `pnpm vitest run test/check-agent-gates.test.ts`: fails before step 3 and passes after.
- `GIT_DIR=<scratch>/.git node scripts/check-agent-gates.ts` and the same for `run-agent-evals.ts`: exit 0, and `git rev-parse HEAD` and `git branch --list` in the scratch repository print what they printed before.
- `pnpm verify` in the root and in a generated `nodejs` project: exit 0.
