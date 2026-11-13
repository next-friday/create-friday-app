#!/usr/bin/env bash
set -uo pipefail

# shellcheck source=.agents/hooks/record-gate-decision.sh
if ! source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/record-gate-decision.sh"; then
  printf '%s\n' '{"permission":"deny","user_message":"agent-shell-gate: .agents/hooks/record-gate-decision.sh could not be loaded, so the gate cannot record its decision. Stop and report this error to the user; agents may not edit the gate."}'
  exit 2
fi

allow() {
  record_gate_decision agent-shell-gate allow "" "${input:-}" "${lifted_approval:-}"
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  record_gate_decision agent-shell-gate block "${2:-$1}" "${input:-}"
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-shell-gate: %s\n' "$1" >&2
  exit 2
}

trap 'block ".agents/hooks/agent-shell-gate.sh failed. Stop and report this error to the user; agents may not edit the gate."' ERR
command -v jq > /dev/null || block "jq is required to read the hook input. Install it: https://jqlang.org/download/"
input=$(cat)
command=$(jq -r '.command // .tool_input.command // empty' <<< "$input")
[[ -n $command ]] || allow

separator=$'\x1f'
redirect=$'\x1e'
protected_names='(\.husky|\.agents|\.cursor|\.claude/rules|\.claude/settings(\.local)?\.json|\.git/hooks|\.git/config(\.worktree)?|\.lintstagedrc\.json|\.gitleaks\.toml|\.commitlintrc\.json|\.prettierrc\.json|prettier\.config\.ts|eslint\.config\.ts|scripts/(sync-agent-rules|check-agent-gates)\.ts)'
protected="(^|[/=])$protected_names(/|$)"
policy="Hooks and agent policy files are company policy; stop and ask the user."
human_gate="A code owner approves a pull request and a person merges it. Do not approve or merge; report that the pull request waits on that review."
in_protected=0

