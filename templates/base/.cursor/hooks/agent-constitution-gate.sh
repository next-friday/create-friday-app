#!/usr/bin/env bash
set -uo pipefail

protected='^(\.agents/rules/|\.agents/rules\.json$|\.agents/hooks/|\.claude/rules/|\.claude/settings(\.local)?\.json$|\.cursor/rules/|\.cursor/hooks/|\.cursor/hooks\.json$|scripts/sync-agent-rules\.ts$|scripts/check-agent-gates\.ts$|\.commitlintrc\.json$|\.prettierrc\.json$|prettier\.config\.ts$|eslint\.config\.ts$|\.husky/|\.lintstagedrc\.json$|\.gitleaks\.toml$)'

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-constitution-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".cursor/hooks/agent-constitution-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
input=$(cat)
path=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // .file_path // empty' <<< "$input")
[[ -n $path ]] || allow

project=$(jq -r '.workspace_roots[0] // .cwd // empty' <<< "$input")
project=${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-${project:-$PWD}}}
[[ $path == /* ]] || path=$project/$path
[[ $path == "$project"/* ]] || allow
relative=${path#"$project"/}
if [[ $relative =~ (^|/)\.\.?(/|$) ]]; then
  block "The edit to $relative uses . or .. in its path. Use the normalized path."
fi
[[ $relative =~ $protected ]] || allow
block "The edit to $relative is blocked. That path is company policy; stop and ask the user."
