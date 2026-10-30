import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";

import {developmentScripts, isStackId, stacks, templateName} from "../src/stacks.ts";

describe("stacks", () => {
  it("names the template package of a stack", () => {
    expect(templateName("nextjs")).toBe("next-friday-template-nextjs");
  });

  it("recognizes only known stacks", () => {
    expect(isStackId("nestjs")).toBe(true);
    expect(isStackId("rails")).toBe(false);
  });

  it.each(stacks.map(stack => stack.id))(
    "points %s at a development script its template defines",
    stack => {
      const manifest = JSON.parse(
        readFileSync(new URL(`../templates/${stack}/package.json`, import.meta.url), "utf8"),
      ) as {
        scripts: Record<string, string>;
      };

      expect(Object.keys(manifest.scripts)).toContain(developmentScripts[stack]);
    },
  );
});
