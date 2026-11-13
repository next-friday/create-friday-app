#!/bin/sh
command -v jq > /dev/null || exit 0
mode=${1:-}
input=$(cat)
state_directory=${TMPDIR:-/tmp}/sdlc-reply-shape
conversation=$(printf '%s' "$input" | jq -r '.conversation_id // .session_id // ""')
conversation=${conversation:+$(printf '%s' "$conversation" | cksum | tr ' ' '-')}
project=$(printf '%s' "$input" | jq -r '.cwd // .workspace_roots[0] // ""')
snapshot_file=$state_directory/$conversation.files

# A copy of the index and a scratch object store keep the project's own Git data unwritten.
snapshot() {
  [ -n "$project" ] && [ -n "$conversation" ] || return 1
  repository=$(git -C "$project" rev-parse --show-toplevel 2> /dev/null) || return 1
  index=$(git -C "$repository" rev-parse --git-path index) || return 1
  objects=$(git -C "$repository" rev-parse --git-path objects) || return 1
  case $index in /*) ;; *) index=$repository/$index ;; esac
  case $objects in /*) ;; *) objects=$repository/$objects ;; esac
  scratch=$state_directory/$conversation.git
  rm -rf "$scratch"
  mkdir -p "$scratch/objects" || return 1
  cp "$index" "$scratch/index" 2> /dev/null
  content=$(
    export GIT_INDEX_FILE="$scratch/index" GIT_OBJECT_DIRECTORY="$scratch/objects" GIT_ALTERNATE_OBJECT_DIRECTORIES="$objects"
    git -C "$repository" add -A -- ':(top)' ':(top,exclude)intent' 2> /dev/null
    git -C "$repository" ls-files -s -- ':(top)' ':(top,exclude)intent' | cksum
  )
  rm -rf "$scratch"
  printf '%s|%s' "$repository" "$content"
}

changed_since_snapshot() {
  current=$(snapshot) || return 1
  previous=$(cat "$snapshot_file" 2> /dev/null)
  printf '%s' "$current" > "$snapshot_file"
  [ "${previous%|*}" = "${current%|*}" ] && [ "$previous" != "$current" ]
}

case $mode in
  snapshot)
    changed_since_snapshot
    exit 0
    ;;
  save)
    text=$(printf '%s' "$input" | jq -r '.text // ""')
    [ -n "$text" ] && [ -n "$conversation" ] || exit 0
    mkdir -p "$state_directory" && printf '%s' "$text" > "$state_directory/$conversation"
    exit 0
    ;;
  followup)
    changed=false
    changed_since_snapshot && changed=true
    [ -n "$conversation" ] && [ -f "$state_directory/$conversation" ] || exit 0
    reply=$(cat "$state_directory/$conversation")
    rm -f "$state_directory/$conversation"
    [ "$(printf '%s' "$input" | jq -r '"\(.status // "") \(.loop_count // "")"')" = 'completed 0' ] || exit 0
    ;;
  *)
    changed=false
    changed_since_snapshot && changed=true
    [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = true ] && exit 0
    reply=$(printf '%s' "$input" | jq -r '.last_assistant_message // ""')
    ;;
esac
first=$(printf '%s\n' "$reply" | awk 'NF{print; exit}')
case $first in '**Answer:**'* | '**Result:**'* | '**No change:**'*) ;; *) exit 0 ;; esac

last=$(printf '%s\n' "$reply" | awk 'NF{l=$0} END{print l}')
outside_fences=$(printf '%s\n' "$reply" | awk '/^[[:space:]]*(```|~~~)/{f=!f; next} !f')
outside_urls=$(printf '%s\n' "$outside_fences" | sed -E 's#https?://[^][:space:])>]*# #g')
outside_code=$(printf '%s\n' "$outside_urls" | tr 'A-Z' 'a-z' \
  | sed -E 's/`((#|(pr|pull request|issue)s?[[:space:]]+#?)[0-9]+)`/ \1 /g; s/`[^`]*`/ /g' \
  | sed -E 's/(step|item|number|requirement|rule|point|option|case|line)s?[[:space:]]+#[0-9]+/ /g; s/#[0-9]{6,}/ /g')

number=$(printf '%s\n' "$outside_code" \
  | grep -Eo '(^|[^[:alnum:]_&#/])#[0-9]+([^[:alnum:]_]|$)|(^|[^[:alnum:]_])(pr|pull request|issue)s?[[:space:]]+#?[0-9]+([^[:alnum:]_.]|\.[^0-9]|\.?$)(of[[:space:]]+(the|this|that|a|an|my|our|your|these|those)[[:space:]])?' \
  | grep -Ev '[[:space:]]of[[:space:]]' | head -1 | sed -E 's/^[^#[:alnum:]]//; s/[^[:alnum:]]$//')
problems=
[ -n "$number" ] && problems="Replace \"$number\" with the full URL of that pull request or issue, or with \"this pull request\". "
only_line=$(printf '%s\n' "$reply" | awk 'NF{n++} END{print n+0}')
not_yet=$(printf '%s\n' "$outside_fences" | grep -E '^[[:space:]]*([-*+][[:space:]]+)?\*\*Not yet:\*\*')
page_urls() {
  grep -Eo 'https?://[^][:space:]()<>]+' \
    | sed -E 's#[`*_"'"'"'!?.,;:]+$##; s#[?\#].*$##; s#/+$##' \
    | tr 'A-Z' 'a-z' | sort -u
}
case $last in
  '**Now:**'*)
    now_urls=$(printf '%s\n' "$last" | page_urls)
    now_url=$(printf '%s\n' "$now_urls" | head -1)
    if [ "$(printf '%s\n' "$now_urls" | grep -c .)" -gt 1 ]; then
      problems="${problems}The **Now:** line holds more than one URL. Name one thing for the person to do, with one URL. "
    fi
    if printf '%s' "$now_url" | grep -Eq '^https?://[^/]+/[^/]+/[^/]+/(.*/)?(pulls|issues)$'; then
      problems="${problems}The **Now:** line links a list page. Link the one page where the person acts, or write no URL when the person has nothing to do. "
    fi
    if [ -n "$now_url" ] && printf '%s\n' "$not_yet" | page_urls | grep -Fxq "$now_url"; then
      problems="${problems}The **Now:** line links the page the **Not yet:** line names. Write no URL there until the person may act on that page. "
    fi
    ;;
  '**No change:**'*)
    [ "$only_line" -eq 1 ] || problems="${problems}End the reply with a line that starts with **Now:**; nothing may follow it. "
    ;;
  *) problems="${problems}End the reply with a line that starts with **Now:**; nothing may follow it. " ;;
esac
if [ "$(printf '%s\n' "$not_yet" | grep -c .)" -gt 1 ]; then
  problems="${problems}The reply holds more than one **Not yet:** line. Keep one. "
fi

if [ "$changed" = true ] && ! printf '%s\n' "$outside_fences" | grep -q '^\*\*Checks:\*\*'; then
  problems="${problems}A file outside intent/ changed in this turn and the reply has no **Checks:** section. Run the checks the project names and add **Checks:** with each command and the lines of its output that show the result, or with each check that could not run and why. "
fi

[ -z "$problems" ] && exit 0
jq -n --arg mode "$mode" --arg reason "${problems}Send the whole reply again." \
  'if $mode == "followup" then {followup_message:$reason} else {decision:"block",reason:$reason} end'
