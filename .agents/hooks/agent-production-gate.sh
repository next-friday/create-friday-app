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

release_gate="Only .github/workflows/release.yml publishes the package, from the Release environment after the version pull request merges, and a maintainer approves the staged version (CONTRIBUTING.md, Releasing). Do not publish; report that the release waits on that pull request. To inspect the package, run pnpm pack. If a publish command appears only inside a message, write the text to a file with your file tool, not a shell heredoc, and pass it with git commit -F <file> or gh pr create --body-file <file>."

# The gate reads the command line as text, joining continued lines and dropping quotes,
# backslashes, and fd redirections, so wrappers such as bash -c, eval, or npx and split words do
# not hide the common forms. It is a convenience, not a security boundary: the npm trusted
# publisher and the Release environment are.
text=${command//'\\'/}
text=${text//$'\\\n'/}
text=$(sed -E 's/([0-9]*[<>]&[0-9-]*|&>>?)//g' <<< "${text//[\"\'\\]/}")
options="([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*"
publish="(^|[^[:alnum:]_.-])((npm|pnpm)$options[[:space:]]+(pub(l(i(s(h)?)?)?)?|stage[[:space:]]+(publish|approve))|(changeset|@changesets/cli(@[^[:space:]]*)?)$options[[:space:]]+publish)([^[:alnum:]_-]|$)"

if [[ $text =~ $publish ]]; then
  block "$release_gate"
fi
allow
