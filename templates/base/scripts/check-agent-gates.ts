import {execFileSync, spawnSync} from "node:child_process";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import path from "node:path";
import {tmpdir} from "node:os";

type GateCase = {
  expectedExit: 0 | 2;
  expectedPermission?: "allow";
  gate: string;
  input: Record<string, unknown>;
  name: string;
  projectDirectory?: string;
  releaseApproval?: string;
};

const repositoryVariables = new Set(
  execFileSync("git", ["rev-parse", "--local-env-vars"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(name => name !== ""),
);

const childEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !repositoryVariables.has(name)),
);

const shellGate = ".agents/hooks/agent-shell-gate.sh";
const constitutionGate = ".cursor/hooks/agent-constitution-gate.sh";
const mcpGate = ".agents/hooks/agent-mcp-gate.sh";
const productionGate = ".agents/hooks/agent-production-gate.sh";
const testEditGate = ".agents/hooks/agent-test-edit-gate.sh";
const sourceFile = "src/example.ts";

const blockedCommands = [
  "printf 'exit 0' > .husky/pre-commit",
  "rm -rf .husky/_",
  "sed -i '' s/gitleaks/true/ .husky/pre-commit",
  "tee .gitleaks.toml < /dev/null",
  "cp /dev/null .agents/hooks/agent-shell-gate.sh",
  "rm -rf .husky",
  "mv .husky /tmp/h",
  "sed -e s/a/b/ -i .husky/pre-commit",
  "python3 -c \"open('.husky/pre-commit','w')\"",
  "dd of=.husky/pre-commit",
  "cd .husky && python3 -c \"open('pre-commit','w')\"",
  "git checkout -- .husky/pre-commit",
  "echo x >> .claude/settings.local.json",
  'echo "$(rm -rf .husky)"',
  "printf x > .git/config.worktree",
  "git restore .husky/pre-commit",
  "git rm .husky/pre-commit",
  "git mv .husky/pre-commit /tmp/h",
  "git apply .husky/change.patch",
  "pushd .husky && echo x > pre-commit",
  "ln -s /dev/null .husky/pre-commit",
  "chmod 000 .husky/pre-commit",
  "install -m 644 x .husky/pre-commit",
  "truncate -s 0 .husky/pre-commit",
  "rsync x .husky/pre-commit",
  "patch .husky/pre-commit change.patch",
  "sponge .husky/pre-commit",
  "perl -pi -e s/a/b/ .husky/pre-commit",
  "node -e \"require('fs').writeFileSync('.husky/pre-commit','')\"",
  'ruby -e \'File.write(".husky/pre-commit", "")\'',
  "bun -e \"Bun.write('.husky/pre-commit','')\"",
  "/usr/bin/gh pr merge 1",
  "gh pr merge 1; git status",
  "git status&&gh pr merge 1",
  'bash -c "gh pr merge 1"',
  "eval gh pr merge 1",
  "$(gh pr merge 1)",
  "echo `gh pr merge 1`",
  "x=$(echo $(gh pr merge 1))",
  "echo \"$(echo ')'; gh pr merge 1)\"",
  "$(echo \\); gh pr merge 1)",
  "$(echo x # )\ngh pr merge 1)",
  'echo "$(true&# )\ngh pr merge 1)"',
  "{ gh pr merge 1; }",
  "if true; then gh pr merge 1; fi",
  "while true; do gh pr merge 1; done",
  "if gh pr merge 1; then true; fi",
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
  "gh api repos/next-friday/example/pulls/1/merge -X PUT",
  "gh api graphql -f query='mutation { mergePullRequest(input: {}) { clientMutationId } }'",
  "gh api repos/next-friday/example/pulls/1/reviews -f event=APPROVE",
  "gh api -X POST repos/next-friday/example/actions/runs/1/pending_deployments -f state=approved",
  "gh pr review 1 -ca",
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

const allowedCommands = [
  'git commit -m "add login"',
  "git status",
  "pnpm check",
  "cat .husky/pre-commit",
  "git diff .husky/pre-commit",
  "git diff .husky/pre-commit > /tmp/x",
  "ls .husky/ ; cp a b",
  'git commit -m "chore: rm .husky/pre-commit file"',
  "echo '$(gh pr merge 1)'",
  'gh pr create --title "docs(x): explain gh pr merge"',
  "node scripts/check-agent-gates.ts",
  "git push -u origin x",
  'gh pr create --title "fix(x): y" --body z',
  "gh pr comment 1 --body x",
  'gh pr review 1 -c -b "fix -a flag"',
  'gh api repos/next-friday/example/issues/1/comments -f body="Please APPROVE"',
  "gh api repos/next-friday/example/pulls/1",
  "gh pr checks 1 --watch",
  "git checkout feature",
  "git checkout .changeset/x.md",
  "timeout 60 pnpm test",
  'gh api graphql -f query="query { viewer { login } }"',
  'gh api repos/next-friday/example/issues/1/comments -f body="APPROVED by QA"',
];

const railwayProductionCommand = "railway up -e prod";

const productionCommands = [
  "gh workflow run deploy.yml -f environment=prod -f commit_sha=abc",
  "gh workflow run Deploy --field 'environment=prod'",
  "gh workflow run deploy.yml -fenvironment=prod",
  "gh workflow run deploy.yml --field=environment=prod",
  'gh workflow run deploy.yml -f "environment=prod"',
  "gh workflow run deploy.yml -F environment=@environment.txt",
  "gh workflow run deploy.yml --json",
  "gh workflow run deploy.yml --json=true",
  "for e in uat prod; do gh workflow run deploy.yml -f environment=$e -f commit_sha=abc; done",
  "env=prod; gh workflow run deploy.yml -f environment=$env",
  "gh workflow run deploy.yml -f environment=$(echo prod)",
  'gh workflow run deploy.yml -f "environment=$TARGET"',
  "gh api -X POST repos/o/r/actions/workflows/deploy.yml/dispatches -f ref=main -f 'inputs[environment]=prod'",
  "gh api repos/o/r/actions/workflows/deploy.yml/dispatches/ -f inputs[environment]=prod",
  "gh api -f 'inputs[environment]=prod' repos/o/r/actions/workflows/deploy.yml/dispatches",
  "gh api repos/o/r/actions/workflows/1/dispatches --input body.json",
  "gh api repos/o/r/actions/workflows/1/dispatches -f inputs[environment]=$E",
  "bash -c 'gh workflow run deploy.yml -f environment=prod'",
  "railway up --ci --environment prod",
  railwayProductionCommand,
  "railway up -e=prod",
  "railway up -eprod",
  "railway up -ce prod",
  "railway up -ceprod",
  "railway redeploy -ye prod",
  "railway up -s api -e prod",
  "railway up --environment=prod",
  'railway up -e "$ENV"',
  "for e in uat prod; do railway up -e $e; done",
  "railway env prod",
  "railway env link prod",
  "railway environment prod",
  "railway environment delete prod --yes",
  "railway link -e prod",
  "railway logs -e prod",
  "railway variables --set A=b -e prod",
  "npx @railway/cli up -e prod",
  "pnpm dlx @railway/cli up -e prod",
  "/usr/local/bin/railway up -e prod",
  "timeout 60 railway up -e prod",
  "eval railway up -e prod",
  "git push origin v1.0.0",
  "git push origin HEAD:refs/tags/v1.0.0",
  "git push --tags",
  "git push --follow-tags origin main",
  "git -C . push origin v2.3.4",
  "npx @railway/cli@5.71.0 up -e prod",
  "npx @railway/cli@latest up --environment prod",
  "railway up -e pr''od",
  "gh workflow run deploy.yml -f environment=pr''od",
  "gh workflow run deploy.yml -f environment=p\\rod",
  'gh workflow run deploy.yml -f "envi"ronment=prod',
  "git push origin 'refs/tags/*'",
  'git push origin "refs/tags/v*"',
  "git push --mirror",
  "git -c push.followTags=true push origin main",
  "git config push.followTags true && git push",
  "gh workflow run deploy.yml 2>&1 -f environment=prod",
  "railway up 2>&1 -e prod",
  "git push origin tags/v1.0.0",
  "git --git-dir .git push origin v1.0.0",
  "gh workflow run deploy.yml \\\n  -f environment=prod \\\n  -f commit_sha=abc",
  "railway up \\\n  --environment prod",
  "git push \\\n  origin v1.0.0",
  "railway up &>/dev/null -e prod",
  "git push &>/dev/null origin v1.0.0",
  "cd a\\\\\ngit push origin v1.0.0",
];

const approvalLiftsGate = ["CHG-123", "1", "CHG-1", "off", "00", " "];
const approvalKeepsGate = ["", "0", "false", "no", "FALSE", "No", "nO"];

const nonProductionCommands = [
  "gh workflow run deploy.yml -f environment=uat -f commit_sha=abc",
  "gh api repos/o/r/actions/workflows/deploy.yml/dispatches -f 'inputs[environment]=uat'",
  "railway up -e uat",
  "railway up -e prod-eu",
  "railway environment uat",
  "railway status",
  "gh workflow list",
  "gh run list --workflow deploy.yml",
  "gh api repos/o/r/environments/prod",
  "git push -u origin feature/v2-ui",
  "git push origin main",
  'git commit -m "release v1.0" && git push',
  'git commit -m "docs(x): deploy to production"',
  'gh pr create --title "ci(x): promote to prod" --body "run gh workflow run later"',
  "echo railway",
  "git tag v1.0.0",
  'git stash push -m "wip v2"',
  'git commit -m "fix(ci): push v2 images"',
  'git commit -m "fix: railway env uat and prod split"',
  "git push -u origin HEAD",
  "git push origin feature/push-v2",
  "pnpm verify 2>&1 | tail && git push",
];

const mcpTools = {
  blocked: [
    "mcp__github__merge_pull_request",
    "github__merge_pull_request",
    "github__enable_pr_auto_merge",
  ],
  allowed: ["github__create_pull_request", "github__add_issue_comment"],
};

const reviewWriteCases = [
  {
    name: "APPROVE",
    expectedExit: 2,
    toolInput: {
      method: "create",
      event: "APPROVE",
    },
  },
  {
    name: "approve in lower case",
    expectedExit: 2,
    toolInput: {
      method: "create",
      event: "approve",
    },
  },
  {
    name: "Approve in mixed case",
    expectedExit: 2,
    toolInput: {
      method: "create",
      event: "Approve",
    },
  },
  {
    name: "submit_pending with APPROVE",
    expectedExit: 2,
    toolInput: {
      method: "submit_pending",
      event: "APPROVE",
    },
  },
  {
    name: "APPROVE in a JSON string, as Cursor sends it",
    toolInput: '{"method":"create","event":"APPROVE"}',
    expectedExit: 2,
  },
  {
    name: "COMMENT",
    expectedExit: 0,
    toolInput: {
      method: "create",
      event: "COMMENT",
    },
  },
  {
    name: "REQUEST_CHANGES",
    expectedExit: 0,
    toolInput: {
      method: "submit_pending",
      event: "REQUEST_CHANGES",
    },
  },
  {
    name: "no event",
    expectedExit: 0,
    toolInput: {
      method: "create",
    },
  },
  {
    name: "an empty JSON string",
    toolInput: "{}",
    expectedExit: 0,
  },
];

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

/**
 * Create a repository on a branch, with one commit per file after an empty commit on `main`.
 * @param branch - The branch to check out.
 * @param committedFiles - Files to commit on the branch, one commit each.
 * @returns The repository directory.
 */
function createRepository(branch: string, committedFiles: string[]): string {
  const directory = mkdtempSync(path.join(tmpdir(), "agent-gates-"));

  const runGit = (...gitArguments: string[]): void => {
    execFileSync(
      "git",
      [
        "-C",
        directory,
        "-c",
        "user.name=Gate Check",
        "-c",
        "user.email=gate-check@example.com",
        "-c",
        "commit.gpgsign=false",
        ...gitArguments,
      ],
      {
        env: childEnvironment,
        stdio: "ignore",
      },
    );
  };

  runGit("init", "--initial-branch=main");
  runGit("commit", "--allow-empty", "--message", "initial");
  runGit("checkout", "-b", branch);

  for (const file of committedFiles) {
    writeFileSync(path.join(directory, path.basename(file)), "");
    runGit("add", "--all");
    runGit("commit", "--message", `add ${file}`);
  }

  return directory;
}

const fixBranch = "fix/login-error";
const featureBranch = "feat/login";
const testFileName = "login.test.ts";
const fixBranchWithTest = createRepository(fixBranch, [testFileName]);
const fixBranchWithoutTest = createRepository(fixBranch, ["login.ts"]);
const featureBranchWithTest = createRepository(featureBranch, [testFileName]);
const markerRepository = createRepository(featureBranch, []);

writeFileSync(path.join(markerRepository, ".git", "bug-fix-in-progress"), "");

const testFile = `src/${testFileName}`;
const outsideRepository = mkdtempSync(path.join(tmpdir(), "agent-gates-outside-"));

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
  ...allowedCommands.map(command => ({
    gate: shellGate,
    input: {
      command,
    },
    expectedExit: 0 as const,
    expectedPermission: "allow" as const,
    name: `shell: ${command}`,
  })),
  ...productionCommands.flatMap(command => [
    {
      gate: productionGate,
      input: {
        command,
      },
      expectedExit: 2 as const,
      name: `Cursor production: ${command}`,
    },
    {
      gate: productionGate,
      input: {
        tool_input: {
          command,
        },
      },
      expectedExit: 2 as const,
      name: `Claude production: ${command}`,
    },
  ]),
  ...approvalLiftsGate.map(releaseApproval => ({
    gate: productionGate,
    releaseApproval,
    input: {
      tool_input: {
        command: railwayProductionCommand,
      },
    },
    expectedPermission: "allow" as const,
    name: `production with RELEASE_APPROVAL="${releaseApproval}": ${railwayProductionCommand}`,
    expectedExit: 0 as const,
  })),
  ...approvalKeepsGate.map(releaseApproval => ({
    gate: productionGate,
    releaseApproval,
    input: {
      tool_input: {
        command: railwayProductionCommand,
      },
    },
    name: `production with RELEASE_APPROVAL="${releaseApproval}": ${railwayProductionCommand}`,
    expectedExit: 2 as const,
  })),
  ...nonProductionCommands.map(command => ({
    gate: productionGate,
    input: {
      command,
    },
    expectedExit: 0 as const,
    expectedPermission: "allow" as const,
    name: `production: ${command}`,
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
  ...reviewWriteCases.map(({expectedExit, name, toolInput}) => ({
    gate: mcpGate,
    input: {
      tool_input: toolInput,
      tool_name: "mcp__github__pull_request_review_write",
    },
    expectedExit: expectedExit as 0 | 2,
    name: `MCP: pull_request_review_write with ${name}`,
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
  ...[
    {
      projectDirectory: fixBranchWithTest,
      name: "fix branch with a committed test",
      expectedExit: 2,
    },
    {
      projectDirectory: fixBranchWithoutTest,
      name: "fix branch without a committed test",
      expectedExit: 0,
    },
    {
      projectDirectory: featureBranchWithTest,
      name: "other branch with a committed test",
      expectedExit: 0,
    },
    {
      projectDirectory: markerRepository,
      name: "bug-fix-in-progress marker",
      expectedExit: 2,
    },
    {
      projectDirectory: outsideRepository,
      name: "directory outside a Git repository",
      expectedExit: 0,
    },
  ].map(({expectedExit, name, projectDirectory}) => ({
    gate: testEditGate,
    projectDirectory,
    input: {
      tool_input: {
        file_path: testFile,
      },
    },
    expectedExit: expectedExit as 0 | 2,
    name: `test edit: ${name}`,
  })),
];

const failures = cases.filter(gateCase => {
  const result = spawnSync(gateCase.gate, {
    env: {
      ...childEnvironment,
      CLAUDE_PROJECT_DIR: gateCase.projectDirectory ?? process.cwd(),
      CURSOR_PROJECT_DIR: gateCase.projectDirectory ?? process.cwd(),
      RELEASE_APPROVAL: gateCase.releaseApproval,
    },
    input: JSON.stringify(gateCase.input),
  });

  const isPermissionWrong =
    gateCase.expectedPermission !== undefined &&
    (JSON.parse(result.stdout.toString()) as {permission?: string}).permission !==
      gateCase.expectedPermission;

  return result.status !== gateCase.expectedExit || isPermissionWrong;
});

for (const directory of [
  fixBranchWithTest,
  fixBranchWithoutTest,
  featureBranchWithTest,
  markerRepository,
  outsideRepository,
]) {
  rmSync(directory, {
    recursive: true,
    force: true,
  });
}

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
