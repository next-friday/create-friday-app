import {describe, expect, it} from "vitest";
import {existsSync, readFileSync} from "node:fs";

import {isStackId, stackById, stacks, templateName} from "../src/stacks.ts";

describe("stacks", () => {
  it("names the template package of a stack", () => {
    expect(templateName("nextjs")).toBe("next-friday-template-nextjs");
  });

  it("recognizes only known stacks", () => {
    expect(isStackId("nestjs")).toBe(true);
    expect(isStackId("rails")).toBe(false);
  });

  it.each(stacks.map(stack => stack.id))("names the package of the %s template", stack => {
    const manifest = JSON.parse(
      readFileSync(new URL(`../templates/${stack}/package.json`, import.meta.url), "utf8"),
    ) as {
      name: string;
    };

    expect(manifest.name).toBe(templateName(stack));
  });

  it.each(stacks.map(stack => stack.id))("ships the files the CLI writes for %s", stack => {
    for (const file of ["_gitignore", ".env.example"]) {
      expect(existsSync(new URL(`../templates/${stack}/${file}`, import.meta.url))).toBe(true);
    }
  });

  it.each(stacks.filter(stack => stack.requiresDatabase).map(stack => stack.id))(
    "keeps the PAYLOAD_SECRET line the CLI fills in for %s",
    stack => {
      expect(
        readFileSync(new URL(`../templates/${stack}/.env.example`, import.meta.url), "utf8"),
      ).toMatch(/^PAYLOAD_SECRET=/mu);
    },
  );

  it.each(stacks.map(stack => stack.id))(
    "points %s at a development script its template defines",
    stack => {
      const manifest = JSON.parse(
        readFileSync(new URL(`../templates/${stack}/package.json`, import.meta.url), "utf8"),
      ) as {
        scripts: Record<string, string>;
      };

      expect(Object.keys(manifest.scripts)).toContain(stackById[stack].developmentScript);
    },
  );
});
