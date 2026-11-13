#!/usr/bin/env bash
# Sourced by each gate hook. A record never changes the hook's answer: a failed write is reported
# on standard error and the function returns 0. The record holds no command text, path, file
# content, or environment value, because any of them can hold a secret: a hook passes a reason
# with no text from its input. A lifted production gate adds the approval value and the Git user
# name, which the release record needs.
record_gate_decision() {
  local hook=$1 decision=$2 reason=$3 input=$4 approval=${5:-} project log session
  project=${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$PWD}}
  log=${AGENT_GATE_LOG:-$project/.agents/logs/gate-decisions.jsonl}
  session=$(jq -r '.session_id // .conversation_id // empty' <<< "$input" 2> /dev/null) || session=
  {
    mkdir -p "${log%/*}" \
      && jq -cn \
        --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg hook "$hook" \
        --arg decision "$decision" \
        --arg reason "$reason" \
        --arg session "$session" \
        --arg approval "$approval" \
        --arg user "$([[ -n $approval ]] && git -C "$project" config user.name 2> /dev/null)" \
        '{time: $time, hook: $hook, decision: $decision}
          + (if $reason == "" then {} else {reason: $reason} end)
          + (if $session == "" then {} else {session: $session} end)
          + (if $approval == "" then {} else {approval: $approval, user: $user} end)' >> "$log"
  } 2> /dev/null || printf '%s: could not write the decision record to %s\n' "$hook" "$log" >&2
  return 0
}
