#!/usr/bin/env bash
set -euo pipefail

eval_file=$1
conclusion=$2

if [[ $conclusion != success ]]; then
  echo "FAIL $eval_file: Claude Code reported $conclusion"
  exit 1
fi

if bash -c "$(jq -r '.check' "$eval_file")"; then
  echo "PASS $eval_file"
else
  echo "FAIL $eval_file"
  exit 1
fi
