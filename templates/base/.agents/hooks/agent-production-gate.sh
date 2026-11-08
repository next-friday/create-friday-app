#!/bin/bash
# Production deploys require a named release authorization
cmd=$(jq -r '.tool_input.command // .command' < /dev/stdin)
deploys='(deploy\.yml|railway[[:space:]]+(up|redeploy|deploy))'
targets_prod='(environment[[:space:]=]+prod([^[:alnum:]_-]|$)|-e[[:space:]]+prod([^[:alnum:]_-]|$))'
rolls_back_prod='deploy-rollback\.sh[[:space:]]+prod([^[:alnum:]_-]|$)'
if [[ ("$cmd" =~ $deploys && "$cmd" =~ $targets_prod) || "$cmd" =~ $rolls_back_prod ]]; then
  if [ -z "$RELEASE_APPROVAL" ]; then
    echo "Production deploys need a release authorization: ask the release manager to approve, then set RELEASE_APPROVAL to the approval reference." >&2
    exit 2 # exit 2 blocks the action; the message goes to Claude
  fi
fi
exit 0
