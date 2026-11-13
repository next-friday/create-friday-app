#!/bin/sh
command -v jq > /dev/null || exit 0
mode=${1:-}
input=$(cat)
state_directory=${TMPDIR:-/tmp}/sdlc-reply-shape
conversation=$(printf '%s' "$input" | jq -r '.conversation_id // ""' | tr -cd 'A-Za-z0-9_-')
case $mode in
  save)
    text=$(printf '%s' "$input" | jq -r '.text // ""')
    [ -n "$text" ] && [ -n "$conversation" ] || exit 0
    mkdir -p "$state_directory" && printf '%s' "$text" > "$state_directory/$conversation"
    exit 0
    ;;
  followup)
    [ -n "$conversation" ] && [ -f "$state_directory/$conversation" ] || exit 0
    reply=$(cat "$state_directory/$conversation")
    rm -f "$state_directory/$conversation"
    [ "$(printf '%s' "$input" | jq -r '"\(.status // "") \(.loop_count // "")"')" = 'completed 0' ] || exit 0
    ;;
  *)
    [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = true ] && exit 0
    reply=$(printf '%s' "$input" | jq -r '.last_assistant_message // ""')
    ;;
esac
first=$(printf '%s\n' "$reply" | awk 'NF{print; exit}')
case $first in '**Request:**'*) ;; *) exit 0 ;; esac

last=$(printf '%s\n' "$reply" | awk 'NF{l=$0} END{print l}')
request=$(printf '%s\n' "$reply" | grep -m1 '^\*\*Request:\*\*')
outside_fences=$(printf '%s\n' "$reply" | awk '/^[[:space:]]*(```|~~~)/{f=!f; next} !f')
outside_urls=$(printf '%s\n' "$outside_fences" | sed -E 's#https?://[^][:space:])>]*# #g')
outside_code=$(printf '%s\n' "$outside_urls" | tr 'A-Z' 'a-z' \
  | sed -E 's/`((#|(pr|pull request|issue)s?[[:space:]]+#?)[0-9]+)`/ \1 /g; s/`[^`]*`/ /g' \
  | sed -E 's/(step|item|number|requirement|rule|point|option|case|line)s?[[:space:]]+#[0-9]+/ /g; s/#[0-9]{6,}/ /g')

number=$(printf '%s\n' "$outside_code" \
  | grep -Eo '(^|[^[:alnum:]_&#/])#[0-9]+([^[:alnum:]_]|$)|(^|[^[:alnum:]_])(pr|pull request|issue)s?[[:space:]]+#?[0-9]+([^[:alnum:]_.]|\.[^0-9]|\.?$)(of[[:space:]]+(the|this|that|a|an|my|our|your|these|those)[[:space:]])?' \
  | grep -Ev '[[:space:]]of[[:space:]]' | head -1 | sed -E 's/^[^#[:alnum:]]//; s/[^[:alnum:]]$//')
machine_path=$(printf '%s\n' "$outside_urls" \
  | grep -Eo '(^|[^[:alnum:]_./~-])(/(home|root|tmp|Users)/[^[:space:]`)"'\'']*|[A-Za-z]:[\\][^[:space:]`)"'\'']*)' \
  | head -1 | sed -E 's/^[^/[:alpha:]]//; s/[.,;:]*$//')

problems=
[ -n "$number" ] && problems="Replace \"$number\" with the full URL of that pull request or issue, or with \"this pull request\". "
[ -n "$machine_path" ] && problems="${problems}Write \"$machine_path\" from the project root, such as \`README.md:12\`. "
case $last in
  '**Status:**'*)
    if printf '%s' "$request" | grep -Eq 'https?://' \
      && ! printf '%s' "$last" | grep -Eiq 'Next:\**[[:space:]]*[<(]?https?://[^[:space:]]+[[:space:]]*$|no next page'; then
      problems="${problems}End the **Status:** line with \`Next: <full URL of the page where the person acts next>\`, or say \"no next page\" when none waits. "
    fi
    ;;
  *) problems="${problems}End the reply with a line that starts with **Status:**; nothing may follow it. " ;;
esac

[ -z "$problems" ] && exit 0
jq -n --arg mode "$mode" --arg reason "${problems}Send the whole reply again." \
  'if $mode == "followup" then {followup_message:$reason} else {decision:"block",reason:$reason} end'
