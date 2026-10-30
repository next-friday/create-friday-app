import {createElement} from "react";
import {describe, expect, it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

import Page from "./page";

describe("Page", () => {
  it("renders the template heading", () => {
    expect(renderToStaticMarkup(createElement(Page))).toContain("Next Friday Next.js template");
  });
});
