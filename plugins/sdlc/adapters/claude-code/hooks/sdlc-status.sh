#!/bin/sh
command -v jq > /dev/null || exit 0
input=$(cat)
project=$(printf '%s' "$input" | jq -r '.cwd // .workspace_roots[0] // ""')
[ -n "$project" ] && [ -d "$project/intent" ] || exit 0

read_status() {
  [ -f "$1" ] || return 0
  sed -n 's/.*Status: \([a-z][a-z ]*\)\..*/\1/p' "$1" | head -n 1
}

lines=""
for folder in "$project"/intent/*/; do
  [ -d "$folder" ] || continue
  change=$(basename "$folder")
  intent_status=$(read_status "$folder/intent.md")
  spec_status=$(read_status "$folder/spec.md")
  if [ "$intent_status" = done ] || [ "$spec_status" = done ]; then
    continue
  fi
  if [ -f "$folder/plan.md" ]; then
    stage="plan accepted; the engineer builds it, then a code owner reviews the pull request"
  elif [ -f "$folder/spec.md" ]; then
    stage="spec $spec_status; the engineer writes and accepts the plan"
  elif [ -f "$folder/intent.md" ]; then
    stage="intent $intent_status; the spec is written next"
  else
    continue
  fi
  lines="$lines- intent/$change: $stage
"
done

[ -n "$lines" ] || exit 0
summary="Changes in intent/ that are not done (send /sdlc:sdlc-mode to work on one):
$lines"

if [ "$1" = json ]; then
  jq -n --arg context "$summary" '{additional_context: $context}'
else
  printf '%s' "$summary"
fi
