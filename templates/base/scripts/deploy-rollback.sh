#!/usr/bin/env bash
# Usage: bash scripts/deploy-rollback.sh <uat|prod>
# Redeploys the last commit that succeeded in the environment before the current one, through deploy.yml and its gates.
set -euo pipefail

environment="${1-}"
if [[ "$environment" != uat && "$environment" != prod ]]; then
  echo "Usage: bash scripts/deploy-rollback.sh <uat|prod>" >&2
  exit 2
fi

repository="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
current=""

while read -r id sha; do
  state="$(gh api "repos/$repository/deployments/$id/statuses" --jq '.[0].state // ""')"
  if [[ "$state" != success && "$state" != inactive ]]; then
    continue
  fi
  if [[ -z "$current" ]]; then
    current="$sha"
    continue
  fi
  if [[ "$sha" != "$current" ]]; then
    echo "Rolling $environment back from $current to $sha."
    gh workflow run deploy.yml --ref main -f environment="$environment" -f commit_sha="$sha"
    exit 0
  fi
done < <(gh api --paginate "repos/$repository/deployments?environment=$environment&per_page=100" --jq '.[] | "\(.id) \(.sha)"')

echo "No earlier successful deployment to $environment." >&2
exit 1
