import {describe, expect, it} from "vitest";

import {resolveDeploySections} from "../src/deploy-sections.ts";

const template = [
  "# Title",
  "",
  "<!-- deploy:railway -->",
  "",
  "## Deploy",
  "",
  "Railway text.",
  "",
  "<!-- deploy:end -->",
  "",
  "<!-- deploy:none -->",
  "",
  "## Deploy",
  "",
  "No deploy step.",
  "",
  "<!-- deploy:end -->",
  "",
  "## License",
  "",
].join("\n");

describe("resolveDeploySections", () => {
  it("keeps the section of the chosen deploy target and removes the others", () => {
    expect(resolveDeploySections(template, "railway")).toBe(
      "# Title\n\n## Deploy\n\nRailway text.\n\n## License\n",
    );

    expect(resolveDeploySections(template, "none")).toBe(
      "# Title\n\n## Deploy\n\nNo deploy step.\n\n## License\n",
    );
  });

  it.each([
    ["a shell or YAML comment", "a\n  # deploy:railway\n  b\n  # deploy:end\nc\n"],
    ["a TypeScript comment", "a\n  // deploy:railway\n  b\n  // deploy:end\nc\n"],
  ])("reads a marker written as %s", (_syntax, content) => {
    expect(resolveDeploySections(content, "railway")).toBe("a\n  b\nc\n");
    expect(resolveDeploySections(content, "none")).toBe("a\nc\n");
  });

  it("keeps the final newline when the file ends with an end marker", () => {
    const content = "a\n<!-- deploy:railway -->\nb\n<!-- deploy:end -->\n";

    expect(resolveDeploySections(content, "railway")).toBe("a\nb\n");
    expect(resolveDeploySections(content, "none")).toBe("a\n");
  });

  it("leaves a file with no marker line as it is", () => {
    const content = "run: deploy:all\n\n\nnext\n";

    expect(resolveDeploySections(content, "none")).toBe(content);
  });

  it.each([
    [
      "a section with no end marker",
      "# deploy:railway\na\n",
      "The deploy:railway section has no deploy:end marker.",
    ],
    [
      "an end marker outside a section",
      "a\n# deploy:end\n",
      "A deploy:end marker has no deploy target section to close.",
    ],
    [
      "a section that starts inside another",
      "# deploy:railway\n# deploy:none\n# deploy:end\n",
      "A deploy:none marker starts inside the deploy:railway section.",
    ],
  ])("rejects %s", (_case, content, message) => {
    expect(() => resolveDeploySections(content, "none")).toThrow(message);
  });
});
