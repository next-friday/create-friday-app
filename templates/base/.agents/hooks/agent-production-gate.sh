#!/usr/bin/env bash
set -uo pipefail

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-production-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".agents/hooks/agent-production-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
command=$(jq -r '.command // .tool_input.command // empty')
[[ -n $command ]] || allow
approval=$(tr '[:upper:]' '[:lower:]' <<< "${RELEASE_APPROVAL:-}")
case $approval in
  "" | 0 | false | no) ;;
  *) allow ;;
esac

release_gate="A release manager runs prod deploys, commands against prod, and release tag pushes. Do not run this; report what is ready to promote, such as the commit SHA. If a gated command appears only inside a message, write the text to a file and pass it with git commit -F <file> or gh pr create --body-file <file>."

# The gate reads the command line as text, joining continued lines and dropping quotes,
# backslashes, and fd redirections, so wrappers such as bash -c, eval, or npx and split words such
# as pr''od do not hide the common forms. A dispatch input or Railway environment the gate cannot
# read (a variable, a command substitution, a file, or stdin) counts as prod. It is a convenience,
# not a security boundary: the prod environment's required reviewers and Railway credentials are.
text=${command//'\\'/}
text=${text//$'\\\n'/}
text=$(sed -E 's/([0-9]*[<>]&[0-9-]*|&>>?)//g' <<< "${text//[\"\'\\]/}")
simple=$'[^;&|\n]*'
prod="(prod([^[:alnum:]_-]|$)|[\$\`@])"
dispatch="(workflow[[:space:]]+run|/dispatches)"
environment_field="environment[]]*[=:][[:space:]]*$prod"
unreadable_inputs="--(json|input)([[:space:]=]|$)"
railway="(^|[^[:alnum:]_.-])(railway|@railway/cli(@[^[:space:]]*)?)([[:space:]]$simple)?"
git_push="(^|[^[:alnum:]_.-])git([[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+|--(git-dir|work-tree|namespace|config-env)[[:space:]]+[^[:space:]]+|--?[^[:space:]]+))*[[:space:]]+push([[:space:]]$simple)?"
tag_ref="([[:space:]:+]((refs/)?tags/|v[0-9])|[[:space:]]--((follow-)?tags|mirror)([[:space:]=]|$))"

if [[ $text =~ $dispatch$simple($environment_field|$unreadable_inputs) || $text =~ $environment_field$simple$dispatch ]]; then
  block "$release_gate"
fi
if [[ $text =~ $railway[[:space:]](-[[:alpha:]]*e([[:space:]]+|=)?|--environment([[:space:]]+|=))$prod || $text =~ $railway[[:space:]](env|environment)([[:space:]]+[[:alpha:]]+)?[[:space:]]+$prod ]]; then
  block "$release_gate"
fi
if [[ $text =~ $git_push$tag_ref || $(tr '[:upper:]' '[:lower:]' <<< "$text") == *push.followtags* ]]; then
  block "$release_gate"
fi
allow
