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
input=$(cat)
project=${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$PWD}}
[[ -e "$project/.git/bug-fix-in-progress" ]] || allow
path=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // .file_path // empty' <<< "$input")
[[ -n $path ]] || allow
if [[ $path =~ (\.test\.|\.spec\.|\.e2e\.test\.|(^|/)tests?/) ]]; then
  block "A bug fix is in progress (.git/bug-fix-in-progress), so $path cannot change. Fix the code, not the test."
fi
allow
