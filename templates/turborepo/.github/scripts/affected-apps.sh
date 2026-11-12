#!/usr/bin/env bash
set -euo pipefail

base="${1-}"
head="${2:-HEAD}"

if [[ -z "$base" ]]; then
  query="$(pnpm exec turbo query 'query { packages { items { path } } }')"
  printf '%s' "$query" | jq --compact-output '[.data.packages.items[].path | select(startswith("apps/")) | ltrimstr("apps/")]'
else
  query="$(pnpm exec turbo query affected --packages --base "$base" --head "$head")"
  printf '%s' "$query" | jq --compact-output '[.data.affectedPackages.items[].path | select(startswith("apps/")) | ltrimstr("apps/")]'
fi
