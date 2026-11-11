import {spawnSync} from "node:child_process";

type GateCase = {
  expectedExit: 0 | 2;
  expectedPermission?: "allow" | "ask";
  gate: string;
  input: Record<string, unknown>;
  name: string;
};

const shellGate = ".agents/hooks/agent-shell-gate.sh";
const suppressionGate = ".agents/hooks/agent-suppression-gate.sh";
const constitutionGate = ".cursor/hooks/agent-constitution-gate.sh";
const mcpGate = ".agents/hooks/agent-mcp-gate.sh";
const productionGate = ".agents/hooks/agent-production-gate.sh";
const sourceFile = "src/example.ts";

const blockedCommands = [
  "git commit -n -m x",
  "git commit -nm x",
  "git commit -a -n -m x",
  "git commit -an",
  "git commit -m x -n",
  "git commit --amend -n",
  "git -C . commit -n",
  "git commit --no-verify -m x",
  "git push --no-verify",
  "HUSKY=0 git commit -m x",
  "export HUSKY=0; git commit -m x",
  "git config core.hooksPath /dev/null",
  "gh repo delete next-friday/example",
  "gh issue delete 1",
  "gh release delete v1",
  "git commit --no-verif -m x",
  "git commit --no-v -m x",
  'git commit "--no-verify" -m x',
  "git commit '-n' -m x",
  'env "HUSKY=0" git commit -m x',
  "git config core.hookspath /dev/null",
  "git -c core.HooksPath=/dev/null commit -m x",
  "git -c alias.c='commit --no-verify' c",
  "git config alias.c commit",
  "git commit-tree HEAD^{tree} -m x",
  "git update-ref refs/heads/main HEAD",
  "printf 'exit 0' > .husky/pre-commit",
  "rm -rf .husky/_",
  "sed -i '' s/gitleaks/true/ .husky/pre-commit",
  "tee .gitleaks.toml < /dev/null",
  "cp /dev/null .agents/hooks/agent-shell-gate.sh",
  "git -c core.hooks\\Path=/dev/null commit -m x",
  "git commit --no-ver\\ify -m x",
  "HU\\SKY=0 git commit -m x",
  "git commit -m x --no-$(echo verify)",
  "/usr/bin/git commit -n -m x",
  "git --git-dir .git commit -n -m x",
  "git commit -n; git status",
  "git commit -m x -n&&git push",
  "rm -rf .husky",
  "mv .husky /tmp/h",
  "sed -e s/a/b/ -i .husky/pre-commit",
  "python3 -c \"open('.husky/pre-commit','w')\"",
  "dd of=.husky/pre-commit",
  "git config core.hooks$X x",
  "cd .husky && python3 -c \"open('pre-commit','w')\"",
  "GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/x git commit -m x",
  'bash -c "git commit -n -m x"',
  "eval git commit -n -m x",
  "git checkout -- .husky/pre-commit",
  "echo x >> .claude/settings.local.json",
  "git merge --no-verify feature",
  "$(git commit --no-verify -m x)",
  "echo `git commit -n -m x`",
  'echo "$(rm -rf .husky)"',
  "x=$(echo $(git commit -n -m x))",
  "echo \"$(echo ')'; git commit --no-verify -m x)\"",
  "$(echo \\); git commit -n -m x)",
  "$(echo x # )\ngit commit -n -m x)",
  'echo "$(true&# )\ngit commit -n -m x)"',
  'echo "$(true|# )\ngit commit -n -m x)"',
  'echo "$( (true)# )\ngit commit -n -m x)"',
  "{ git commit --no-verify -m x; }",
  "if true; then git commit -n -m x; fi",
  "while true; do git commit -n -m x; done",
  "if git commit -n -m x; then true; fi",
  "printf x > .git/config.worktree",
  "gh pr merge 1 --squash",
  "gh pr merge 1 --auto",
  "gh -R next-friday/example pr merge 1",
  "gh pr -R next-friday/example merge 1",
  "timeout 5 gh pr merge 1",
  "nice -n 5 gh pr merge 1",
  "xargs gh pr merge",
  "gh pr review 1 --approve",
  "gh pr review 1 --approve=true",
  "gh pr review 1 -a",
  "gh -R next-friday/example pr review 1 -a",
  "gh alias set m 'pr merge'",
  "gh api repos/next-friday/example/pulls/1/merge -X PUT",
  "gh api graphql -f query='mutation { mergePullRequest(input: {}) { clientMutationId } }'",
  "gh api graphql -f query=@query.graphql",
  "gh api repos/next-friday/example/pulls/1/reviews -f event=APPROVE",
  "gh api -X POST repos/next-friday/example/actions/runs/1/pending_deployments -f state=approved",
  "gh pr review 1 -ca",
  "gh alias import aliases.yml",
  "gh api graphql -Fquery=@query.graphql",
  "gh api graphql --input query.json",
  "gh api -X POST repos/next-friday/example/pulls/1/reviews --input review.json",
  "gh api repos/next-friday/example/actions/runs/1/pending_deployments -F state=@state.txt",
  "gh api graphql -f query='mutation { enablePullRequestAutoMerge(input: {}) { clientMutationId } }'",
  "gh api graphql -f query='mutation { enqueuePullRequest(input: {}) { clientMutationId } }'",
  "gh api graphql -f query='mutation($e: PullRequestReviewEvent!) { addPullRequestReview(input: {event: $e}) { clientMutationId } }' -f e=APPROVE",
  "gh api -X POST repos/next-friday/example/merges -f base=main -f head=feature",
  "gh api -X PUT repos/next-friday/example/pulls/1/merge/",
  "timeout 5 bash -c 'gh pr merge 1'",
  "find . -exec sh -c 'gh pr merge 1' ;",
  "sudo -u me bash -c 'gh pr merge 1'",
  "bash -c -- 'gh pr merge 1'",
];

