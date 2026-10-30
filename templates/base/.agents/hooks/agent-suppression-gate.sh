#!/usr/bin/env bash
set -uo pipefail

directives='eslint-disable|eslint-enable|@ts-ignore|@ts-expect-error|@ts-nocheck|zizmor: ?ignore|nosemgrep|gitleaks:allow|trufflehog:ignore|prettier-ignore|istanbul ignore|c8 ignore|v8 ignore|knip-ignore|NOSONAR|editorconfig-checker-disable|hadolint ignore|trivy:ignore|(^|[^[:alnum:]_])@public([^[:alnum:]_]|$)|(^|[^[:alnum:]_])noqa([^[:alnum:]_]|$)'
exempt='^(\.agents/rules/|\.agents/hooks/|\.claude/rules/|\.cursor/rules/|\.cursor/hooks/|scripts/check-agent-gates\.ts(:|$))'

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-suppression-gate: %s\n' "$1" >&2
  exit 2
}

if [[ ${1:-} == --repo ]]; then
  matches=$(git grep -nIE "$directives" -- . ":(exclude)pnpm-lock.yaml" | grep -vE "$exempt" || true)
  if [[ -n $matches ]]; then
    printf '%s\n' "$matches" >&2
    printf 'suppressions:check: remove these suppression directives and fix the findings they hide.\n' >&2
    exit 1
  fi
  exit 0
fi

trap 'block ".agents/hooks/agent-suppression-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
input=$(cat)
path=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.notebook_path // .file_path // empty' <<< "$input")
[[ -n $path ]] || allow

project=$(jq -r '.workspace_roots[0] // .cwd // empty' <<< "$input")
project=${CLAUDE_PROJECT_DIR:-${project:-$PWD}}
[[ $path == /* ]] || path=$project/$path
[[ $path == "$project"/* ]] || allow
relative=${path#"$project"/}
[[ ! $relative =~ (^|/)\.\.?(/|$) && $relative =~ $exempt ]] && allow

content=$(jq -r '[.tool_input.content, .tool_input.contents, .tool_input.new_string, .tool_input.new_source, (.tool_input.edits // [] | .[].new_string)] | map(select(. != null)) | join("\n")' <<< "$input")
if grep -qE "$directives" <<< "$content"; then
  block "The edit to $relative adds a suppression directive. Fix what the tool reports instead; if you believe the finding is wrong, stop and ask the user."
fi
allow
