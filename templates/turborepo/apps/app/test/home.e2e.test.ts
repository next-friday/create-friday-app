import {expect, test} from "@playwright/test";

test("serves the home page", async ({page}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
});