const irreversibleCommands = [
  "git push --force",
  "git push -f origin x",
  "git push origin x -f",
  "git push -uf origin x",
  "git push origin +x",
  "git push origin :x",
  "git push -d origin x",
  "git push --delete origin x",
  "git push --mirror",
  "git reset --hard HEAD~1",
  "git -C . reset --hard",
  "git clean -fd",
  "git clean -xdf",
  "git branch -D x",
  "git branch -df x",
  "git branch --delete --force x",
  "git checkout .",
  "git checkout -- .",
  "git checkout -f main",
  "git restore .",
  "git restore --worktree .",
  "git switch --discard-changes main",
  "git stash drop",
  "git worktree remove --force x",
  "git restore :/",
  "timeout 5 git push --force",
  "xargs git reset --hard",
];

const allowedCommands = [
  'git commit -m "add login"',
  "git commit --signoff -m x",
  "git commit --amend --no-edit",
  "git status",
  "pnpm check",
  "git commit --verbose -m x",
  "cat .husky/pre-commit",
  "git diff .husky/pre-commit",
  'git commit -m "feat(x): y" && git log -n 3',
  "git commit -m x; ls -n",
  "git commit -m \"$(printf 'feat(x): y')\"",
  "echo '$(git commit -n -m x)'",
  'git commit -m "run with -n"',
  'git commit -am "fix: -n flag handling"',
  "git diff .husky/pre-commit > /tmp/x",
  "ls .husky/ ; cp a b",
  'git commit -m "chore: rm .husky/pre-commit file"',
  'gh pr create --title "docs(x): explain core.hooksPath"',
  'gh pr create --title "ci(x): remove HUSKY=0 usage"',
  "git push -n",
  "node scripts/check-agent-gates.ts",
  "git push -u origin x",
  "git push --dry-run --force",
  "git push --force-with-lease origin x",
  'gh pr create --title "fix(x): y" --body z',
  "gh pr comment 1 --body x",
  'gh pr review 1 -c -b "fix -a flag"',
  'gh api repos/next-friday/example/issues/1/comments -f body="Please APPROVE"',
  "gh api repos/next-friday/example/pulls/1",
  "gh pr checks 1 --watch",
  "git branch -d x",
  "git checkout feature",
  "git checkout .changeset/x.md",
  "git restore --staged .",
  "git clean -n",
  "git reset --soft HEAD~1",
  "git stash pop",
  "timeout 60 pnpm test",
  'gh api graphql -f query="query { viewer { login } }"',
  'gh api repos/next-friday/example/issues/1/comments -f body="APPROVED by QA"',
];