# Split a command line into words as the shell does: quotes and backslashes are removed, and
# command substitutions stay inside their word and are also collected, so they are checked as
# command lines too. Separators become their own word, and a redirection target is prefixed, so
# each simple command is checked on its own.
lex() {
  local text=$1 length=${#1} index=0 char word="" has_word=0 quote="" inner_quote="" depth=0 start=0 end is_target=0
  words=()
  substitutions=()

  flush() {
    if ((has_word)); then
      if ((is_target)); then
        words+=("$redirect$word")
        is_target=0
      else
        words+=("$word")
      fi
    fi
    word=""
    has_word=0
  }

  while ((index < length)); do
    char=${text:index:1}
    if ((depth > 0)); then
      word+=$char
      if [[ -n $inner_quote ]]; then
        if [[ $char == "$inner_quote" ]]; then
          inner_quote=""
        elif [[ $inner_quote == '"' && $char == '\' ]]; then
          index=$((index + 1))
          word+=${text:index:1}
        fi
      elif [[ $char == "'" || $char == '"' ]]; then
        inner_quote=$char
      elif [[ $char == '\' ]]; then
        index=$((index + 1))
        word+=${text:index:1}
      elif [[ $char == '#' && ${text:index-1:1} == [[:space:]\;\&\|\(\)\<\>] ]]; then
        while ((index + 1 < length)) && [[ ${text:index+1:1} != $'\n' ]]; do
          index=$((index + 1))
        done
      elif [[ $char == '(' ]]; then
        depth=$((depth + 1))
      elif [[ $char == ')' ]]; then
        depth=$((depth - 1))
        if ((depth == 0)); then
          substitutions+=("${text:start:index-start}")
        fi
      fi
    elif [[ $quote != "'" && $char == '$' && ${text:index+1:1} == '(' ]]; then
      word+='$('
      index=$((index + 1))
      start=$((index + 1))
      depth=1
      has_word=1
    elif [[ $quote != "'" && $char == '`' ]]; then
      end=$index
      while ((end + 1 < length)) && [[ ${text:end+1:1} != '`' ]]; do
        end=$((end + 1))
      done
      substitutions+=("${text:index+1:end-index}")
      word+=${text:index:end-index+2}
      index=$((end + 1))
      has_word=1
    elif [[ -n $quote ]]; then
      if [[ $char == "$quote" ]]; then
        quote=""
      elif [[ $quote == '"' && $char == '\' ]]; then
        index=$((index + 1))
        word+=${text:index:1}
      else
        word+=$char
      fi
    else
      case $char in
        "'" | '"')
          quote=$char
          has_word=1
          ;;
        '\')
          index=$((index + 1))
          word+=${text:index:1}
          has_word=1
          ;;
        ' ' | $'\t')
          flush
          ;;
        ';' | '&' | '|' | $'\n' | '(' | ')')
          flush
          words+=("$separator")
          ;;
        '{' | '}')
          if ((has_word)); then
            word+=$char
            has_word=1
          else
            flush
            words+=("$separator")
          fi
          ;;
        '>')
          flush
          while [[ ${text:index+1:1} == [\>\|\&] ]]; do
            index=$((index + 1))
          done
          is_target=1
          ;;
        *)
          word+=$char
          has_word=1
          ;;
      esac
    fi
    index=$((index + 1))
  done
  flush
  return 0
}

writes_protected() {
  block "Changing $1 from the shell is blocked. $policy" "Changing a protected path from the shell is blocked. $policy"
}

check_git() {
  local -a args=(${@+"$@"})
  local count=${#args[@]} index=0 word subcommand=""
  ((count > 0)) || return 0
  while ((index < count)); do
    word=${args[index]}
    case $word in
      -C | -c | --git-dir | --work-tree | --namespace | --super-prefix | --config-env) index=$((index + 2)) ;;
      -*) index=$((index + 1)) ;;
      *)
        subcommand=$word
        break
        ;;
    esac
  done
  local -a rest=("${args[@]:index+1}")

  case $subcommand in
    checkout | restore | rm | mv | apply)
      for word in ${rest[@]+"${rest[@]}"}; do
        if [[ $word =~ $protected ]]; then
          writes_protected "$word"
        fi
      done
      ;;
  esac
  return 0
}

