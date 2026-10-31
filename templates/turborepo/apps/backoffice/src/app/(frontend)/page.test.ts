import {createElement} from "react";
import {describe, expect, it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";

import Page from "./page";

describe("Page", () => {
  it("renders the template heading and the admin link", () => {
    const html = renderToStaticMarkup(createElement(Page));

    expect(html).toContain("Next Friday Payload template");
    expect(html).toContain('href="/admin"');
  });
});
