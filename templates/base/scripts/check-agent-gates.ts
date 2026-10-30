import {spawnSync} from "node:child_process";

type GateCase = {
  expectedExit: 0 | 2;
  gate: string;
  input: Record<string, unknown>;
  name: string;
};

const shellGate = ".agents/hooks/agent-shell-gate.sh";
const suppressionGate = ".agents/hooks/agent-suppression-gate.sh";
const constitutionGate = ".cursor/hooks/agent-constitution-gate.sh";
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
  ...allowedCommands.map(command => ({
    gate: shellGate,
    input: {
      command,
    },
    expectedExit: 0 as const,
    name: `shell: ${command}`,
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

const failures = cases.filter(gateCase => {
  const result = spawnSync(gateCase.gate, {
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: process.cwd(),
      CURSOR_PROJECT_DIR: process.cwd(),
    },
    input: JSON.stringify(gateCase.input),
  });

  return result.status !== gateCase.expectedExit;
});

if (failures.length > 0) {
  const failureLines = failures.map(
    gateCase => `- ${gateCase.name} (expected exit ${gateCase.expectedExit})`,
  );

  process.stderr.write(`Agent gate checks failed:\n${failureLines.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Checked ${cases.length} agent gate cases.\n`);
}
