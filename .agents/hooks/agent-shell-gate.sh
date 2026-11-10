#!/usr/bin/env bash
set -uo pipefail

allow() {
  printf '%s\n' '{"permission":"allow"}'
  exit 0
}

block() {
  jq -n --arg message "$1" '{permission:"deny",user_message:$message,agent_message:$message}'
  printf 'agent-shell-gate: %s\n' "$1" >&2
  exit 2
}

irreversible=""

# Record the first irreversible command, so the gate asks the person once a block has been ruled out.
pause() {
  [[ -n $irreversible ]] || irreversible=$1
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
  block "Changing $1 from the shell is blocked. $policy"
}

check_config_key() {
  local key
  key=$(tr '[:upper:]' '[:lower:]' <<< "$1")
  if [[ $key == *core.hookspath* ]]; then
    block "Changing core.hooksPath is blocked. Stop and ask the user."
  fi
  if [[ $key == alias.* ]]; then
    block "Defining git aliases is blocked, because an alias can skip hooks. Run the git command directly."
  fi
  if [[ $key == *'$'* || $key == *'`'* ]]; then
    block "Write git config keys literally, without shell expansion."
  fi
  return 0
}

check_commit() {
  local word cluster position skip_next=0
  for word in "$@"; do
    if ((skip_next)); then
      skip_next=0
      continue
    fi
    case $word in
      --) break ;;
      --message | --file | --reuse-message | --reedit-message | --template | --author | --date | --cleanup | --fixup | --squash | --trailer | --pathspec-from-file) skip_next=1 ;;
      --*) ;;
      -?*)
        cluster=${word#-}
        for ((position = 0; position < ${#cluster}; position++)); do
          case ${cluster:position:1} in
            n) block "Skipping git hooks with git commit -n is blocked. Fix the hook failure instead." ;;
            m | F | C | c | t)
              if ((position == ${#cluster} - 1)); then
                skip_next=1
              fi
              break
              ;;
            S | u) break ;;
          esac
        done
        ;;
    esac
  done
  return 0
}

check_git() {
  local -a args=(${@+"$@"})
  local count=${#args[@]} index=0 word subcommand=""
  ((count > 0)) || return 0
  while ((index < count)); do
    word=${args[index]}
    case $word in
      -C | --git-dir | --work-tree | --namespace | --super-prefix) index=$((index + 2)) ;;
      -c | --config-env)
        check_config_key "${args[index + 1]:-}"
        index=$((index + 2))
        ;;
      --config-env=*)
        check_config_key "${word#*=}"
        index=$((index + 1))
        ;;
      -*) index=$((index + 1)) ;;
      *)
        subcommand=$word
        break
        ;;
    esac
  done
  local -a rest=("${args[@]:index+1}")

  # Git accepts any unambiguous prefix of a long option, so --no-veri works like --no-verify.
  for word in ${rest[@]+"${rest[@]}"}; do
    if [[ $word =~ ^--no-v(e(r(i(fy?)?)?)?)?(=|$) ]]; then
      block "Skipping git hooks with --no-verify is blocked. Fix the hook failure instead."
    fi
    if [[ $word == -* && ($word == *'$'* || $word == *'`'*) ]]; then
      block "Write git options literally, without shell expansion."
    fi
  done

  case $subcommand in
    commit) check_commit ${rest[@]+"${rest[@]}"} ;;
    config)
      for word in ${rest[@]+"${rest[@]}"}; do
        [[ $word == -* ]] || check_config_key "$word"
      done
      ;;
    commit-tree | update-ref) block "git commit-tree and git update-ref are blocked, because they create commits without hooks. Use git commit." ;;
    checkout | restore | rm | mv | apply)
      local staged=0 worktree=0
      for word in ${rest[@]+"${rest[@]}"}; do
        if [[ $word =~ $protected ]]; then
          writes_protected "$word"
        fi
        [[ $word == --staged || $word =~ ^-[a-zA-Z]*S ]] && staged=1
        [[ $word == --worktree || $word =~ ^-[a-zA-Z]*W ]] && worktree=1
      done
      if [[ $subcommand =~ ^(checkout|restore)$ ]] && ! ((staged == 1 && worktree == 0)); then
        for word in ${rest[@]+"${rest[@]}"}; do
          case $word in
            . | ./ | :/) pause "git $subcommand $word discards uncommitted changes." ;;
            --force) [[ $subcommand == checkout ]] && pause "git checkout --force discards uncommitted changes." ;;
            --*) ;;
            -*f*) [[ $subcommand == checkout ]] && pause "git checkout $word discards uncommitted changes." ;;
          esac
        done
      fi
      ;;
    switch)
      for word in ${rest[@]+"${rest[@]}"}; do
        case $word in
          --discard-changes | --force | -f) pause "git switch $word discards uncommitted changes." ;;
        esac
      done
      ;;
    push)
      local dry_run=0
      for word in ${rest[@]+"${rest[@]}"}; do
        [[ $word == --dry-run || $word =~ ^-[a-zA-Z]*n[a-zA-Z]*$ ]] && dry_run=1
      done
      if ((dry_run == 0)); then
        for word in ${rest[@]+"${rest[@]}"}; do
          case $word in
            --force | --force=* | --mirror | --delete | --prune) pause "git push $word overwrites or deletes work on the remote." ;;
            --*) ;;
            -*[fd]*) pause "git push $word overwrites or deletes work on the remote." ;;
            +* | :*) pause "git push $word overwrites or deletes work on the remote." ;;
          esac
        done
      fi
      ;;
    reset)
      for word in ${rest[@]+"${rest[@]}"}; do
        [[ $word == --hard || $word == --merge ]] && pause "git reset $word discards uncommitted changes."
      done
      ;;
    clean)
      local dry_run=0
      for word in ${rest[@]+"${rest[@]}"}; do
        [[ $word == --dry-run || $word =~ ^-[a-zA-Z]*n ]] && dry_run=1
      done
      ((dry_run == 1)) || pause "git clean deletes untracked files."
      ;;
    branch)
      local delete=0 force=0
      for word in ${rest[@]+"${rest[@]}"}; do
        case $word in
          --delete) delete=1 ;;
          --force) force=1 ;;
          --*) ;;
          -*D*) delete=1 force=1 ;;
          -*)
            [[ $word == *d* ]] && delete=1
            [[ $word == *f* ]] && force=1
            ;;
        esac
      done
      ((delete == 1 && force == 1)) && pause "Force-deleting a branch loses commits that no other branch holds."
      ;;
    stash)
      [[ ${rest[0]:-} =~ ^(drop|clear)$ ]] && pause "git stash ${rest[0]} deletes stashed work."
      ;;
    worktree)
      if [[ ${rest[0]:-} == remove ]]; then
        for word in "${rest[@]:1}"; do
          [[ $word == --force || $word == -f ]] && pause "git worktree remove $word deletes uncommitted work in that worktree."
        done
      fi
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
  if [[ $first =~ ^(repo|issue|release)$ && $second == delete ]]; then
    block "gh $first delete is blocked. Stop and ask the user."
  fi
  [[ $first == alias && $second =~ ^(set|import)$ ]] && block "gh aliases are blocked, because an alias can hide a merge or an approval. Run the gh command directly."
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
    if [[ $joined =~ (query|event|state)=@ ]]; then
      block "gh api reading a query, a review event, or a deployment state from a file is blocked, because the gate cannot read it. Pass the value inline."
    fi
    if [[ $joined =~ [[:space:]]--input([[:space:]]|=) && ($joined =~ [[:space:]]graphql[[:space:]] || $joined =~ pulls/[^/[:space:]]+/(reviews|merge) || $joined == *pending_deployments*) ]]; then
      block "gh api reading this request body from a file or stdin is blocked, because the gate cannot read it. Pass the fields inline."
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

  for word in "${args[@]}"; do
    if [[ $word == HUSKY=0 ]]; then
      block "HUSKY=0 is blocked. Fix the hook failure instead."
    fi
    if [[ $word =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] && [[ $(tr '[:upper:]' '[:lower:]' <<< "$word") == *core.hookspath* ]]; then
      block "Changing core.hooksPath is blocked. Stop and ask the user."
    fi
  done

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
if [[ -n $irreversible ]]; then
  message="$irreversible It cannot be undone, so ask the person before running it."
  if [[ $(jq -r '.hook_event_name // empty' <<< "$input") == PreToolUse ]]; then
    jq -n --arg message "$message" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$message}}'
  else
    jq -n --arg message "$message" '{permission:"ask",user_message:$message,agent_message:$message}'
  fi
  exit 0
fi
allow