const publishCommands = [
  "npm publish",
  "npm publish;echo",
  "pnpm publish --access public",
  "pnpm -r publish",
  "pnpm --filter x publish",
  "npm pub",
  "npm stage publish next-friday-create-app-6.0.0.tgz",
  "npm stage approve 123",
  "pnpm changeset publish",
  "pnpm exec changeset publish",
  "npx changeset publish",
  "pnpm dlx @changesets/cli@3.0.3 publish",
  "bash -c 'npm publish'",
  "npm \\\n  publish",
];

const nonPublishCommands = [
  "pnpm changeset",
  "pnpm changeset version",
  "pnpm pack",
  "pnpm approve-builds",
  "npm stage list",
  "npm help publish",
  "npm view @next-friday/create-app versions",
  'pnpm vitest run test/stacks.test.ts -t "does not publish"',
  'git commit -m "docs: npm packages publish only from CI"',
  'git commit -m "deploy to production"',
  'git commit -m "gate npm publishing in the root hook"',
];

const mcpTools = {
  blocked: [
    "mcp__github__merge_pull_request",
    "github__merge_pull_request",
    "github__enable_pr_auto_merge",
    "github__pull_request_review_write",
  ],
  allowed: ["github__create_pull_request", "github__add_issue_comment"],
};

const protectedPaths = [
  ".agents/rules/code-comments.md",
  ".agents/rules.json",
  ".agents/hooks/agent-shell-gate.sh",
  ".claude/rules/code-comments.md",
  ".claude/settings.json",
  ".cursor/rules/code-comments.mdc",
  ".cursor/hooks.json",
  ".cursor/hooks/agent-constitution-gate.sh",
  "scripts/sync-agent-rules.ts",
  "eslint.config.ts",
  ".husky/pre-commit",
  ".lintstagedrc.json",
  ".gitleaks.toml",
  ".git/hooks/pre-commit",
  ".git/config",
  ".git/config.worktree",
  ".claude/settings.local.json",
  "src/../.husky/pre-commit",
];

