#!/usr/bin/env bash
set -uo pipefail

input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$PWD}}" || exit 0
path=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // .file_path // empty' <<< "$input")
[[ -n $path && -f $path ]] || exit 0

case $path in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
    pnpm exec eslint --fix --cache --max-warnings=0 --no-warn-ignored --no-inline-config "$path" > /dev/null 2>&1
    ;;
esac
pnpm exec prettier --write --cache --ignore-unknown "$path" > /dev/null 2>&1
exit 0
