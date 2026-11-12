#!/usr/bin/env bash
set -uo pipefail

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-test-edit-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".agents/hooks/agent-test-edit-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
test_path_pattern='(\.test\.|\.spec\.|\.e2e\.test\.|(^|/)tests?/)'
input=$(cat)
project=${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$PWD}}
path=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // .file_path // empty' <<< "$input")
[[ -n $path && $path =~ $test_path_pattern ]] || allow
if [[ -e "$project/.git/bug-fix-in-progress" ]]; then
  block "A bug fix is in progress (.git/bug-fix-in-progress), so $path cannot change. Fix the code, not the test."
fi
branch=$(git -C "$project" symbolic-ref --quiet --short HEAD 2> /dev/null) || branch=
[[ $branch == fix/* ]] || allow
default_branch=$(git -C "$project" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2> /dev/null) || default_branch=origin/main
git -C "$project" rev-parse --verify --quiet "$default_branch" > /dev/null 2>&1 || default_branch=main
merge_base=$(git -C "$project" merge-base HEAD "$default_branch" 2> /dev/null) || allow
committed_files=$(git -C "$project" log --format= --name-only "$merge_base..HEAD" 2> /dev/null) || allow
if grep -Eq "$test_path_pattern" <<< "$committed_files"; then
  block "A bug fix is in progress on branch $branch and the test that reproduces it is committed, so $path cannot change. Fix the code, not the test."
fi
allow
