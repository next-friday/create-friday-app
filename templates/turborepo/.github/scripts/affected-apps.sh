#!/usr/bin/env bash
set -euo pipefail

base="${1-}"
head="${2:-HEAD}"

if [[ -z "$base" ]]; then
  printf '%s\n' app backoffice
  exit 0
fi

query="$(pnpm exec turbo query affected --packages --base "$base" --head "$head")"
paths="$(printf '%s' "$query" | jq -r '.data.affectedPackages.items[].path // empty')"

app=false
backoffice=false

while IFS= read -r path; do
  case "$path" in
    apps/app) app=true ;;
    apps/backoffice) backoffice=true ;;
  esac
done <<<"$paths"

if [[ "$app" == true ]]; then
  printf '%s\n' app
fi

if [[ "$backoffice" == true ]]; then
  printf '%s\n' backoffice
fi
