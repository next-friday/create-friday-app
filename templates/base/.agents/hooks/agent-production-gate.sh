#!/usr/bin/env bash
set -uo pipefail

# shellcheck source=.agents/hooks/record-gate-decision.sh
if ! source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/record-gate-decision.sh"; then
  printf '%s\n' '{"permission":"deny","user_message":"agent-production-gate: .agents/hooks/record-gate-decision.sh could not be loaded, so the gate cannot record its decision. Stop and report this error to the user; agents may not edit the gate."}'
  exit 2
fi

allow() {
  record_gate_decision agent-production-gate allow "" "${input:-}" "${lifted_approval:-}"
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  record_gate_decision agent-production-gate block "${2:-$1}" "${input:-}"
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-production-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".agents/hooks/agent-production-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
input=$(cat)
command=$(jq -r '.command // .tool_input.command // empty' <<< "$input")
[[ -n $command ]] || allow
project=${CLAUDE_PROJECT_DIR:-${CURSOR_PROJECT_DIR:-$PWD}}
approval_form_file=.agents/release-approval-form
approval=${RELEASE_APPROVAL:-}
unmatched_approval=
case $(tr '[:upper:]' '[:lower:]' <<< "$approval") in
  "" | 0 | false | no) ;;
  *)
    approval_form=$(head -n 1 "$project/$approval_form_file" 2> /dev/null) || approval_form=
    if [[ -n $approval_form && $approval =~ $approval_form ]]; then
      lifted_approval=$approval
      allow
    fi
    unmatched_approval=" RELEASE_APPROVAL is set and does not match the form in $approval_form_file, so the gate stays in force."
    ;;
esac

release_gate="A release manager runs prod deploys, commands against prod, and release tag pushes. Do not run this; report what is ready to promote, such as the commit SHA. If a gated command appears only inside a message, write the text to a file and pass it with git commit -F <file> or gh pr create --body-file <file>.$unmatched_approval"

# The gate reads the command line as text, joining continued lines and dropping quotes,
# backslashes, and fd redirections, so wrappers such as bash -c, eval, or npx and split words such
# as pr''od do not hide the common forms. A dispatch input the gate cannot read (a variable, a
# command substitution, a file, or stdin) counts as prod. It is a convenience, not a security
# boundary: the prod environment's required reviewers and the deploy credentials are.
text=${command//'\\'/}
text=${text//$'\\\n'/}
text=$(sed -E 's/([0-9]*[<>]&[0-9-]*|&>>?)//g' <<< "${text//[\"\'\\]/}")
simple=$'[^;&|\n]*'
prod="(prod([^[:alnum:]_-]|$)|[\$\`@])"
dispatch="(workflow[[:space:]]+run|/dispatches)"
environment_field="environment[]]*[=:][[:space:]]*$prod"
unreadable_inputs="--(json|input)([[:space:]=]|$)"
# deploy:railway
# A Railway environment the gate cannot read counts as prod too.
railway="(^|[^[:alnum:]_.-])(railway|@railway/cli(@[^[:space:]]*)?)([[:space:]]$simple)?"
# deploy:end
git_push="(^|[^[:alnum:]_.-])git([[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+|--(git-dir|work-tree|namespace|config-env)[[:space:]]+[^[:space:]]+|--?[^[:space:]]+))*[[:space:]]+push([[:space:]]$simple)?"
tag_ref="([[:space:]:+]((refs/)?tags/|v[0-9])|[[:space:]]--((follow-)?tags|mirror)([[:space:]=]|$))"

if [[ $text =~ $dispatch$simple($environment_field|$unreadable_inputs) || $text =~ $environment_field$simple$dispatch ]]; then
  block "$release_gate"
fi
# deploy:railway
if [[ $text =~ $railway[[:space:]](-[[:alpha:]]*e([[:space:]]+|=)?|--environment([[:space:]]+|=))$prod || $text =~ $railway[[:space:]](env|environment)([[:space:]]+[[:alpha:]]+)?[[:space:]]+$prod ]]; then
  block "$release_gate"
fi
# deploy:end
if [[ $text =~ $git_push$tag_ref || $(tr '[:upper:]' '[:lower:]' <<< "$text") == *push.followtags* ]]; then
  block "$release_gate"
fi
allow