# Merging and approving are human gates. Read gh's words with their flags and flag values set aside.
check_gh() {
  local -a args=(${@+"$@"}) positional=()
  local count=${#args[@]} index=0 word
  while ((index < count)); do
    word=${args[index]}
    case $word in
      -R | --repo | --hostname | -b | --body | -F | --body-file | -t | --title | -B | --base | -H | --head | -X | --method | -f | --field | --raw-field | -H | --header | -q | --jq | --template | --input)
        index=$((index + 2))
        continue
        ;;
      -*) ;;
      *) positional+=("$word") ;;
    esac
    index=$((index + 1))
  done
  local first=${positional[0]:-} second=${positional[1]:-}
  [[ $first == pr && $second == merge ]] && block "$human_gate"
  if [[ $first == pr && $second == review ]]; then
    index=0
    while ((index < count)); do
      word=${args[index]}
      case $word in
        -b | --body | -F | --body-file | -R | --repo) index=$((index + 1)) ;;
        --approve | --approve=*) block "$human_gate" ;;
        --*) ;;
        -*a*) block "$human_gate" ;;
      esac
      index=$((index + 1))
    done
  fi
  if [[ $first == api ]]; then
    local joined=" ${args[*]} "
    if [[ $joined =~ pulls/[^/[:space:]]+/merge/?[[:space:]?] || $joined =~ repos/[^/[:space:]]+/[^/[:space:]]+/merges[/[:space:]?] || $joined == *mergePullRequest* || $joined == *enablePullRequestAutoMerge* || $joined == *enqueuePullRequest* || $joined =~ =[\"\']?APPROVE([^A-Za-z_]|$) || $joined =~ event[\"\']?:[[:space:]]*[\"\']?APPROVE ]]; then
      block "$human_gate"
    fi
    if [[ $joined == *pending_deployments* && $joined =~ state=[\"\']?approved ]]; then
      block "A release manager approves a deployment. Do not approve it; report that the deployment waits on that approval."
    fi
  fi
  return 0
}

check_command() {
  local -a args=()
  local word name is_writer=0
  for word in "$@"; do
    if [[ $word == "$redirect"* ]]; then
      word=${word#"$redirect"}
      if ((in_protected)) || [[ $word =~ $protected ]]; then
        writes_protected "$word"
      fi
    else
      args+=("$word")
    fi
  done
  ((${#args[@]} > 0)) || return 0

  while ((${#args[@]} > 0)); do
    word=${args[0]}
    if [[ $word =~ ^[A-Za-z_][A-Za-z0-9_]*= || $word == -* ]]; then
      args=("${args[@]:1}")
      continue
    fi
    case ${word##*/} in
      env | command | exec | nohup | time | nice | sudo | builtin | if | then | else | elif | fi | while | until | for | do | done | case | esac | select | in | '!' | '{' | '}')
        args=("${args[@]:1}")
        ;;
      *) break ;;
    esac
  done
  ((${#args[@]} > 0)) || return 0
  name=${args[0]##*/}
  # A wrapper such as timeout, xargs, or find -exec runs the command named after it.
  case $name in
    git | gh | bash | sh | zsh | dash | ksh | eval) ;;
    *)
      for ((index = 1; index < ${#args[@]}; index++)); do
        case ${args[index]##*/} in
          git | gh | bash | sh | zsh | dash | ksh | eval)
            check_command "${args[@]:index}"
            break
            ;;
        esac
      done
      ;;
  esac

  case $name in
    git) check_git "${args[@]:1}" ;;
    gh) check_gh "${args[@]:1}" ;;
    bash | sh | zsh | dash | ksh)
      for ((index = 1; index < ${#args[@]}; index++)); do
        if [[ ${args[index]} =~ ^-[a-zA-Z]*c[a-zA-Z]*$ ]]; then
          [[ ${args[index + 1]:-} == -- ]] && index=$((index + 1))
          gate_line "${args[index + 1]:-}"
          break
        fi
      done
      ;;
    eval) gate_line "${args[*]:1}" ;;
    cd | pushd)
      if [[ ${args[1]:-} =~ $protected ]]; then
        in_protected=1
      fi
      ;;
    tee | rm | rmdir | mv | cp | ln | chmod | chown | truncate | install | unlink | rsync | dd | patch | sponge | shred) is_writer=1 ;;
    sed | perl)
      for word in "${args[@]:1}"; do
        if [[ $word =~ ^-[a-zA-Z]*i || $word == --in-place* ]]; then
          is_writer=1
        fi
      done
      ;;
    python | python3 | node | ruby | deno | bun)
      if ((in_protected)); then
        writes_protected "a protected directory"
      fi
      for ((index = 1; index < ${#args[@]}; index++)); do
        if [[ ${args[index]} =~ ^-(c|e|p|E|-eval|-print)$ && ${args[index + 1]:-} =~ $protected_names ]]; then
          writes_protected "${BASH_REMATCH[0]}"
        fi
      done
      ;;
  esac

  if ((is_writer)); then
    if ((in_protected)); then
      writes_protected "a protected directory"
    fi
    for word in "${args[@]:1}"; do
      if [[ $word =~ $protected ]]; then
        writes_protected "$word"
      fi
    done
  fi
  return 0
}

gate_line() {
  lex "$1"
  local -a line=(${words[@]+"${words[@]}"}) nested=(${substitutions[@]+"${substitutions[@]}"}) current=()
  local word
  for word in ${nested[@]+"${nested[@]}"}; do
    gate_line "$word"
  done
  for word in ${line[@]+"${line[@]}"}; do
    if [[ $word == "$separator" ]]; then
      check_command ${current[@]+"${current[@]}"}
      current=()
    else
      current+=("$word")
    fi
  done
  check_command ${current[@]+"${current[@]}"}
  return 0
}

gate_line "$command"
allow
