#!/usr/bin/env bash
set -uo pipefail

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-mcp-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".agents/hooks/agent-mcp-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
input=$(cat)
tool=$(jq -r '.tool_name // empty' <<< "$input")
human_gate="A code owner approves a pull request and a person merges it. Do not approve or merge; report that the pull request waits on that review."
if [[ $tool =~ (merge_pull_request|enable_pr_auto_merge)$ ]]; then
  block "$human_gate"
fi
if [[ $tool =~ pull_request_review_write$ ]]; then
  event=$(jq -r '(.tool_input | if type == "string" then (fromjson? // {}) else . end | objects | .event) // empty' <<< "$input" | tr '[:upper:]' '[:lower:]')
  [[ $event == approve ]] && block "$human_gate"
fi
allow