const cases: GateCase[] = [
  ...blockedCommands.flatMap(command => [
    {
      gate: shellGate,
      input: {
        command,
      },
      expectedExit: 2 as const,
      name: `Cursor shell: ${command}`,
    },
    {
      gate: shellGate,
      input: {
        tool_input: {
          command,
        },
      },
      expectedExit: 2 as const,
      name: `Claude Bash: ${command}`,
    },
  ]),
  ...irreversibleCommands.flatMap(command => [
    {
      gate: shellGate,
      input: {
        command,
      },
      expectedExit: 0 as const,
      expectedPermission: "ask" as const,
      name: `Cursor shell asks first: ${command}`,
    },
    {
      gate: shellGate,
      input: {
        hook_event_name: "PreToolUse",
        tool_input: {
          command,
        },
      },
      expectedExit: 0 as const,
      expectedPermission: "ask" as const,
      name: `Claude Bash asks first: ${command}`,
    },
  ]),
  ...allowedCommands.map(command => ({
    gate: shellGate,
    input: {
      command,
    },
    expectedExit: 0 as const,
    expectedPermission: "allow" as const,
    name: `shell: ${command}`,
  })),
  ...publishCommands.flatMap(command => [
    {
      gate: productionGate,
      input: {
        command,
      },
      expectedExit: 2 as const,
      name: `Cursor publish: ${command}`,
    },
    {
      gate: productionGate,
      input: {
        tool_input: {
          command,
        },
      },
      expectedExit: 2 as const,
      name: `Claude publish: ${command}`,
    },
  ]),
  ...nonPublishCommands.map(command => ({
    gate: productionGate,
    input: {
      command,
    },
    expectedExit: 0 as const,
    expectedPermission: "allow" as const,
    name: `publish gate: ${command}`,
  })),
  ...mcpTools.blocked.map(tool => ({
    gate: mcpGate,
    input: {
      tool_name: tool,
      tool_input: "{}",
    },
    expectedExit: 2 as const,
    name: `MCP: ${tool}`,
  })),
  ...mcpTools.allowed.map(tool => ({
    gate: mcpGate,
    input: {
      tool_name: tool,
      tool_input: "{}",
    },
    expectedExit: 0 as const,
    expectedPermission: "allow" as const,
    name: `MCP: ${tool}`,
  })),
  {
    gate: suppressionGate,
    name: "suppression: eslint-disable",
    expectedExit: 2,
    input: {
      tool_input: {
        file_path: sourceFile,
        content: "// eslint-disable-next-line\n",
      },
    },
  },
  ...["// NOSONAR", "# noqa: E501", "# hadolint ignore=DL3008", "# trivy:ignore:AVD-DS-0002"].map(
    content => ({
      gate: suppressionGate,
      input: {
        tool_input: {
          file_path: sourceFile,
          content,
        },
      },
      expectedExit: 2 as const,
      name: `suppression: ${content}`,
    }),
  ),
  {
    gate: suppressionGate,
    name: "suppression: noqa inside a word",
    expectedExit: 0,
    input: {
      tool_input: {
        file_path: sourceFile,
        content: "const canoqaValue = 1;\n",
      },
    },
  },
  {
    gate: suppressionGate,
    name: "suppression: exempt directory reached through ..",
    expectedExit: 2,
    input: {
      tool_input: {
        file_path: ".agents/rules/../../src/example.ts",
        content: "// eslint-disable-next-line\n",
      },
    },
  },
  {
    gate: suppressionGate,
    name: "suppression: clean edit",
    expectedExit: 0,
    input: {
      tool_input: {
        file_path: sourceFile,
        content: "export const value = 1;\n",
      },
    },
  },
  ...protectedPaths.map(file => ({
    gate: constitutionGate,
    input: {
      tool_input: {
        file_path: file,
      },
    },
    expectedExit: 2 as const,
    name: `constitution: ${file}`,
  })),
  {
    gate: constitutionGate,
    name: "constitution: src file",
    expectedExit: 0,
    input: {
      tool_input: {
        file_path: sourceFile,
      },
    },
  },
];

/**
 * Reads the permission a gate printed in the format its tool reads: Claude Code's
 * `hookSpecificOutput` for a `PreToolUse` input, and Cursor's `permission` otherwise.
 * @param gateCase - The case whose input decides the format.
 * @param stdout - The gate's standard output.
 * @returns The permission, or undefined when the output is not JSON.
 */
function permissionOf(gateCase: GateCase, stdout: string): string | undefined {
  try {
    const output = JSON.parse(stdout) as {
      hookSpecificOutput?: {permissionDecision?: string};
      permission?: string;
    };

    return gateCase.input.hook_event_name === "PreToolUse" && gateCase.expectedPermission === "ask"
      ? output.hookSpecificOutput?.permissionDecision
      : output.permission;
  } catch {
    return undefined;
  }
}

const failures = cases.filter(gateCase => {
  const result = spawnSync(gateCase.gate, {
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: process.cwd(),
      CURSOR_PROJECT_DIR: process.cwd(),
    },
    input: JSON.stringify(gateCase.input),
  });

  const isPermissionWrong =
    gateCase.expectedPermission !== undefined &&
    permissionOf(gateCase, result.stdout.toString()) !== gateCase.expectedPermission;

  return result.status !== gateCase.expectedExit || isPermissionWrong;
});

if (failures.length > 0) {
  const failureLines = failures.map(gateCase => {
    const permission =
      gateCase.expectedPermission === undefined
        ? ""
        : ` and permission ${gateCase.expectedPermission}`;

    return `- ${gateCase.name} (expected exit ${gateCase.expectedExit}${permission})`;
  });

  process.stderr.write(`Agent gate checks failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${cases.length} agent gate cases.\n`);
}
